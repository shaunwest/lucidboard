(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('ArchivedBoardsCtrl', [
    '$rootScope', '$scope', 'eventerFactory', 'theArchivedBoards', 'user', 'api',
    function($rootScope, $scope, eventerFactory, theArchivedBoards, user, api) {

      var _ = {
        findIndex: $rootScope.findIndex
      };

      $scope.boards = theArchivedBoards;
      $scope.user   = user;

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

      $scope.confirmDelete = function(board) {
        var question = 'Are you sure you want to delete this board?\n\n' +
                       'Title: ' + board.title;
        if (!confirm(question)) return;

        api.boardDelete(board.id);
      };

    }])

})();
