var redis = require('../services/redis'),
    _     = require('underscore');

var getNextColumnPosition = function(boardId, cb) {
  Board.findOne({id: boardId}).populate('columns').exec(function(err, board) {
    if (err) return cb(err);

    var max = 0;

    board.columns.forEach(function(c) {
      if (c.position > max) max = c.position;
    });

    cb(null, max + 1);
  });
};

module.exports = {

  create: function(req, res) {
    var boardId = parseInt(req.param('boardId')),
        title   = req.body.title,
        user    = req.user;

    if (!boardId) return res.badRequest();

    Board.findOneById(boardId).exec(function(err, board) {
      if (err)                       return res.serverError(err);
      if (!board)                    return res.notFound();
      if (board.creator !== user.id) return res.forbidden();

      getNextColumnPosition(boardId, function(err, nextpos) {
        if (err) return res.serverError(err);

        var attributes = {
          title:    title,
          position: nextpos,
          board:    boardId
        };

        Column.create(attributes, function(err, column) {
          if (err) return res.serverError(err);

          res.jsonx(column);

          redis.columnCreated(column);
        });
      });
    });
  },

  update: function(req, res) {
    var boardId  = parseInt(req.param('boardId')),
        columnId = parseInt(req.param('columnId')),
        title    = req.body.title,
        user     = req.user;

    async.auto({
      board:  function(cb) { Board.findOneById(boardId).exec(cb); },
      column: function(cb) { Column.findOneById(columnId).exec(cb); },
    }, function(err, r) {
      if (err)                           return res.serverError(err);
      if (r.column.board !== r.board.id) return res.notFound();
      if (r.board.creator !== user.id)   return res.forbidden();

      Column.update(columnId, {title: title}).exec(function(err, column) {
        if (err) return res.serverError(err);

        res.jsonx(column[0]);

        redis.columnUpdated(column[0]);
      });
    });
  },

  move: function(req, res) {
    var boardId      = parseInt(req.param('boardId')),
        columnId     = parseInt(req.param('columnId')),
        destPosition = parseInt(req.body.destPosition),
        user         = req.user;

    async.auto({
      board:   function(cb) { Board.findOneById(boardId).exec(cb); },
      columns: function(cb) { Column.find({board: boardId}).sort({position: 'asc'}).exec(cb); },
    }, function(err, r) {
      if (err)                             return res.serverError(err);
      if (!r.board)                        return res.notFound();
      if (destPosition < 1)                return res.badRequest();
      if (destPosition > r.columns.length) return res.badRequest();
      if (r.board.creator !== user.id)     return res.forbidden();

      var columns     = r.columns,
          originalMap = _.pluck(columns, 'id'),
          idx         = originalMap.indexOf(columnId);

      // Make sure the defined columnId exists within the board (and find its index).
      if (idx === -1) return res.badRequest();

      var column      = columns.splice(idx, 1)[0],
          jobs        = [],
          signalData  = [];

      if (idx < destPosition) destPosition--;

      columns.splice(destPosition, 0, column);  // Reinsert the column

      jobs = util.fixColumnPositions(columns, originalMap);

      signalData = _.pluck(columns, 'id');

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx(signalData);

        redis.boardMoveColumns(boardId, signalData);
      });
    });
  },

  delete: function(req, res) {
    var boardId  = parseInt(req.param('boardId')),
        columnId = parseInt(req.param('columnId')),
        user     = req.user;

    if (!boardId || !columnId) return res.badRequest();

    async.auto({
      board:   function(cb) { Board.findOneById(boardId).exec(cb); },
      columns: function(cb) { Column.find({board: boardId}).sort({position: 'asc'}).exec(cb); },
      cards:   function(cb) { Card.find({column: columnId}).sort({position: 'asc'}).exec(cb); },
      trash:   function(cb) { Column.findOne({board: boardId, position: 0}).exec(cb); },
      trCards: ['trash', function(cb, r) {
        Card.find({column: r.trash.id}).sort({position: 'asc'}).exec(cb);
      }]
    }, function(err, r) {
      if (err)                                return res.serverError(err);
      if (!r.board || !r.columns || !r.trash) return res.badRequest();
      if (r.board.creator !== user.id)        return res.forbidden();

      var nextPosition = r.trCards.length + 1,
          columns      = r.columns,
          idx          = _.findIndex(columns, function(c) { return c.id === columnId; }),
          column       = columns.splice(idx, 1)[0],
          jobs         = [];

      if (idx === undefined)     return res.badRequest();  // columnId wasn't on specified board!
      if (column.position === 0) return res.badRequest();  // no deleting the Trash!

      // Move all cards to the trash
      r.cards.forEach(function(c) {
        (function() {
          var card = c;
          card.column   = r.trash.id;
          card.position = nextPosition;
          nextPosition++;
          jobs.push(function(cb) { card.save(cb); });
        })();
      });

      // Renumber column positions to make up for the gap
      for (var i=idx; i<columns.length; i++) {
        (function() {
          var col = columns[i];
          col.position--;
          jobs.push(function(cb) { col.save(cb); });
        })();
      }

      // Delete the column
      jobs.push(function(cb) { column.destroy(cb); });

      async.parallel(jobs, function(err, results) {
        if (err) return res.serverError(err);

        res.jsonx(true);

        redis.trashCardsAndDeleteColumn(boardId, columnId);
      });
    });

  }

};
