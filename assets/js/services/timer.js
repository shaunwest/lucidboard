// Manage a set of server events
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('timer', ['api', '$filter', '$interval', function(api, $filter, $interval) {

      var timer,
        startCallbacks = [],
        stopCallbacks = [];

      return {
        startTime: 300,
        remaining: 0,

       startMinutes: function (minutes) {
          if(typeof minutes !== 'undefined') {
            this.startTime = (minutes.toString().match(/\d{1,2}:\d\d/)) ?
              $filter('minutesToSeconds')(minutes) :
              minutes;
          }

          return (isNaN(this.startTime) ||
            (this.startTime.toString().length < 3 && this.startTime.toString().indexOf(':') == -1)) ?
              this.startTime :
              $filter('secondsToMinutes')(this.startTime);
        },

        pause: function () {
          console.log('pause');
          $interval.cancel(timer);
          stopCallbacks.forEach(function(cb) {
            cb();
          });
        },

        reset: function (seconds) {
          console.log('reset');
          this.remaining = seconds || this.startTime;
        },

        onStart: function(cb) {
          startCallbacks.push(cb);
        },

        onStop: function(cb) {
          stopCallbacks.push(cb);
        },

        start: function start () {
          console.log('start');
          var sound = new Audio();
          var seconds = this.remaining || this.startTime;

          sound.src = '/sounds/ding.mp3';
          this.remaining = seconds;

          $interval.cancel(timer);

          startCallbacks.forEach(function(cb) {
            cb();
          });

          timer = $interval (function() {
            this.remaining -= 1;

            if (this.remaining <= 0) {
              this.remaining = 0;
              sound.play();
              $interval.cancel(timer);
              stopCallbacks.forEach(function(cb) {
                cb();
              });
            }
          }.bind(this), 1000);
        }
      };

    }])
})();

