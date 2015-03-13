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
    var boardId = req.param('boardId'),
        title   = req.body.title;

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
  },

  update: function(req, res) {
    var boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        title    = req.body.title;

    Column.update(columnId, {title: title}).exec(function(err, column) {
      if (err) return res.serverError(err);

      // FIXME: why oh why do I need this?
      column = column[0];

      res.jsonx(column);

      redis.columnUpdated(column);
    });
  },

  move: function(req, res) {
    var boardId      = parseInt(req.param('boardId')),
        columnId     = parseInt(req.param('columnId')),
        destPosition = parseInt(req.body.destPosition);

    async.auto({
      columns: function(cb) { Column.find({board: boardId}).sort({position: 'asc'}).exec(cb); },
    }, function(err, r) {
      if (err)                             return res.serverError(err);
      if (destPosition < 1)                return res.badRequest();
      if (destPosition > r.columns.length) return res.badRequest();

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
  }

};
