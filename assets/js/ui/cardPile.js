(function() {
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
        controller: ['$scope', function($scope) {

          // Calculate the total number of votes for the pile
          $scope.votes = 0;
          console.log('pile',$scope.pile);
          $scope.pile.forEach(function(c) {
            $scope.votes += c.votes.length;
          });

          $scope.getTopCard = function(pile) {
            var i, highIdCard;

            for (i=0; i<$scope.pile.length; i++) {
              if ($scope.pile[i].topOfStack) {
                $scope.curCard = i + 1;
                return $scope.pile[i];
              } else if (!highIdCard) {
                highIdCard = $scope.pile[i];
                $scope.curCard = i + 1;
              } else if (highIdCard.id < $scope.pile[i].id) {
                highIdCard = $scope.pile[i];
                $scope.curCard = i + 1;
              }
            }

            return highIdCard;
          };

        }],
      };
    }])
})();
