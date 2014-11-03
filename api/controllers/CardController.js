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
    var boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        content  = req.body.content;

    getNextCardPosition(columnId, function(err, nextpos) {
      if (err) return res.serverError(err);

      var attributes = {
        content:  content,
        position: nextpos,
        column:   columnId
      };

      Card.create(attributes, function(err, card) {
        if (err) return res.serverError(err);

        res.jsonx(card);
      });
    });
  },

  update: function(req, res) {
    var boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        cardId   = req.param('cardId'),
        content  = req.body.content;

    Card.update(cardId, {content: content}).exec(function(err, card) {
      if (err) return res.serverError(err);

      res.jsonx(card);
    });
  },

  vote: function(req, res) {
    var user     = req.user,
        boardId  = req.param('boardId'),
        columnId = req.param('columnId'),
        cardId   = req.param('cardId');

    // FIXME: especially when we implement permissions, be sure and revisit ensuring
    //        that the card belongs to the column, which belongs to be board that we
    //        expect! Also, check this sort of thing with the other methods.

    Card.findOneById(cardId).populate('votes').exec(function(err, card) {
      if (err) return res.serverError(err);

      if (!card) return res.badRequest('Card does not exist!');

      Vote.create({user: user.id, card: card.id}, function(err, vote) {
        if (err) return res.serverError(res);

        res.jsonx(vote);
      });
    });
  }

};

