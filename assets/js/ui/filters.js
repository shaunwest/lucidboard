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

  })

  .filter('obfuscated', function() {

    return function(txt) {
      if (!txt) return null;
      return txt.replace(/./g, '*');
    };

  })

  .filter('myVotes', ['user', function(user) {

    return function(votes) {
      if (!votes) return null;
      var myVotes = 0;
      votes.forEach(function(v) {
        if (v.user === user.id()) myVotes++;
      });
      return myVotes;
    };

  }]);

})();
