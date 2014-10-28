var async = require('async');

module.exports = {

  findById: function(req, res) {
    var id = req.param('id');

    Board.findOne({id: id}).populate('columns').exec(function(err, board) {
      if (err) return res.serverError(err);

      /*
      var cardfindermaker = function(column) {
        return function(cb) {
        };
      };

      async.parallel(
      */

      res.jsonx(board);
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
      });

    });
  },

  update: function(req, res) {
    var id    = req.param('id'),
        title = req.body.title;

    Board.update(id, {title: title}).exec(function(err, board) {
      if (err) return res.serverError(err);

      res.jsonx(board);
    });
  }

};
