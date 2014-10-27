module.exports = {

  findById: function(req, res) {
    var id = req.param('id');
    // console.log('id', id);
    // console.log('Board', Board);
    // process.exit();

    Board.findOne({id: id}).populate('fff').exec(function(err, board) {
      console.log('and', err, board);
      if (err) return res.serverError(err);

      res.jsonx(board);
    });
  },

  create: function(req, res) {
    var title = req.body.title;

    // 1. Create the board
    Board.create({title: title, creator: req.user.id}, function(err, board) {
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

  }
};
