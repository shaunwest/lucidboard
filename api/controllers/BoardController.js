var async = require('async'),
    _     = require('underscore'),
    redis = require('../services/redis');

// Organize cards into slots. That means that
//
//   [{..., position: 1}, {..., position: 1}, {..., position: 2}]
//
// will become
//
//   [[{..., position: 1}, {..., position: 1}], {..., position: 2}]
var normalizeStack = function(stack) {
  var buffer = [], ret = [];

  stack.forEach(function(card) {
    if (buffer.length && card.position !== buffer[0].position) {
      ret.push(buffer);
      buffer = [];
    }
    buffer.push(card);
  });

  if (buffer.length) ret.push(buffer);

  return ret;
};

// Splice out and return a card being dragged from the stack
var spliceCard = function(stack, cardId) {
  var card;

  for (var x=0; x<stack.length; x++) {
    for (var y=0; y<stack[x].length; y++) {
      if (stack[x][y].id == cardId) {
        card = stack[x].splice(y, 1)[0];
        break;
      }
    }
    if (card) {
      // splice out the empty array if we took the only card from the slot
      if (!stack[x].length) stack.splice(x, 1);
      break;
    }
  }

  return card;
};

// This function takes a multidimentional array of cards and returns the
// representation that we will use to sync up our clients. So,
//
//   [[{id: 1, position: 1}, {id: 2, position: 1}], {id: 3, position: 2}]
//
// will become
//
//   [[1, 2], [3]]
var toStackMap = function(stack) {
  var ret = [];
  stack.forEach(function(slot) { ret.push(_.pluck(slot, 'id')); });
  return ret;
};

// Fix position settings for all elements in the collection.
// Return an array of jobs to save all updated cards.
var fixPositions = function(stack, origMap) {
  var i, j, jobs = [];

  for (i=0; i<stack.length; i++) {
    for (j=0; j<stack[i].length; j++) {
      if (!origMap[i] || !origMap[i][j] || origMap[i][j] !== stack[i][j].id) {
        (function() {
          var cardToSave = stack[i][j];
          cardToSave.position = i + 1;
          jobs.push(function(cb) { cardToSave.save(cb); });
        })();
      }
    }
  }

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

    Board.loadFullById(id, function(err, board) {
      if (err) return res.serverError(err);
      if (board === false) return res.notFound();

      res.jsonx(board);
    });
  },

  create: function(req, res) {
    var user = req.user;

    var bits = {
      creator:        user.id,
      title:          req.body.title,
      votesPerUser:   req.body.votesPerUser,
      p_seeVotes:     req.body.p_seeVotes,
      p_seeContent:   req.body.p_seeContent,
      p_combineCards: req.body.p_combineCards,
      p_lock:         req.body.p_lock
    };

    // 1. Create the board
    Board.create(bits, function(err, board) {
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

    var bits = {
      title:          req.body.title,
      votesPerUser:   req.body.votesPerUser,
      p_seeVotes:     req.body.p_seeVotes,
      p_seeContent:   req.body.p_seeContent,
      p_combineCards: req.body.p_combineCards,
      p_lock:         req.body.p_lock
    };

    Board.update(id, bits).exec(function(err, board) {
      if (err) return res.serverError(err);

      board = board[0];  // grr

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
      if (err)                     return res.serverError(err);
      if (!r.card || !r.destStack) return res.notFound();

      var jobs = [], signalData = {};

      if (r.sourceStack === null) {  // source and dest stack are the same

        var destStack       = normalizeStack(r.destStack),
            originalDestMap = toStackMap(destStack),
            destIdx         = p.destPosition,
            card            = spliceCard(destStack, r.card.id);

        // Reinsert the cardSlot.
        destStack.splice(p.destPosition - 1, 0, [card]);

        // Figure out the work to actually update the db.
        jobs = fixPositions(destStack, originalDestMap);

        // Sort out card id mapping to feed to the clients.
        signalData[p.destColumnId] = toStackMap(destStack);

      } else {  // DIFFERENT source and destination stacks (columns)

        var destStack         = normalizeStack(r.destStack),
            originalDestMap   = toStackMap(destStack),
            sourceStack       = normalizeStack(r.sourceStack),
            originalSourceMap = toStackMap(sourceStack),
            card              = spliceCard(sourceStack, r.card.id),
            originalColumnId  = card.column;

        // set the new column id on the moving card
        card.column = p.destColumnId;

        // Reinsert the cardSlot
        destStack.splice(p.destPosition - 1, 0, [card]);

        // Figure out the work to actually update the db.
        jobs = fixPositions(sourceStack, originalSourceMap)
          .concat(fixPositions(destStack, originalDestMap));

        // Sort out card id mapping to feed to the clients.
        signalData[p.destColumnId]   = toStackMap(destStack);
        signalData[originalColumnId] = toStackMap(sourceStack);
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
        destCardId   = req.param('destCardId');

    if (sourceCardId === destCardId) {
      return res.badRequest('You cannot combine a card with itself!');
    }

    async.auto({
      source: function(cb) { Card.findOneById(sourceCardId).exec(cb); },
      dest:   function(cb) { Card.findOneById(destCardId).exec(cb); },
      sourceStack: ['source', function(cb, r) {
        Card.find({column: r.source.column}).sort({position: 'asc'}).exec(cb);
      }],
      destStackStack: ['dest', function(cb, r) {
        Card.find({column: r.dest.column, position: r.dest.position}).exec(cb);
      }]
    }, function(err, r) {
      if (err) return res.serverError(err);

      var sourceColumnId    = r.source.column,
          sourcePosition    = r.source.position,
          sourceStack       = normalizeStack(r.sourceStack),
          originalSourceMap = toStackMap(sourceStack),
          sourceIsFromPile  = sourceStack[sourcePosition - 1].length > 1,
          card              = spliceCard(sourceStack, r.source.id),
          jobs              = fixPositions(sourceStack, originalSourceMap),
          destPosition;

      // If we're joining a higher card with a lower card on the same stack, then the
      // desired position will have reduced by one once we eliminate the slot that the
      // source card is currently inhabiting. We'll need to adjust the destination
      // position accordingly.
      if (sourceColumnId === r.dest.column  // same column,
       && sourcePosition < r.dest.position  // dragged card is above lower one
       && !sourceIsFromPile)                // source card didn't come from a pile
      {
        r.dest.position--;
      }

      // Resituate the source card
      r.source.column    = r.dest.column;
      r.source.position  = r.dest.position;
      r.source.topOfPile = true;
      jobs.push(function(cb) { r.source.save(cb); });

      // Flip off other topOfPile flags
      r.destStackStack.forEach(function(c) {
        if (c.topOfPile) {
          c.topOfPile = false;
          jobs.push(function(cb) { c.save(cb); });
        }
      });

      // if (sourceColumnId == r.dest.column && sourcePosition < r.dest.position) {
      if (sourceColumnId == r.dest.column) {
        var extra = sourcePosition < r.dest.position ? 1 : 0;
        sourceStack[r.dest.position - 1 - extra].push(r.source);
      }

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        var signalData = {
          card:           r.source,
          sourceMap:      toStackMap(sourceStack),
          sourceColumnId: sourceColumnId
        };

        res.jsonx(signalData);

        redis.boardCombineCards(boardId, signalData);
      });
    });
  },

  // A new card is on top of a pile
  cardFlip: function(req, res) {
    var boardId   = req.param('id'),
        cardId    = req.param('cardId'),
        columnId  = req.param('columnId'),
        position  = req.param('position'),
        condition = {column: columnId, position: position},
        jobs      = [];

    Card.find(condition).sort({id: 'desc'}).exec(function(err, cards) {
      if (err) return res.serverError(err);

      cards.forEach(function(card) {
        if (card.topOfPile && card.id != cardId) {
          card.topOfPile = false;
          jobs.push(function(cb) { card.save(cb); });
        } else if (!card.topOfPile && card.id == cardId) {
          card.topOfPile = true;
          jobs.push(function(cb) { card.save(cb); });
        }
      });

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx({cardId: cardId});

        redis.boardFlipCard(boardId, cardId);
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
  }

};
