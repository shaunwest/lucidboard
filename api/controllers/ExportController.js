var stringify = require('csv-stringify');

module.exports = {

  csv: function(req, res) {
    var id = req.param('boardId');

    Board.loadFullById(id, function(err, board) {
      if (err) return res.serverError(err);

      var input = [['Votes', 'Column', 'Content']];

      board.columns.forEach(function(col) {
        col.cards.forEach(function(card) {
          input.push([
            card.votes.length,
            col.title,
            card.content
          ]);
        });
      });

      stringify(input, function(err, output) {
        if (err) return res.serverError(err);

        var d = new Date(), filename = board.title.replace(/[^a-z0-9-]/, '_');

        filename += '-' + (d.getMonth() + 1) + '-' + d.getDate() + '-' + d.getFullYear();

        res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-Type', 'text/csv');
        res.send(output);
      });
    });
  }

};
