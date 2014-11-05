(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$scope', '$state', 'api',
    function($scope, $state, api) {
      $scope.username = 'joe';

      $scope.signin = function() {
        api.signin($scope.username, $scope.password, function(success) {
          if (!success) return alert('aww');
          $state.go('boards');
        });
      };

    }])

})();
