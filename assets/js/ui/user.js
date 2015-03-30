(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$rootScope', '$scope', '$state', '$window', 'user', 'config',
    function($rootScope, $scope, $state, $window, user, config) {

      if (config.signin === 'dumb') {
        $rootScope.signinStyle = 'user';
      } else if (config.signin === 'ldap') {
        $rootScope.signinStyle = 'userpass';
      }

      // If the user is signed in, take them to the boards !
      if (user.signedIn) return $state.go('boards');

      // This will be true if the user just clicked the signout link. The function
      // also clears the flag so a reload won't repeat the message.
      $scope.signedOut = user.clearJustSignedOut();

      $scope.signin = function() {
        if (!$scope.username.match(config.regex.username)) {
          $scope.signedOut    = false;
          $scope.errorMessage = 'Please enter a valid username.';
          return;
        }
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
