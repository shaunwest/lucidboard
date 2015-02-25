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

var boardIsLegitAndOwnedBy = function(id, req, res, cb) {
  Board.findOneById(id).exec(function(err, board) {
    if (err)                           return res.serverError(err);
    if (!board)                        return res.notFound();
    if (board.creator !== req.user.id) return res.forbidden();

    cb(board);
  });
};

module.exports = {
  normalizeStack:         normalizeStack,
  spliceCard:             spliceCard,
  toStackMap:             toStackMap,
  fixPositions:           fixPositions,
  boardIsLegitAndOwnedBy: boardIsLegitAndOwnedBy
};
