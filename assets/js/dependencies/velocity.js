(function() {
  'use strict';
  angular.module('Velocity', [])
    .factory('velocity', ['$window', function($window) {
      var velocity = $window.Velocity;
      delete $window['Velocity'];
      return velocity;
    }]);
})();