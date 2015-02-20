(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$rootScope', '$scope', '$state', 'user',
    function($rootScope, $scope, $state, user) {
      $rootScope.showHeader = true;

      user.signout();

      $scope.signin = function() {
        user.signin($scope.username, $scope.password, function(res) {
          if (res.status === 'error') {
            $scope.errorMessage = res.message;
          } else {
            $state.go('boards');
          }
        });
      };

    }])

})();
