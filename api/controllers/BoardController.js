var async   = require('async'),
    _       = require('underscore'),
    redis   = require('../services/redis'),
    util    = require('../services/util'),
    config  = require('../services/config');

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
    var bits = {
      creator:        req.user.id,
      colsetId:       req.body.colsetId,
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
      var pos = 1, jobs = [colmakermaker('Trash', 0)], colsetsById = config.colsetsById();
      (colsetsById[bits.colsetId] || colsetsById[1]).cols.forEach(function(name) {
        jobs.push(colmakermaker(name, pos));
        pos++;
      });
      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        board.columns = results;

        res.jsonx(board);

        redis.boardCreated(board);
      });

    });
  },

  update: function(req, res) {
    var id    = parseInt(req.param('id')),
        title = req.body.title;

    var bits = {
      title:          req.body.title,
      votesPerUser:   req.body.votesPerUser,
      p_seeVotes:     req.body.p_seeVotes,
      p_seeContent:   req.body.p_seeContent,
      p_combineCards: req.body.p_combineCards,
      p_lock:         req.body.p_lock
    };

    util.boardIsLegitAndOwnedBy(id, req, res, function(board) {
      if (!board) return;
      Board.update(id, bits).exec(function(err, board) {
        if (err) return res.serverError(err);
        res.jsonx(board[0]);
        redis.boardUpdated(board[0]);
      });
    });
  },

  moveCard: function(req, res) {
    var boardId = req.param('id');

    var p = {
      cardId:       parseInt(req.param('cardId')),
      destColumnId: parseInt(req.param('destColumnId')),
      destPosition: parseInt(req.param('destPosition'))
    };

    async.auto({
      card:  function(cb) { Card.findOneById(p.cardId).exec(cb); },
      destColumn: function(cb) {
        Column.findOne({board: boardId, id: p.destColumnId}).exec(cb);
      },
      destStack: function(cb) {
        Card.find({column: p.destColumnId}).sort({position: 'asc'}).exec(cb);
      },
      sourceColumn: ['card', function(cb, r) {
        if (r.card.column === p.destColumnId) return cb(null, null);  // we already got this!
        Column.findOne({board: boardId, id: r.card.column}).exec(cb);
      }],
      sourceStack: ['card', function(cb, r) {
        if (r.card.column === p.destColumnId) return cb(null, null);  // we already got this!
        Card.find({column: r.card.column}).sort({position: 'asc'}).exec(cb);
      }]
    }, function(err, r) {
      if (err)                                                       return res.serverError(err);
      if (!r.card || !r.destColumn || !r.destStack)                  return res.notFound();
      if (((r.card.column === p.destColumnId) &&  r.sourceColumn)
       || ((r.card.column !== p.destColumnId) && !r.sourceColumn))   return res.notFound();

      var jobs = [], signalData = {}, destStack = util.normalizeStack(r.destStack);

      if (p.destPosition < 1 || p.destPosition > destStack.length+1) return res.badRequest();
      if (p.destPosition % 1 !== 0)                                  return res.badRequest();

      // Vaporize card if it is empty and headed for the trash
      if (!r.card.content && r.destColumn.position === 0) {

        var sourceColumn      = r.sourceColumn || r.destColumn,
            sourceStack       = util.normalizeStack(r.sourceStack || r.destStack),
            originalSourceMap = util.toStackMap(sourceStack),
            card              = util.spliceCard(sourceStack, r.card.id);

        // Actually delete the card from the db
        jobs.push(function(cb) { Card.destroy({id: card.id}).exec(cb); });

        // Save resorted source column
        jobs = jobs.concat(util.fixPositions(sourceStack, originalSourceMap));

        // Send specific message event to vaporize this card
        redis.cardVaporize(boardId, card.id);

        signalData[sourceColumn.id] = util.toStackMap(sourceStack);

      } else if (r.sourceStack === null) {  // source and dest stack are the same

        var destStack       = util.normalizeStack(r.destStack),
            originalDestMap = util.toStackMap(destStack),
            destIdx         = p.destPosition,
            card            = util.spliceCard(destStack, r.card.id);

        // Reinsert the cardSlot.
        destStack.splice(p.destPosition - 1, 0, [card]);

        // Figure out the work to actually update the db.
        jobs = util.fixPositions(destStack, originalDestMap);

        // Sort out card id mapping to feed to the clients.
        signalData[p.destColumnId] = util.toStackMap(destStack);

      } else {  // DIFFERENT source and destination stacks (columns)

        var destStack         = util.normalizeStack(r.destStack),
            originalDestMap   = util.toStackMap(destStack),
            sourceStack       = util.normalizeStack(r.sourceStack),
            originalSourceMap = util.toStackMap(sourceStack),
            card              = util.spliceCard(sourceStack, r.card.id),
            originalColumnId  = card.column;

        // set the new column id on the moving card
        card.column = p.destColumnId;

        // Reinsert the cardSlot
        destStack.splice(p.destPosition - 1, 0, [card]);

        // Figure out the work to actually update the db.
        jobs = util.fixPositions(sourceStack, originalSourceMap)
          .concat(util.fixPositions(destStack, originalDestMap));

        // Sort out card id mapping to feed to the clients.
        signalData[p.destColumnId]   = util.toStackMap(destStack);
        signalData[originalColumnId] = util.toStackMap(sourceStack);
      }

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx(signalData);

        redis.boardMoveCards(boardId, signalData);
      });

    });

  },

  movePile: function(req, res) {
    var boardId = parseInt(req.param('id'));

    var p = {
      sourceColumnId: parseInt(req.param('sourceColumnId')),
      sourcePosition: parseInt(req.param('sourcePosition')),
      destColumnId:   parseInt(req.param('destColumnId')),
      destPosition:   parseInt(req.param('destPosition'))
    };

    async.auto({
      sourceColumn: function(cb) {
        Column.find({board: boardId, id: p.sourceColumnId}).exec(cb);
      },
      sourceStack: function(cb) {
        Card.find({column: p.sourceColumnId}).sort({position: 'asc'}).exec(cb);
      },
      destColumn: function(cb) {
        if (p.sourceColumnId === p.destColumnId) return cb(null, null);
        Column.find({board: boardId, id: p.destColumnId}).exec(cb);
      },
      destStack: function(cb) {
        if (p.sourceColumnId === p.destColumnId) return cb(null, null);
        Card.find({column: p.destColumnId}).sort({position: 'asc'}).exec(cb);
      }
    }, function(err, r) {
      if (err)                                                           return res.serverError(err);
      if (!r.sourceColumn || !r.destColumn)                              return res.notFound();
      if (((p.sourceColumnId === p.destColumnId) &&  r.destColumn)
       || ((p.sourceColumnId !== p.destColumnId) && !r.destColumn))      return res.notFound();

      var sourceStack       = util.normalizeStack(r.sourceStack),
          destStack         = r.destStack ? util.normalizeStack(r.destStack) : null;

      if (p.sourcePosition < 1 || p.sourcePosition > sourceStack.length) return res.badRequest();
      if (p.destPosition   < 1 || p.destPosition   > destStack.length+1) return res.badRequest();
      if (p.sourcePosition % 1 !== 0 || p.destPosition % 1 !== 0)        return res.badRequest();

      var originalSourceMap = util.toStackMap(sourceStack),
          originalDestMap   = r.destStack ? util.toStackMap(destStack) : null,
          pile              = sourceStack.splice(p.sourcePosition - 1, 1)[0],
          extra             = (p.sourcePosition < p.destPosition && !destStack) ? 1 : 0,
          jobs              = [],
          signalData        = {};


      // Set the new column id on the moving cards
      pile.forEach(function(card) {
        card.column   = p.destColumnId;
        card.position = p.destPosition;
        jobs.push(function(cb) { card.save(cb); });
      });

      // Splice in the pile to the destination
      (destStack || sourceStack).splice(p.destPosition - 1 - extra, 0, pile);

      // Figure out the work to actually update the db.
      jobs = util.fixPositions(sourceStack, originalSourceMap)
        .concat(destStack ? util.fixPositions(destStack, originalDestMap) : []);

      // Sort out card id mapping to feed to the clients.
      signalData[p.sourceColumnId] = util.toStackMap(sourceStack);

      if (destStack) signalData[p.destColumnId] = util.toStackMap(destStack);

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx(signalData);

        redis.boardMoveCards(boardId, signalData);
      });

    });

  },

  combineCards: function(req, res) {
    var boardId = parseInt(req.param('id'));

    var p = {
      sourceCardId: parseInt(req.param('sourceCardId')),
      destCardId:   parseInt(req.param('destCardId'))
    };

    if (p.sourceCardId === p.destCardId) {
      return res.badRequest('You cannot combine a card with itself!');
    } else if (!p.sourceCardId || !p.destCardId) {
      return res.badRequest('sourceCardId and destCardId are required.');
    }

    async.auto({
      board:  function(cb) { Board.findOneById(boardId).exec(cb); },
      source: function(cb) { Card.findOneById(p.sourceCardId).exec(cb); },
      dest:   function(cb) { Card.findOneById(p.destCardId).exec(cb); },
      sourceColumn: ['source', function(cb, r) {
        Column.findOneById(r.source.column).exec(cb);
      }],
      sourceStack: ['source', function(cb, r) {
        Card.find({column: r.source.column}).sort({position: 'asc'}).exec(cb);
      }],
      destStack: ['dest', function(cb, r) {
        Column.findOneById(r.dest.column).exec(cb);
      }],
      destStackStack: ['dest', function(cb, r) {
        Card.find({column: r.dest.column, position: r.dest.position}).exec(cb);
      }]
    }, function(err, r) {
      if (err) return res.serverError(err);

      // TODO - continue my work in security things here

      var sourceColumnId    = r.source.column,
          sourcePosition    = r.source.position,
          sourceStack       = util.normalizeStack(r.sourceStack),
          originalSourceMap = util.toStackMap(sourceStack),
          sourceIsFromPile  = sourceStack[sourcePosition - 1].length > 1,
          card              = util.spliceCard(sourceStack, r.source.id),
          jobs              = util.fixPositions(sourceStack, originalSourceMap),
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
          sourceMap:      util.toStackMap(sourceStack),
          sourceColumnId: sourceColumnId
        };

        res.jsonx(signalData);

        redis.boardCombineCards(boardId, signalData);
      });
    });
  },

  combinePiles: function(req, res) {
    var boardId = req.param('id');

    var p = {
      sourceColumnId: parseInt(req.param('sourceColumnId')),
      sourcePosition: parseInt(req.param('sourcePosition')),
      destCardId:     parseInt(req.param('destCardId'))
    };

    // if (p.sourceCardId === p.destCardId) {
    //   return res.badRequest('You cannot combine a card with itself!');
    // } else if (!p.sourceCardId || !p.destCardId) {
    //   return res.badRequest('sourceCardId and destCardId are required.');
    // }

    async.auto({
      dest: function(cb) { Card.findOneById(p.destCardId).exec(cb); },
      sourceStack: function(cb, r) {
        Card.find({column: p.sourceColumnId}).sort({position: 'asc'}).exec(cb);
      },
      destStack: ['dest', function(cb, r) {
        Card.find({column: r.dest.column}).sort({position: 'asc'}).exec(cb);
      }]
    }, function(err, r) {
      if (err) return res.serverError(err);

      var sourceStack       = util.normalizeStack(r.sourceStack),
          originalSourceMap = util.toStackMap(sourceStack),
          destStack         = util.normalizeStack(r.destStack),
          originalDestMap   = util.toStackMap(destStack),
          pile              = sourceStack.splice(p.sourcePosition - 1, 1)[0],
          jobs              = util.fixPositions(sourceStack, originalSourceMap);
          // destPosition;

      // If we're joining a higher card with a lower card on the same stack, then the
      // desired position will have reduced by one once we eliminate the slot that the
      // source card is currently inhabiting. We'll need to adjust the destination
      // position accordingly.
      if (p.sourceColumnId === r.dest.column   // same column,
       && p.sourcePosition < r.dest.position)  // dragged card is above lower one
      {
        r.dest.position--;
      }

      // If source and dest are the same stack, splice out the same source cards from
      // the destStack.
      if (p.sourceColumnId === r.dest.column) {
        destStack.splice(p.sourcePosition - 1, 1);
      }

      // Resituate the moving cards
      pile.forEach(function(c) {
        c.column    = r.dest.column;
        c.position  = r.dest.position;
        jobs.push(function(cb) { c.save(cb); });
      });

      // Flip off other topOfPile flags on the target stack
      destStack[r.dest.position - 1].forEach(function(c) {
        if (c.topOfPile) {
          c.topOfPile = false;
          jobs.push(function(cb) { c.save(cb); });
        }
      });

      // if (p.sourceColumnId == r.dest.column) {
      //   var extra = p.sourcePosition < r.dest.position ? 1 : 0;
      //   sourceStack[r.dest.position - 1 - extra].concat(pile);
      // }

      destStack[r.dest.position - 1] = destStack[r.dest.position - 1].concat(pile);

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        var signalData = {};
        signalData[r.dest.column] = util.toStackMap(destStack);
        if (p.sourceColumnId != r.dest.column) {
          signalData[p.sourceColumnId] = util.toStackMap(sourceStack);
        }

        res.jsonx(signalData);

        redis.boardMoveCards(boardId, signalData);
      });
    });
  },

  // A new card is on top of a pile
  cardFlip: function(req, res) {
    var boardId   = parseInt(req.param('id')),
        cardId    = parseInt(req.param('cardId')),
        columnId  = parseInt(req.param('columnId')),
        position  = parseInt(req.param('position')),
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
    var boardId = parseInt(req.param('id')),
        seconds = parseInt(req.param('seconds'));

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

  config: function(req, res) {
    res.jsonx(config.all());
  }

};
