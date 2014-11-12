(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('board', ['$rootScope', 'api', '$q', function($rootScope, api, $q) {
      var board, defer, eventCb, cb, _ = {
        pluck:   $rootScope.pluck,
        flatten: $rootScope.flatten
      };

      cb = function(type, bits) {
        if (typeof eventCb !== 'function') throw 'Must setEventCb()!';
        eventCb(type, bits);
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
            board = b;
            defer.resolve(board);
          });
          return defer.promise;
        },

        promise: function() { return defer.promise; },

        obj: function() { return board; },

        id:      function() { return board.id; },
        title:   function() { return board.title; },
        columns: function() { return board.columns.slice(1); },
        trash:   function() { return board.columns[0]; },

        column: function(id) {
          for (var i in board.columns) {
            if (board.columns[i].id === id) return board.columns[i];
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
          console.log('votes', card.votes);
          // cb('upvote', {vote: vote});
        },

        moveCard: function(info) {
          var card        = this.card(info.cardId),
              sourceStack = this.column(card.column).cards,
              destPosIdx  = info.destPositionIdx,  // TODO: not currently used!
              index       = null;

          console.log('sourceStack', _.pluck(sourceStack, 'id'));
          console.log('card', card);

          for (var i=0; i<sourceStack.length; i++) {
            if (sourceStack[i] === card) {
              index = i; break;
            }
          }

          if (index === null) return alert('holy bugs, batman!');

          sourceStack.splice(index, 1);
          this.column(info.destColumnId).cards.push(card);
        },

        // timerStart: function(bits) {
        // }

      };
    }])
})();
