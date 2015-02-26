(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$rootScope', '$scope', '$state', 'user', 'config',
    function($rootScope, $scope, $state, user, config) {

      $rootScope.showHeader = true;

      if (config.signin() === 'dumb') {
        $rootScope.signinStyle = 'user';
      } else if (config.signin() === 'ldap') {
        $rootScope.signinStyle = 'userpass';
      }

      $scope.signedOut = user.signout();  // Sign the user out !

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
