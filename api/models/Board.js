/**
 * Board
 *
 * @module      :: Model
 * @description :: A board is the thing that users collaborate over
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

var titleRegex = /^.{1,60}$/;

module.exports = {

  schema: true,

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
      min:        0,
      defaultsTo: 0
    },

    p_seeVotes:     'boolean',
    p_seeContent:   'boolean',
    p_combineCards: 'boolean',
    p_lock:         'boolean',

    toJSON: function() {
      var timerLeft = 0;

      if (this.timerStart) {
        timerLeft = parseInt(this.timerLength
          - (new Date().getTime() - this.timerStart.getTime())
          / 1000);
      }

      return {
        id:             this.id,
        title:          this.title,
        columns:        this.columns,
        creator:        this.creator,
        timerLength:    this.timerLength,
        timerLeft:      timerLeft,
        votesPerUser:   this.votesPerUser,
        p_seeVotes:     this.p_seeVotes,
        p_seeContent:   this.p_seeContent,
        p_combineCards: this.p_combineCards,
        p_lock:         this.p_lock
      };
    }
  },

  loadFullById: function(id, _cb) {
    async.auto({
      board: function(cb) {
        Board.findOneById(id).populate('columns').exec(cb);
      },
      cards: ['board', function(cb, results) {
        if (!results.board) {
          results.board = false;
          return cb('Board not found');
        }
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
      if (results.board === false) return _cb(null, false);
      if (err)                     return _cb(err);

      _cb(null, results.mapVotes);
    });
  },

};
