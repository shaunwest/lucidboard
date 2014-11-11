var redis = require('../services/redis');

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
  }

};
