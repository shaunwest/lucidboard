(function() {
  'use strict';

  angular.module('hansei.ui')

  .filter('formatTime', function() {

    return function(totalSeconds) {
      var mins = parseInt(totalSeconds / 60);
      var secs = totalSeconds % 60;
      if (secs < 10) secs = '0' + secs;
      return mins + ':' + secs;
    };

  });

})();
