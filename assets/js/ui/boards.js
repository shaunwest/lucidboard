(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$scope', 'boards', 'user', 'api', 'config', 'eventerFactory',
    function($scope, boards, user, api, config, eventerFactory) {

      $scope.boards  = boards;
      $scope.colsets = config.colsets;

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

      eventerFactory().event('board:create', function(board) {
        $scope.boards.push(board);
      }).event('board:update', function(board) {
        var idx = _.findIndex($scope.boards, function(b) { return b.id === board.id; });
        if (idx === -1) return;
        $scope.boards.splice(idx, 1, board);
      }).event('board:delete', function(boardId) {
        var idx = _.findIndex($scope.boards, function(b) { return b.id === boardId; });
        if (idx === -1) return;
        $scope.boards.splice(idx, 1);
      }).hook($scope);

    }])

})();
