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
        controller: ['$scope', 'api', function($scope, api) {

          // Calculate the total number of votes for the pile
          $scope.votes = 0;
          $scope.pile.forEach(function(c) {
            $scope.votes += c.votes.length;
          });

          // Get the card model for the top-most card. If getIndexOnly is true,
          // then return only the index of the $scope.pile array.
          var getTopCard = function(getIndexOnly) {
            var i, index, highIdCard;

            for (i=0; i<$scope.pile.length; i++) {
              if ($scope.pile[i].topOfPile) {
                $scope.curCard = i + 1;
                if (getIndexOnly) return i;
                return $scope.pile[i];
              } else if (!highIdCard) {
                index      = i;
                highIdCard = $scope.pile[i];
                $scope.curCard = i + 1;
              } else if (highIdCard.id < $scope.pile[i].id) {
                index      = i;
                highIdCard = $scope.pile[i];
                $scope.curCard = i + 1;
              }
            }

            if (getIndexOnly) return index;

            return highIdCard;
          };

          var flip = function(idx) {
            api.boardCardFlip($scope.board.id(), {
              cardId:   $scope.pile[idx].id,
              columnId: $scope.column.id,
              position: $scope.index + 1
            });
          };

          $scope.forward = function() {
            var idx = getTopCard(true) + 1;
            if (idx >= $scope.pile.length) idx = 0;
            flip(idx);
          };

          $scope.back = function() {
            var idx = getTopCard(true) - 1;
            if (idx < 0) idx = $scope.pile.length - 1;
            flip(idx);
          };

          $scope.getTopCard = getTopCard;

        }]
      };
    }])
})();
