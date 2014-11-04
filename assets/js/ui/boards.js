(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardsController', ['$scope', 'api',
    function($scope, api) {
    }])

  .controller('BoardCreateCtrl', ['$scope',
    function($scope) {
      $scope.boardCreate = function() {
        console.log($scope.title);
      };

      console.log('hai2');
    }])

})();
