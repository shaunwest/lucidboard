var async = require('async');

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

// If there is no board passed to the callback, you can assume we've already handled res.
var boardIsLegitAndOwnedBy = function(id, req, res, cb) {
  Board.findOneById(id).exec(function(err, board) {
    var failed = false;
    res.on('finish', function() { failed = true; });

    if (err)                                res.serverError(err);
    else if (!board)                        res.notFound();
    else if (board.creator !== req.user.id) res.forbidden();

    cb(failed ? null : board);

    /*
    if (err) {
      res.serverError(err);
    } else if (!board) {
      res.notFound();
    } else if (board.creator !== req.user.id) {
      res.forbidden();
      board = null;
    }

    cb(board);
    */
  });
};

// If the callback gets null, you can assume we've already handled res.
var getCardAndBoard = function(cardId, boardId, req, res, cb) {
  async.auto({
    board:  function(_cb) { Board.findOneById(boardId).exec(_cb); },
    card:   function(_cb) { Card.findOneById(cardId).exec(_cb); },
    column: ['card', function(_cb, r) { Column.findOneById(r.card.column).exec(_cb); }]
  }, function(err, r) {
    var failed = false;
    res.on('finish', function() { failed = true; });

    if (err)                                   res.serverError(err);
    else if (!r.card || !r.column || !r.board) res.notFound();
    else if (r.card.column !== r.column.id)    res.notFound();
    else if (r.column.board !== r.board.id)    res.notFound();

    cb(failed ? null : r);
  });
};

module.exports = {
  normalizeStack:         normalizeStack,
  spliceCard:             spliceCard,
  toStackMap:             toStackMap,
  fixPositions:           fixPositions,
  boardIsLegitAndOwnedBy: boardIsLegitAndOwnedBy,
  getCardAndBoard:        getCardAndBoard
};
