(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('SigninCtrl', ['$rootScope', '$scope', '$state', 'user',
    function($rootScope, $scope, $state, user) {
      $rootScope.showHeader = true;

      $scope.username = 'joe';

      $scope.signin = function() {
        user.signin($scope.username, $scope.password, function() {
          $state.go('boards');
        });
      };

    }])

})();
