(function() {
  'use strict';

  var monthmap = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
    'Sep', 'Oct', 'Nov', 'Dec'
  ];

  angular.module('hansei.ui')

  .filter('formatDate', function() {
    return function(date) {
      date = new Date(date);
      var ret = monthmap[date.getMonth()] + ' ' + date.getDate();
      if (date.getFullYear() !== (new Date()).getFullYear()) {
        ret += ', ' + date.getFullYear();
      }
      return ret;
    };
  })

  .filter('secondsToMinutes', function() {
    return function(totalSeconds) {
      var mins = parseInt(totalSeconds / 60);
      var secs = totalSeconds % 60;
      if (secs < 10) secs = '0' + secs;
      return mins + ':' + secs;
    };
  })

  .filter('minutesToSeconds', function() {

    return function(minutes) {
      var mins, secs;
      var segments = minutes.toString().split(':');
      mins = parseInt(segments[0]);
      secs = parseInt(segments[1]) || 0;

      return (mins * 60) + secs;
    };

  })

  .filter('obfuscated', function() {
    return function(txt) {
      if (!txt) return null;
      return txt.replace(/./g, '*');
    };
  });

  // .filter('myVotes', ['user', function(user) {
  //
  //   return function(votes) {
  //     if (!votes) return null;
  //     var myVotes = 0;
  //     votes.forEach(function(v) {
  //       if (v.user === user.id()) myVotes++;
  //     });
  //     return myVotes;
  //   };
  //
  // }]);

})();
