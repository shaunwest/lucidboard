(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninController', ['$scope', '$state', 'api',
    function($scope, $state, api) {
      $scope.username = 'joe';

      $scope.signin = function() {
        api.login($scope.username, $scope.password, function(success) {
          if (!success) return alert('aww');
          $state.go('boards');
        });
      };

    }])

})();
