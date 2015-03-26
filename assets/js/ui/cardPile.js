(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('cardPile', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_cardPile.html',
        scope: {
          board:  '=',
          pile:   '=',
          column: '=',
          index:  '='
        },
        controller: ['$scope', 'api', 'view', function($scope, api, view) {
          var _ = { findIndex: $rootScope.findIndex };

          // Get the card model for the top-most card. If getIndexOnly is true,
          // then return only the index of the $scope.pile array.
          var getTopCard = function(getIndexOnly) {

            var cardOrIdx = board.getTopCard($scope.pile, getIndexOnly),
                curCard   = getIndexOnly ? cardOrIdx : _.findIndex($scope.pile,
                  function(c) { return c.id === cardOrIdx.id; }) + 1;

            $scope.curCard = curCard;

            return cardOrIdx;
          };

          var flip = function(idx) {
            api.boardCardFlip($scope.board.id, {
              cardId:   $scope.pile[idx].id,
              columnId: $scope.column.id,
              position: $scope.index + 1
            });
          };

          $scope.getTopCard = getTopCard;
          $scope.view       = view;

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
