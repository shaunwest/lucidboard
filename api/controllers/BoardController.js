var async   = require('async'),
    _       = require('underscore'),
    redis   = require('../services/redis'),
    colsets = require('../services/colsets').byId();

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
      var pos = 1, jobs = [colmakermaker('Trash', 0)];
      (colsets[bits.colsetId] || colsets[1]).cols.forEach(function(name) {
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

        redis.boardMoveCards(boardId, signalData);
      });

    });

  },

  movePile: function(req, res) {
    var boardId = req.param('id');

    var p = {
      sourceColumnId: req.param('sourceColumnId'),
      sourcePosition: req.param('sourcePosition'),
      destColumnId:   req.param('destColumnId'),
      destPosition:   req.param('destPosition')
    };

    // FIXME omg security
    // FIXME handle position fields better? (source column)

    async.auto({
      sourceStack: function(cb) {
        Card.find({column: p.sourceColumnId}).sort({position: 'asc'}).exec(cb);
      },
      destStack: function(cb) {
        if (p.sourceColumnId === p.destColumnId) return cb(null, null);
        Card.find({column: p.destColumnId}).sort({position: 'asc'}).exec(cb);
      }
    }, function(err, r) {
      if (err)                                                 return res.serverError(err);
      if (!r.sourceStack)                                      return res.notFound();
      if (p.sourceColumnId !== p.destColumnId && !r.destStack) return res.notFound();

      var sourceStack       = normalizeStack(r.sourceStack),
          originalSourceMap = toStackMap(sourceStack),
          destStack         = r.destStack ? normalizeStack(r.destStack) : null,
          originalDestMap   = r.destStack ? toStackMap(destStack) : null,
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
      jobs = fixPositions(sourceStack, originalSourceMap)
        .concat(destStack ? fixPositions(destStack, originalDestMap) : []);

      // Sort out card id mapping to feed to the clients.
      signalData[p.sourceColumnId] = toStackMap(sourceStack);

      if (destStack) signalData[p.destColumnId] = toStackMap(destStack);

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx(signalData);

        redis.boardMoveCards(boardId, signalData);
      });

    });

  },

  combineCards: function(req, res) {
    var boardId = req.param('id');

    var p = {
      sourceCardId: req.param('sourceCardId'),
      destCardId:   req.param('destCardId')
    };

    if (p.sourceCardId === p.destCardId) {
      return res.badRequest('You cannot combine a card with itself!');
    } else if (!p.sourceCardId || !p.destCardId) {
      return res.badRequest('sourceCardId and destCardId are required.');
    }

    async.auto({
      source: function(cb) { Card.findOneById(p.sourceCardId).exec(cb); },
      dest:   function(cb) { Card.findOneById(p.destCardId).exec(cb); },
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

  combinePiles: function(req, res) {
    var boardId = req.param('id');

    var p = {
      sourceColumnId: req.param('sourceColumnId'),
      sourcePosition: req.param('sourcePosition'),
      destCardId:     req.param('destCardId')
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

      var sourceStack       = normalizeStack(r.sourceStack),
          originalSourceMap = toStackMap(sourceStack),
          destStack         = normalizeStack(r.destStack),
          originalDestMap   = toStackMap(destStack),
          pile              = sourceStack.splice(p.sourcePosition - 1, 1)[0],
          jobs              = fixPositions(sourceStack, originalSourceMap);
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
        signalData[r.dest.column] = toStackMap(destStack);
        if (p.sourceColumnId != r.dest.column) {
          signalData[p.sourceColumnId] = toStackMap(sourceStack);
        }

        res.jsonx(signalData);

        redis.boardMoveCards(boardId, signalData);
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
  },

  colsets: function(req, res) {
    res.jsonx(colsets);
  }

};
