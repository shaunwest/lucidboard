(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$scope', 'boards', 'user', 'api',
    function($scope, boards, user, api) {

      if (!user.token()) return;

      $scope.boards = boards;

      api.hook('board:create', $scope, function(board) {
        $scope.boards.push(board);
      });
    }])

})();
