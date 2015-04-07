// Manage a set of server events
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('timer', ['api', '$filter', '$interval', function(api, $filter, $interval) {

      var interval = null;

      var stopInterval = function() {
        $interval.cancel(interval);
        interval = null;
      };

      return {
        startTime: 300,
        remaining: 0,

        minutes: function (minutes) {
          if (typeof minutes !== 'undefined') {
            this.startTime = (minutes.toString().match(/\d{1,2}:\d\d/)) ?
              $filter('minutesToSeconds')(minutes) :
              minutes;
          }

          if (isNaN(this.startTime) ||
            (this.startTime.toString().length < 3 &&
             this.startTime.toString().indexOf(':') === -1)
          ) {
            return this.startTime;
          } else {
            return $filter('secondsToMinutes')(this.startTime);
          }
        },

        pause: function(seconds) {
          if (seconds !== undefined) this.remaining = seconds;
          stopInterval();
        },

        init: function(seconds) {
          stopInterval();
          if (seconds === undefined) {
            this.remaining = this.startTime;
          } else {
            this.remaining = seconds;
          }
        },

        start: function(seconds) {
          if (seconds !== undefined) {
            this.remaining = seconds;
          } else if (!this.remaining) {
            this.remaining = this.startTime;
          }

          var sound = new Audio();
          sound.src = '/sounds/ding.mp3';

          stopInterval();

          interval = $interval(function() {
            this.remaining -= 1;

            if (this.remaining <= 0) {
              this.remaining = 0;
              sound.play();
              stopInterval();
            }
          }.bind(this), 1000);
        }
      };

    }])
})();

