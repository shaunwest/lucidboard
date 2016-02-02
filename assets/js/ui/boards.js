(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$rootScope', '$scope', 'boards', 'user', 'api',
    'config', 'eventerFactory',
    function($rootScope, $scope, boards, user, api, config, eventerFactory) {

      var _ = {
        findIndex: $rootScope.findIndex
      };

      var updateBoardExistence = function() {
        $scope.privateBoardsExist  = false;
        $scope.archivedBoardsExist = false;
        for (var i=0; i<$scope.boards.length; i++) {
          if ($scope.boards[i].archived) $scope.archivedBoardsExist = true;
          if ($scope.boards[i].private)  $scope.privateBoardsExist  = true;
          if ($scope.privateBoardsExist && $scope.archivedBoardsExist) {
            return;
          }
        }
      };

      $scope.user    = user;
      $scope.boards  = boards;
      $scope.colsets = config.colsets;
      $scope.type    = 'normal';
      $scope.pane    = 'list';
      $scope.newBoardToggleButton = 'New Board';

      $scope.togglePane = function() {
        $scope.pane = $scope.pane === 'list' ? 'new' : 'list';

        // change the 'new board' button text to back when user is on new board screen
        if ($scope.pane === 'list') { // list = boards screen
            $scope.newBoardToggleButton = 'New Board';
        } else if ($scope.pane === 'new') { // new = new board screen
            $scope.newBoardToggleButton = 'Back';
        }
      };

      $scope.myFilter = function(b) {
        switch ($scope.type) {
          case 'all':      return true;
          case 'archived': return b.archived;
          case 'private':  return b.private;
          case 'normal':   return !b.archived && !b.private;
        }
      };

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

      updateBoardExistence();

      eventerFactory().event('board:create', function(board) {
        if (!user.admin && (board.private && board.creator !== user.id)) return;
        $scope.boards.push(board);
        updateBoardExistence();
      }).event('board:update', function(board) {
        var idx = _.findIndex($scope.boards, function(b) { return b.id === board.id; });
        if (idx === -1) return;
        $scope.boards.splice(idx, 1, board);
        updateBoardExistence();
      }).event('board:delete', function(boardId) {
        var idx = _.findIndex($scope.boards, function(b) { return b.id === boardId; });
        if (idx === -1) return;
        $scope.boards.splice(idx, 1);
        updateBoardExistence();
      }).hook($scope);

    }]);

})();
