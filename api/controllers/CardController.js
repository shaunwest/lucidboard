var redis = require('../services/redis');

var getNextCardPosition = function(columnId, cb) {
  Column.findOne({id: columnId}).populate('cards').exec(function(err, column) {
    if (err) return cb(err);

    var max = 0;

    column.cards.forEach(function(c) {
      if (c.position > max) max = c.position;
    });

    cb(null, max + 1);
  });
};

module.exports = {

  create: function(req, res) {
    var user     = req.user,
        boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        content  = req.body.content;

    getNextCardPosition(columnId, function(err, nextpos) {
      if (err) return res.serverError(err);

      var attributes = {
        creator:  user.id,
        content:  content,
        position: nextpos,
        column:   columnId
      };

      Card.create(attributes, function(err, card) {
        if (err) return res.serverError(err);

        res.jsonx(card);

        redis.cardCreated(boardId, card);
      });
    });
  },

  update: function(req, res) {
    var boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        cardId   = req.param('cardId'),
        content  = req.body.content,
        bits;

    bits = {
      content: content
    };

    Card.update(cardId, bits).populate('votes').exec(function(err, card) {
      if (err) return res.serverError(err);

      // FIXME: why oh why do I need this?
      card = card[0];

      res.jsonx(card);

      redis.cardUpdated(boardId, card);
    });
  },

  upvote: function(req, res) {
    var user     = req.user,
        boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        cardId   = req.param('cardId');

    // FIXME: especially when we implement permissions, be sure and revisit ensuring
    //        that the card belongs to the column, which belongs to be board that we
    //        expect! Also, check this sort of thing with the other methods.

    // Let's make sure they haven't voted too much. This probably could be faster...
    Board.loadFullById(boardId, function(err, board) {
      if (err) return res.serverError(err);

      var cool = false;

      if (board.votesPerUser === 0) {  // no vote limit
        cool = true;

      } else {
        var votesRemaining = board.votesPerUser;

        board.columns.forEach(function(column) {
          column.cards.forEach(function(card) {
            card.votes.forEach(function(v) {
              if (v.user === user.id) votesRemaining--;
            });
          });
        });

        cool = votesRemaining > 0;
      }

      if (!cool) return res.badRequest("You're out of votes!");

      Card.findOneById(cardId).populate('votes').exec(function(err, card) {
        if (err) return res.serverError(err);

        if (!card) return res.badRequest('Card does not exist!');

        Vote.create({user: user.id, card: card.id}, function(err, vote) {
          if (err) return res.serverError(res);

          res.jsonx(vote);

          redis.cardUpvote(boardId, vote);
        });
      });
    });
  }

};

