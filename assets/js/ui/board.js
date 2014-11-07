(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$scope', 'board', 'eventerFactory',
    function($scope, board, eventerFactory) {
      var eventer = eventerFactory();

      $scope.board = board.board();

      eventer.event('column:create:' + $scope.board.id, function(col) {
        console.log('GOT', col);
        $scope.board.columns.push(col);

      }).hook($scope);

      // api.hook('column:create:' + $scope.board.id, $scope, function(col) {
      //   console.log('GOT', col);
      //   $scope.board.columns.push(col);
      // });
    }])

  .controller('NewColumnCtrl', ['$scope', 'board', 'api',
    function($scope, board, api) {
      $scope.createColumn = function() {
        api.columnCreate(board.id(), {title: $scope.title});
      };
    }])

})();
