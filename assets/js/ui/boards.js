(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$rootScope', '$scope', 'boards', 'user', 'api',
    'config', 'eventerFactory',
    function($rootScope, $scope, boards, user, api, config, eventerFactory) {

      var _ = {
        findIndex: $rootScope.findIndex
      };

      $scope.user    = user;
      $scope.boards  = boards;
      $scope.colsets = config.colsets;

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

      eventerFactory().event('board:create', function(board) {
        if (board.archived || (board.private && board.creator !== user.id)) return;
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
