(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('board', ['$rootScope', 'api', 'user', '$q', function($rootScope, api, user, $q) {
      var board, defer, votesRemaining, eventCb, _ = {
        pluck:   $rootScope.pluck,
        flatten: $rootScope.flatten,
        sortBy:  $rootScope.sortBy
      };

      var cb = function(type, bits) {
        if (typeof eventCb !== 'function') throw 'Must setEventCb()!';
        eventCb(type, bits);
      };

      var loadBoard = function(b) {
        board = b;
        boardSort();
        figureVotesRemaining();
      };

      var figureVotesRemaining = function() {
        if (board.votesPerUser === 0) {
          votesRemaining = -1;  // infinite votes
          return;
        }

        votesRemaining = board.votesPerUser;

        board.columns.forEach(function(col) {
          col.cards.forEach(function(card) {
            card.votes.forEach(function(v) {
              if (v.user === user.obj().id) {
                votesRemaining--;
              }
            });
          });
        });
      }

      var boardSort = function() {
        board.columns = _.sortBy(board.columns, 'position');

        for (var i=0; i<board.columns.length; i++) {
          board.columns[i].cards = _.sortBy(board.columns[i].cards, 'position');
        }
      };

      return {
        setEventCb: function(_cb) {
          eventCb = _cb;
        },

        // log: function(text, type, extra) {
        //   log.push({date: new Date(), text: text, type: type, extra: extra});
        // },

        load: function(boardId) {
          defer = $q.defer();
          api.boardGet(boardId, function(b) {
            loadBoard(b);
            defer.resolve(board);
          });
          return defer.promise;
        },

        promise:        function() { return defer.promise; },

        obj:            function() { return board; },

        id:             function() { return board.id; },
        title:          function() { return board.title; },
        columns:        function() { return board.columns.slice(1); },
        trash:          function() { return board.columns[0]; },
        allColumns:     function() { return board.columns; },

        votesPerUser:   function() { return board.votesPerUser; },
        p_seeVotes:     function() { return board.p_seeVotes; },
        p_seeContent:   function() { return board.p_seeContent; },
        p_combineCards: function() { return board.p_combineCards; },
        p_lock:         function() { return board.p_lock; },

        timerLength:    function() { return board.timerLength; },
        timerLeft:      function() { return board.timerLeft; },

        votesRemaining: function() { return votesRemaining; },

        nextPositionByColumnId: function(columnId) {
          var column = this.column(columnId);

          if (!column) return null;

          if (!column.cards.length) return 1;

          return column.cards[column.cards.length - 1].position + 1;
        },

        column: function(id) {
          for (var i in board.columns) {
            if (board.columns[i].id == id) return board.columns[i];
          }
          throw 'Failed to find column id ' + id;
        },

        card: function(id) {
          id = parseInt(id);
          var allCards = _.flatten(_.pluck(board.columns, 'cards'));
          for (var i in allCards) {
            if (allCards[i].id === id) {
              return allCards[i];
            }
          }
          throw 'Failed to find card id ' + id;
        },

        update: function(b) {
          board.title          = b.title;
          board.votesPerUser   = b.votesPerUser;
          board.p_seeVotes     = b.p_seeVotes;
          board.p_seeContent   = b.p_seeContent;
          board.p_combineCards = b.p_combineCards;
          board.p_lock         = b.p_lock;

          figureVotesRemaining();
        },

        columnCreate: function(_column) {
          board.columns.push(_column);
        },

        columnUpdate: function(_column) {
          var column = this.column(_column.id);
          Object.keys(_column).forEach(function(k) {
            if (k === 'cards') return;
            column[k] = _column[k];
          });
        },

        cardCreate: function(card) {
          var column = this.column(card.column);
          column.cards.push(card);
        },

        cardUpdate: function(_card) {
          var card = this.card(_card.id);
          Object.keys(_card).forEach(function(k) {
            card[k] = _card[k];
          });
        },

        cardUpvote: function(vote) {
          var card = this.card(vote.card);
          card.votes.push(vote);

          if (vote.user === user.obj().id) {
            votesRemaining--;
          }
        },

        // Replace the column with the cards of the given id's, in order.
        rebuildColumn: function(info) {
          // info is an object with keys of column id's. Corresponding vals are arrays
          // of card ids as they should appear, in order. (Multiple columns can be
          // updated at the same time)

          /*
          var pos         = 1,
              sourceStack = this.column(columnId).cards
              newStack    = [];

          // make a new array to replace, renumbering positions as we go
          ids.forEach(function(cardId) {
            var card = this.card(cardId);
            card.position = pos;
            pos++;
            newStack.push(card);
          }.bind(this));

          // replace the entire contents of each column with our new stack of cards
          sourceStack.splice.apply(sourceStack, [0, Number.MAX_VALUE].concat(newStack));
          */

          var cardStacks = {};

          Object.keys(info).forEach(function(columnId) {
            var pos = 1, sourceStack = this.column(columnId).cards;

            cardStacks[columnId] = [];

            // make a new array to replace, renumbering positions as we go
            info[columnId].forEach(function(cardId) {
              var card = this.card(cardId);
              card.position = pos;
              pos++;
              cardStacks[columnId].push(card);
            }.bind(this));

          }.bind(this));

          // replace the entire contents of each column with our new stack of cards
          Object.keys(cardStacks).forEach(function(columnId) {
            var sourceStack = this.column(columnId).cards;

            sourceStack.splice.apply(sourceStack,
              [0, Number.MAX_VALUE].concat(cardStacks[columnId]));

          }.bind(this));

        },

        moveCard: function(info) {
          this.rebuildColumn(info);
        },

        combineCards: function(info) {
          var sourceCardId   = info.sourceCardId,
              sourceColumnId = info.sourceColumnId,
              sourceMap      = info.sourceMap,
              destCard       = info.destCard,
              info           = {},
              destColumn;

          // Reorder the source column
          info[sourceColumnId] = sourceMap;
          this.rebuildColumn(info);

          // Splice in the new card
          this.column(destCard.column).cards.splice(destCard.position - 1, 1, destCard);
        },

      };
    }])
})();
