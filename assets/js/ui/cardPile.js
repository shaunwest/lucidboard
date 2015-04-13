(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('cardPile', ['board', function(board) {
      return {
        restrict: 'E',
        templateUrl: '/templates/_cardPile.html',
        scope: {
          pile:   '=',
          column: '=',
          index:  '='
        },
        controller: ['$rootScope', '$scope', 'api', 'view', function($rootScope, $scope, api, view) {
          var _ = { findIndex: $rootScope.findIndex };

          var flip = function(idx) {
            api.boardCardFlip(board.id, {
              cardId:   $scope.pile[idx].id,
              columnId: $scope.column.id,
              position: $scope.index + 1
            });
          };

          $scope.board = board;
          $scope.view  = view;

          // Get the card model for the top-most card. If getIndexOnly is true,
          // then return only the index of the $scope.pile array.
          $scope.getTopCard = function(getIndexOnly) {

            var cardOrIdx = board.getTopCard($scope.pile, getIndexOnly),
                curCard   = getIndexOnly ? cardOrIdx : _.findIndex($scope.pile,
                  function(c) { return c.id === cardOrIdx.id; }) + 1;

            $scope.curCard = curCard;

            return cardOrIdx;
          };

          // Calculate the total number of votes for the pile
          $scope.votes = 0;
          $scope.pile.forEach(function(c) {
            $scope.votes += c.votes.length;
          });

          $scope.forward = function() {
            var idx = board.getTopCard($scope.pile, true) + 1;
            if (idx >= $scope.pile.length) idx = 0;
            flip(idx);
          };

          $scope.back = function() {
            var idx = board.getTopCard($scope.pile, true) - 1;
            if (idx < 0) idx = $scope.pile.length - 1;
            flip(idx);
          };

        }]
      };
    }])
})();
