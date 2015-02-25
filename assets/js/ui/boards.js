(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsCtrl', ['$scope', 'boards', 'user', 'api', 'config', 'eventerFactory',
    function($scope, boards, user, api, config, eventerFactory) {

      // if (!user.token()) return;

      $scope.boards  = boards;
      $scope.colsets = config.colsets();

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

      eventerFactory().event('board:create', function(board) {
        $scope.boards.push(board);
      }).hook($scope);

    }])

})();
