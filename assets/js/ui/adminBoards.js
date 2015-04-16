(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('AdminBoardsCtrl', [
    '$rootScope', '$scope', '$state', '$stateParams', 'eventerFactory', 'theBoards', 'user', 'api',
    function($rootScope, $scope, $state, $stateParams, eventerFactory, theBoards, user, api) {

      var type = $stateParams.type,
          _    = {findIndex: $rootScope.findIndex};

      // Non-admin trying to list private boards? ...How did you get here?
      if (!user.admin && type === 'private') {
        $state.go('adminBoards', {type: 'archived'});
        return;
      }

      $scope.boards = theBoards;
      $scope.user   = user;
      $scope.type   = type.substr(0, 1).toUpperCase() + type.substr(1);

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

      // Note: we haven't hooked 'board:create' ... we won't see new boards being created
      //       in this view without a refresh.

      eventerFactory().event('board:update', function(board) {
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
