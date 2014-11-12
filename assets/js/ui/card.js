(function() {
  angular.module('hansei.ui')
    .directive('card', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_card.html',
        scope: {
          boardId: '=',
          card:    '=',
          column:  '=',
          index:   '='
        },
        controller: ['$scope', 'api', function($scope, api) {
          $scope.dropSuccessHandler = function($event) {
            console.log('array', $scope.index, $scope.column.cards);
            // array.splice(index, 1);
          };

          $scope.checkCardContent = function(content, columnId, id) {
            api.cardUpdate($scope.boardId, columnId, {id: id, content: content});
            // the false returned will close the editor and not update the model.
            // (model update will happen when the event is pushed from the server)
            return false;
          };
        }],
      };
    }])
})();
