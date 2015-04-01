/**
 * Board
 *
 * @module      :: Model
 * @description :: A board is the thing that users collaborate over
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

var meta       = require('../services/meta'),
    _          = require('underscore'),
    titleRegex = /^.{1,50}$/;

module.exports = {

  schema: true,

  titleRegex: titleRegex,

  attributes: {

    title: {
      type:  'string',
      regex: titleRegex
    },

    columns: {
      collection: 'column',
      via:        'board'
    },

    creator: { model: 'user' },

    timerLength: 'integer',
    timerStart:  'datetime',


    votesPerUser: {
      type:       'integer',
      min:        -1,
      defaultsTo: 0
    },

    p_seeVotes:     'boolean',
    p_seeContent:   'boolean',
    p_lock:         'boolean',

    archived: {
      type:       'boolean',
      defaultsTo: false
    },

    toJSON: function() {
      var timerLeft = 0;

      if (this.timerStart) {
        timerLeft = parseInt(this.timerLength
          - (new Date().getTime() - this.timerStart.getTime())
          / 1000);
      }

      return {
        id:              this.id,
        title:           this.title,
        columns:         this.columns,
        creator:         this.creator,
        timerLength:     this.timerLength,
        timerLeft:       timerLeft,
        votesPerUser:    this.votesPerUser,
        p_seeVotes:      this.p_seeVotes,
        p_seeContent:    this.p_seeContent,
        p_lock:          this.p_lock,
        archived:        this.archived,
        creatorUsername: this.creatorUsername,
        creatorEmail:    this.creatorEmail,
        createdAt:       this.createdAt
      };
    },

    // Adds some extra bits of info, needed for the board list
    addInfo: function(cb) {
      User.findOneById(this.creator).exec(function(err, user) {
        if (err) return cb(err);
        this.creatorUsername = user.name;
        this.creatorEmail    = user.email;
        cb(err, this);
      }.bind(this));
    }
  },

  beforeDestroy: function(criteria, cb) {
    if (!criteria.where) {
      return cb('Where criteria expected!');  // i don't know what i'm doing
    }

    Board.find(criteria.where).exec(function(err, boards) {
      if (err) return cb(err);
      Column.destroy({board: _.pluck(boards, 'id')}).exec(cb);
    })
  },

  // Load the board by id along with all child objects.
  loadFullById: function(id, _cb) {
    async.auto({
      board: function(cb) {
        Board.findOneById(id).populate('columns').exec(cb);
      },
      cards: ['board', function(cb, r) {
        if (!r.board) {
          r.board = false;
          return cb('Board not found');
        }
        Card.find({column: _.pluck(r.board.columns, 'id')}).exec(cb);
      }],
      votes: ['cards', function(cb, r) {
        Vote.find({card: _.pluck(r.cards, 'id')}).exec(cb);
      }],
      mapCards: ['cards', function(cb, r) {
        var i, board = r.board;

        for (i=0; i<board.columns.length; i++) {
          r.cards.forEach(function(card) {
            if (card.column === board.columns[i].id) {
              var c = card.toObject(); c.votes = [];  // wtf, mate
              board.columns[i].cards.push(c);
            }
          });
        }

        cb(null, board);
      }],
      mapVotes: ['votes', 'mapCards', function(cb, r) {
        r.votes.forEach(function(vote) {
          for (var i=0; i<r.board.columns.length; i++) {
            for (var j=0; j<r.board.columns[i].cards.length; j++) {
              if (r.board.columns[i].cards[j].id === vote.card) {
                r.board.columns[i].cards[j].votes.push(vote.toObject());
              }
            }
          }
        });
        cb(null, r.board);
      }],
      final: ['mapVotes', function(cb, r) {
        r.mapVotes.columns.forEach(function(col) {
          col.cards.forEach(function(card) {
            card.locked = meta.cardLockedByWhichUsername(id, card.id);
          });
        });
        cb(null, r.mapVotes);
      }]
    }, function(err, r) {
      if (r.board === false) return _cb(null, false);
      if (err)               return _cb(err);

      _cb(null, r.final);
    });
  },

  // Get a list of boards with extra info. This info is the same as what addInfo
  // augments a board model with, but it is fetched in a more efficient manner.
  getList: function(criteria, cb) {
    async.auto({
      boards:  function(_cb) { Board.find(criteria).exec(_cb); },
      userMap: ['boards', function(_cb, r) {
        var uIds = _.uniq(_.pluck(r.boards, 'creator'));
        async.parallel(uIds.reduce(function(memo, uid) {
          memo[uid] = function(__cb) { User.findOneById(uid).exec(__cb); };
          return memo;
        }, {}), _cb);
      }],
      final: ['userMap', function(_cb, r) {
        _cb(null, r.boards.map(function(b) {
          b.creatorUsername = r.userMap[b.creator].name;
          b.creatorEmail    = r.userMap[b.creator].email;
          return b;
        }));
      }]
    }, function(err, r) {
      if (err) cb(err);
      cb(null, r.final.map(function(b) {
        return {
          id:              b.id,
          title:           b.title,
          creatorUsername: b.creatorUsername,
          creatorEmail:    b.creatorEmail,
          createdAt:       b.createdAt,
          archived:        b.archived
        };
      }));
    });
  }

};
