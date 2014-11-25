(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('velocity', ['$window', function($window) {
      var velocity = $window.Velocity;
      delete $window['Velocity'];
      return velocity;
    }]);
})();