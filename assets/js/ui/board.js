(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$scope', 'board',
    function($scope, board) {
      $scope.board = board;
    }])

})();
