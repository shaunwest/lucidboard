(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('board', ['$rootScope', 'api', '$q', function($rootScope, api, $q) {
      var board, defer, boardSort, eventCb, cb, _ = {
        pluck:   $rootScope.pluck,
        flatten: $rootScope.flatten,
        sortBy:  $rootScope.sortBy
      };

      cb = function(type, bits) {
        if (typeof eventCb !== 'function') throw 'Must setEventCb()!';
        eventCb(type, bits);
      };

      boardSort = function(b) {
        b.columns = _.sortBy(b.columns, 'position');

        for (var i=0; i<b.columns.length; i++) {
          b.columns[i].cards = _.sortBy(b.columns[i].cards, 'position');
        }

        return b;
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
            board = boardSort(b);
            defer.resolve(board);
          });
          return defer.promise;
        },

        promise: function() { return defer.promise; },

        obj: function() { return board; },

        id:         function() { return board.id; },
        title:      function() { return board.title; },
        columns:    function() { return board.columns.slice(1); },
        trash:      function() { return board.columns[0]; },
        allColumns: function() { return board.columns; },

        timerLength: function() { return board.timerLength; },
        timerLeft:   function() { return board.timerLeft; },

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
          // cb('upvote', {vote: vote});
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
