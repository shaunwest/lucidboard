(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$scope', 'board', 'api',
    function($scope, board, api) {
      $scope.board = board;

      api.hook('column:create:' + board.id, $scope, function(col) {
        $scope.board.columns.push(col);
      });
    }])

  .controller('NewColumnCtrl', ['$scope', 'board', 'api',
    function($scope, board, api) {
      $scope.createColumn = function(title) {
        api.columnCreate(board.id, {title: $scope.title});
      };
    }])

})();
