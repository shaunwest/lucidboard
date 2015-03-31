(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('AdminDelegationCtrl', ['$scope', 'api',
    function($scope, api) {

      $scope.submit = function() {
        if (!$scope.username || !$scope.password) {
          $scope.message = 'You must fill in both fields.';
          return;
        }
        api.delegateAdmin($scope.username, $scope.password, function(success) {
          if (success) {
            $scope.message = 'You granted admin access to ' + $scope.username + '!';
          } else {
            $scope.message = 'It did not work.';
          }
        });
      };

    }])

})();
