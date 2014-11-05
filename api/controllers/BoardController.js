var async = require('async'),
    _     = require('underscore'),
    redis = require('../services/redis');

module.exports = {

  getList: function(req, res) {
    Board.find({}).exec(function(err, boards) {
      if (err) return res.serverError(err);

      res.jsonx(boards);
    });
  },

  findById: function(req, res) {
    var id = req.param('id');

    async.auto({
      board: function(cb) {
        Board.findOneById(id).populate('columns').exec(cb);
      },
      cards: ['board', function(cb, results) {
        Card.find({column: _.pluck(results.board.columns, 'id')}).exec(cb);
      }],
      votes: ['cards', function(cb, results) {
        Vote.find({card: _.pluck(results.cards, 'id')}).exec(cb);
      }],
      mapCards: ['cards', function(cb, results) {
        var i, board = results.board;

        for (i=0; i<board.columns.length; i++) {
          results.cards.forEach(function(card) {
            if (card.column === board.columns[i].id) {
              var c = card.toObject(); c.votes = [];  // wtf, mate
              board.columns[i].cards.push(c);
            }
          });
        }

        cb(null, board);
      }],
      mapVotes: ['votes', 'mapCards', function(cb, results) {
        results.votes.forEach(function(vote) {
          for (var i=0; i<results.board.columns.length; i++) {
            for (var j=0; j<results.board.columns[i].cards.length; j++) {
              if (results.board.columns[i].cards[j].id === vote.card) {
                results.board.columns[i].cards[j].votes.push(vote.toObject());
              }
            }
          }
        });
        cb(null, results.board);
      }]
    }, function(err, results) {
      if (err) return res.serverError(err);

      res.jsonx(results.mapVotes);
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

        redis.boardCreated(board);
      });

    });
  },

  update: function(req, res) {
    var id    = req.param('id'),
        title = req.body.title;

    Board.update(id, {title: title}).exec(function(err, board) {
      if (err) return res.serverError(err);

      res.jsonx(board);

      redis.boardUpdated(board);
    });
  }

};
