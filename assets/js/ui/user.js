(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$scope', '$state', 'user',
    function($scope, $state, user) {
      $scope.username = 'joe';

      $scope.signin = function() {
        user.signin($scope.username, $scope.password, function() {
          $state.go('boards');
        });
      };

    }])

})();
