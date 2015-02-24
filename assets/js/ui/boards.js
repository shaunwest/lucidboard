(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$scope', 'boards', 'user', 'api', 'config',
    function($scope, boards, user, api, config) {

      if (!user.token()) return;

      $scope.boards  = boards;
      $scope.colsets = config.colsets();

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

      api.hook('board:create', $scope, function(board) {
        $scope.boards.push(board);
      });
    }])

})();
