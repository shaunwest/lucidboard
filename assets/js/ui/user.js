(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$rootScope', '$scope', '$state', '$window', 'user', 'config',
    function($rootScope, $scope, $state, $window, user, config) {

      $rootScope.showHeader = true;

      if (config.signin === 'dumb') {
        $rootScope.signinStyle = 'user';
      } else if (config.signin === 'ldap') {
        $rootScope.signinStyle = 'userpass';
      }

      $scope.signedOut = user.signout();  // Sign the user out !

      $scope.signin = function() {
        user.signin($scope.username, $scope.password, function(res) {
          if (res.status === 'error') {
            $scope.errorMessage = res.message;
            $scope.signedOut    = false;
          } else {
            if ($rootScope.goto) {
              $window.location.href = $rootScope.goto;
              delete $rootScope.goto;
            } else {
              $state.go('boards');
            }
          }
        });
      };

    }])

})();
