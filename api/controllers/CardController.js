var async = require('async'),
    _     = require('underscore'),
    util  = require('../services/util'),
    redis = require('../services/redis'),
    meta  = require('../services/meta');

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

var nativeFind = function(type, id, cb) {
  // should be connection, not column, right??
  Column.native(function(err, connection) {
    if (err) {
      console.log('Error!');
    } else {
      connection.get('waterline:' + type + ':id:' + id, function(a, b) {
        cb(a, JSON.parse(b)); 
      });
    }
  });
}

var nativeFindStack = function(columnId, cb) {
  Column.native(function(err, connection) {
    if (err) {
      console.log('Error!');
    } else {
      connection.get('waterline:card:id:' + columnId, function(a, b) {
        cb(a, JSON.parse(b)); 
      });
    }
  });
}

var nativeSet = function(type, id, value, cb) {
  Column.native(function(err, connection) {
    if (err) {
      console.log('Error!');
    } else {
      connection.set('waterline:' + type + ':id:' + id, JSON.stringify(value), cb); 
    }
  });
}


module.exports = {

  create: function(req, res) {
    var user     = req.user,
        boardId  = parseInt(req.param('boardId')),
        columnId = parseInt(req.param('columnId')),
        content  = (req.body.content || '');

    if (!boardId || !columnId) return res.badRequest();

    async.auto({
      board:  function(cb) { Board.findOneById(boardId).exec(cb); },
      column: function(cb) { Column.findOneById(columnId).exec(cb); }
    }, function(err, r) {
      if (err)                           return res.serverError(err);
      if (r.column.board !== r.board.id) return res.notFound();

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

          card.username = user.name;

          redis.cardCreated(boardId, card, req);

          meta.getCardLock(boardId, card.id, req);  // creating a card implicitly locks it, too
        });
      });
    });
  },

  update: function(req, res) {
    var boardId  = parseInt(req.param('boardId')),
        columnId = parseInt(req.param('columnId')),
        cardId   = parseInt(req.param('cardId')),
        content  = (req.body.content || '').trim(),
        bits;

    if (!boardId || !columnId || !cardId) {
      return res.badRequest();
    } else if (meta.cardLockedBySomeoneElse(boardId, cardId, req)) {
      return req.forbidden('Card is locked by another user.');
    }

    bits = {
      content: content
    };

    async.auto({
      board:  function(cb) { 
        /*
        Board.findOneById(boardId).exec(function(a, b, c) { 
          console.log('board done', a, b, c);
          cb.apply(null, arguments);
        });
        */
        nativeFind('board', boardId, function () {
          cb.apply(null, arguments);  
        });
      },
      column: function(cb) { 
        nativeFind('column', columnId, function () {
          cb.apply(null, arguments);  
        });
        /*
        Column.findOneById(columnId).exec(function (a, b) {
          console.log('stack done!!!', a, b);
          cb.apply(null, arguments);  
        });
        */
      },
      card: function (cb) {
        nativeFind('card', cardId, function () {
          cb.apply(null, arguments);  
        });
      }/*,
      stack:  function(cb) {  // slow
        Card.find({column: columnId}).sort({position: 'asc'}).exec(function () {
          cb.apply(null, arguments);
        });
      }*/
    }, function(err, r) {
      if (err)                           return res.serverError(err);
      if (r.column.board !== r.board.id) return res.notFound();
      //var criteria = {id: cardId, column: r.column.id};
      var card = r.card;
      if (card.id === cardId) {
        card.content = bits.content; 
        nativeSet('card', cardId, card, function (err, msg) {
          // what about populate votes?
          if (err) return res.serverError(err);
          meta.releaseCardLock(boardId, cardId, req);

          res.jsonx(card);

          if (card) redis.cardUpdated(boardId, card, req);
        });
      }

      /*
      Card.update(criteria, bits).exec(function(err, card) { // slow
        if (err) return res.serverError(err);
        console.log('done 2');
        card[0].populateVotes(function(err, card) {
          if (err) return res.serverError(err);
          console.log('done 3');
          meta.releaseCardLock(boardId, cardId, req);

          res.jsonx(card);

          if (card) redis.cardUpdated(boardId, card, req);
        });
      });
     */

      /*
      var card = {
        creator: 24,
        content: 'Test test fooo bar asdfads test hhhh jjjj ghg hasdfadsf hhhh uuuuu hhh llll gggg fdfd ytyt nnn vvvv jjjj lalalalala',
        position: 2,
        column: 2758,
        topOfPile: false,
        color: 'default',
        createdAt: '2016-02-12T17:37:03.562Z',
        updatedAt: '2016-02-12T18:20:14.968Z',
        id: 11202 
      };
      redis.cardUpdated(boardId, card, req);
      */
    })
  },

  unupvote: function(req, res) {
    var user     = req.user,
        boardId  = parseInt(req.param('boardId')),
        columnId = parseInt(req.param('columnId')),
        cardId   = parseInt(req.param('cardId'));

    if (!boardId || !columnId || !cardId) return res.badRequest();

    async.auto({
      board:  function(cb) { Board.findOneById(boardId).exec(cb); },
      column: function(cb) { Column.findOne({id: columnId, board: boardId}).exec(cb); },
      card:   function(cb) { Card.findOne({id: cardId, column: columnId}).exec(cb); },
      votes:  function(cb) { Vote.find({card: cardId, user: user.id}).exec(cb); }
    }, function(err, r) {
      if (err)                              return res.serverError(err);
      if (!r.board || !r.column || !r.card) return res.notFound();
      if (r.votes.length === 0)             return res.badRequest();

      var bye = r.votes[0];

      bye.destroy(function(err, done) {
        if (err) return res.serverError(err);

        redis.cardUnupvote(boardId, bye);
      });
    });
  },

  upvote: function(req, res) {
    var user     = req.user,
        shortid  = req.param('shortid'),
        columnId = parseInt(req.param('columnId')),
        cardId   = parseInt(req.param('cardId'));

    if (!shortid || !columnId || !cardId) return res.badRequest();

    Board.loadFullByShortid(shortid, function(err, board) {
      if (err) return res.serverError(err);

      // Make sure the columnId exists in the board.
      if (_.pluck(board.columns, 'id').indexOf(columnId) === -1) {
        return res.notFound();
      }

      // Make sure they have votes left.
      var cardExistsOnBoard = false,
          votesRemaining    = board.votesPerUser,
          votingUnlimited   = board.votesPerUser === -1,
          cool;

      board.columns.forEach(function(column) {
        column.cards.forEach(function(card) {
          if (card.id === cardId) cardExistsOnBoard = true;
          if (votingUnlimited) return;  // if limited, count the user's votes...
          card.votes.forEach(function(v) {
            if (v.user === user.id) votesRemaining--;
          });
        });
      });

      cool = votingUnlimited || votesRemaining > 0;

      if (!cardExistsOnBoard) return res.notFound();
      if (!cool)              return res.forbidden("You're out of votes!");

      Card.findOneById(cardId).exec(function(err, card) {
        if (err)   return res.serverError(err);
        if (!card) return res.badRequest('Card does not exist!');  // not super possible heh

        Vote.create({user: user.id, card: card.id}, function(err, vote) {
          if (err) return res.serverError(res);

          res.jsonx(vote);

          redis.cardUpvote(board.id, vote);
        });
      });
    });
  },

  lock: function(req, res) {
    var boardId = parseInt(req.param('id')),
        cardId  = parseInt(req.param('cardId'));

    if (!boardId || !cardId) return res.badRequest();

    util.getCardAndBoard(cardId, boardId, res, function(r) {
      if (!r) return;

      var gotLock = meta.getCardLock(boardId, cardId, req, true);

      if (!gotLock) return res.jsonx(false);  // srybro, card is already locked !

      res.jsonx(true);
    });
  },

  unlock: function(req, res) {
    var boardId = parseInt(req.param('id')),
        cardId  = parseInt(req.param('cardId'));

    if (!boardId || !cardId) return res.badRequest();

    util.getCardAndBoard(cardId, boardId, res, function(r) {
      if (!r) return;

      var successfulRelease = meta.releaseCardLock(boardId, cardId, req, true);

      if (!successfulRelease) return res.jsonx(false);

      res.jsonx(true);
    });
  },

  vaporize: function(req, res) {
    var boardId = parseInt(req.param('id')),
        cardId  = parseInt(req.param('cardId'));

    if (!boardId || !cardId) return res.badRequest();

    util.vaporize(cardId, boardId, function(err, r) {
      if (err) return res.serverError();

      return res.jsonx(true);
    });
  },

  color: function(req, res) {
    var boardId  = parseInt(req.param('boardId')),
        columnId = parseInt(req.param('columnId')),
        cardId   = parseInt(req.param('cardId')),
        color    = req.body.color;

    if (!boardId || !columnId || !cardId || !color) return res.badRequest();

    async.auto({
      board:  function(cb) { Board.findOneById(boardId).exec(cb); },
      column: function(cb) { Column.findOne({id: columnId, board: boardId}).exec(cb); },
      card:   function(cb) { Card.findOne({id: cardId, column: columnId}).exec(cb); }
    }, function(err, r) {
      if (err)                              return res.serverError(err);
      if (!r.board || !r.column || !r.card) return res.notFound();

      r.card.color = color;

      r.card.save(function(err, c) {
        if (err) return res.serverError(err);

        res.jsonx(c);

        redis.cardColor(boardId, {id: cardId, color: color});
      });
    });

  }

};

