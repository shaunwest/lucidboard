var async = require('async'),
    _     = require('underscore'),
    redis = require('../services/redis');

var fixPositions = function(collection, originalMap) {
  var jobs = [];

  // reset positions according to spliced changes
  for (i=0; i<collection.length; i++) collection[i].position = i + 1;

  // save records that need saving
  for (i=0; i<collection.length; i++) {
    if (collection[i].id === originalMap[i]) continue;
    (function() {
      var cardToSave = collection[i];
      jobs.push(function(cb) { cardToSave.save(cb); });
    })();
  };

  return jobs;
};

module.exports = {

  getList: function(req, res) {
    Board.find({}).exec(function(err, boards) {
      if (err) return res.serverError(err);

      res.jsonx(boards.map(function(b) {
        return {id: b.id, title: b.title};
      }));
    });
  },

  findById: function(req, res) {
    var id = req.param('id');

    async.auto({
      board: function(cb) {
        Board.findOneById(id).populate('columns').exec(cb);
      },
      cards: ['board', function(cb, results) {
        Card.find({column: _.pluck(results.board.columns, 'id')}).exec(cb);
      }],
      votes: ['cards', function(cb, results) {
        Vote.find({card: _.pluck(results.cards, 'id')}).exec(cb);
      }],
      mapCards: ['cards', function(cb, results) {
        var i, board = results.board;

        for (i=0; i<board.columns.length; i++) {
          results.cards.forEach(function(card) {
            if (card.column === board.columns[i].id) {
              var c = card.toObject(); c.votes = [];  // wtf, mate
              board.columns[i].cards.push(c);
            }
          });
        }

        cb(null, board);
      }],
      mapVotes: ['votes', 'mapCards', function(cb, results) {
        results.votes.forEach(function(vote) {
          for (var i=0; i<results.board.columns.length; i++) {
            for (var j=0; j<results.board.columns[i].cards.length; j++) {
              if (results.board.columns[i].cards[j].id === vote.card) {
                results.board.columns[i].cards[j].votes.push(vote.toObject());
              }
            }
          }
        });
        cb(null, results.board);
      }]
    }, function(err, results) {
      if (err) return res.serverError(err);

      res.jsonx(results.mapVotes);
    });
  },

  create: function(req, res) {
    var user  = req.user,
        title = req.body.title;

    // 1. Create the board
    Board.create({title: title, creator: user.id}, function(err, board) {
      if (err) return res.serverError(err);

      var colmakermaker = function(title, pos) {
        return function(cb) {
          Column.create({title: title, position: pos, board: board.id}, cb);
        }
      };

      // 2. Create starter columns
      async.parallel({
        trash:    colmakermaker('Trash', 0),
        firstcol: colmakermaker('First Column', 1)
      }, function(err, results) {
        if (err) return res.serverError(err);

        board.columns = [results.trash, results.firstcol];

        res.jsonx(board);

        redis.boardCreated(board);
      });

    });
  },

  update: function(req, res) {
    var id    = req.param('id'),
        title = req.body.title;

    Board.update(id, {title: title}).exec(function(err, board) {
      if (err) return res.serverError(err);

      res.jsonx(board);

      redis.boardUpdated(board);
    });
  },

  moveCard: function(req, res) {
    var boardId = req.param('id');

    var p = {
      cardId:       req.param('cardId'),
      destColumnId: req.param('destColumnId'),
      destPosition: req.param('destPosition')
    };

    // FIXME omg security
    // FIXME handle position fields better? (source column)

    async.auto({
      card:  function(cb) { Card.findOneById(p.cardId).exec(cb); },
      destStack: function(cb) {
        Card.find({column: p.destColumnId}).sort({position: 'asc'}).exec(cb);
      },
      sourceStack: ['card', function(cb, r) {
        if (r.card.column === p.destColumnId) return cb(null, null);  // we already got this!
        Card.find({column: r.card.column}).sort({position: 'asc'}).exec(cb);
      }]
    }, function(err, r) {
      if (err) return res.serverError(err);
      if (!r.card || !r.destStack) return res.notFound();

      var i, jobs, signalData = {}, originalDestMap = _.pluck(r.destStack, 'id');

      if (r.sourceStack === null) {  // source and dest stack are the same

        var card = r.destStack.splice(r.card.position - 1, 1)[0];
        r.destStack.splice(p.destPosition - 1, 0, card);

        jobs = fixPositions(r.destStack, originalDestMap);

        signalData[p.destColumnId] = _.pluck(r.destStack, 'id');

      } else {  // DIFFERENT source and destination stacks

        var originalSourceMap = _.pluck(r.sourceStack, 'id');
        var card = r.sourceStack.splice(r.card.position - 1, 1)[0];
        r.destStack.splice(p.destPosition - 1, 0, card);

        // set the new column id on the moving card
        r.destStack[p.destPosition - 1].column = p.destColumnId;

        // remove the moving card from the original mapping
        originalDestMap = originalDestMap.filter(function(c) {
          return c.id !== r.card.id;
        });

        jobs = fixPositions(r.sourceStack, originalSourceMap)
          .concat(fixPositions(r.destStack, originalDestMap));

        signalData[p.destColumnId] = _.pluck(r.destStack, 'id');
        signalData[r.card.column]  = _.pluck(r.sourceStack, 'id');
      }

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx(signalData);

        redis.boardMoveCard(boardId, signalData);
      });

    });

  },

  combineCards: function(req, res) {
    var boardId      = req.param('id'),
        sourceCardId = req.param('sourceCardId'),
        destCardId   = req.param('destCardId'),
        jobs         = [],
        originalSourceMap;

    if (sourceCardId === destCardId) {
      return res.badRequest('You cannot combine a card with itself!');
    }

    async.auto({
      source: function(cb) { Card.findOneById(sourceCardId).populate('votes').exec(cb); },
      dest:   function(cb) { Card.findOneById(destCardId).populate('votes').exec(cb); },
      sourceStack: ['source', function(cb, r) {
        Card.find({column: r.source.column}).sort({position: 'asc'}).exec(cb);
      }]
    }, function(err, r) {
      if (err) return res.serverError(err);

      originalSourceMap = _.pluck(r.sourceStack, 'id');

      // Move votes to new card
      r.source.votes.forEach(function(v) {
        v.card = destCardId;
        r.dest.votes.push(v);  // this is just for the returned signalData
        jobs.push(function(cb) { v.save(cb); });
      });

      // +1 to attached property for the card
      r.dest.attached++;
      r.dest.content += "\n" + r.source.content
      jobs.push(function(cb) { r.dest.save(cb); });

      // Destroy the source card!
      jobs.push(function(cb) { r.source.destroy(cb); });

      // Splice out the source card from the source Stack
      r.sourceStack.splice(r.source.position - 1, 1);

      // save all cards in the source stack that need positions reordered
      jobs = jobs.concat(fixPositions(r.sourceStack, originalSourceMap));

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        var signalData = {
          sourceCardId:   r.source.id,
          sourceColumnId: r.source.column,
          sourceMap:      _.pluck(r.sourceStack, 'id'),
          destCard:       r.dest
        };

        res.jsonx(signalData);

        redis.boardCombineCards(boardId, signalData);
      });
    });
  },

  timerStart: function(req, res) {
    var boardId = req.param('id'),
        seconds = req.param('seconds');

    var bits = {
      timerStart:  new Date(),
      timerLength: seconds
    };

    Board.update(boardId, bits).exec(function(err, board) {
      if (err) return res.serverError(err);

      res.jsonx(board);

      redis.boardTimerStart(boardId, seconds);
    });
  },

};
