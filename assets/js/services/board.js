(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('board', ['$rootScope', 'api', '$q', function($rootScope, api, $q) {
      var board, defer, _ = {
        pluck:   $rootScope.pluck,
        flatten: $rootScope.flatten
      };

      return {

        load: function(boardId, cb) {
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
        columns: function() { return board.columns; },

        column: function(id) {
          for (var i in board.columns) {
            if (board.columns[i].id === id) return board.columns[i];
          }
          return null;
        },

        card: function(id) {
          console.log('to', typeof id);
          id = parseInt(id);
          var allCards = _.flatten(_.pluck(board.columns, 'cards'));
          for (var i in allCards) {
            if (allCards[i].id === id) {
              return allCards[i];
            }
          }
          return null;
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
        }

      };
    }])
})();
