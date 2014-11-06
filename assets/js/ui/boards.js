(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$scope', 'boards', 'api',
    function($scope, boards, api) {
      $scope.boards = boards;

      api.hook('board:create', $scope, function(board) { $scope.boards.push(board); });
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
