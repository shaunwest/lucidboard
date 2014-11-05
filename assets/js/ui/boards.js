(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$scope', 'boards',
    function($scope, boards) {
      $scope.boards = boards;
    }])

  .controller('BoardCreateFormCtrl', ['$scope', '$state', 'api',
    function($scope, $state, api) {
      $scope.create = function() {
        api.boardCreate({title: $scope.title}, function(board) {
          $state.go('board', {boardId: board.id});
        });
      };
    }])

})();
