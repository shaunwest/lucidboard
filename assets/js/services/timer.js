// Manage a set of server events
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('timer', ['api', '$interval', function(api, $interval) {

      var timer;

      return {
        remaining: 0,

        init: function() {
          this.remaining = 0;
          $interval.cancel(timer);
        },

        start: function start(seconds) {
          var sound = new Audio();

          sound.src = '/sounds/ding.mp3';
          this.remaining = seconds;

          $interval.cancel(timer);

          timer = $interval(function() {
            this.remaining -= 1;
            if (this.remaining <= 0) {
              this.remaining = 0;
              sound.play();
              $interval.cancel(timer);
            }
          }.bind(this), 1000);
        }
      };

    }])
})();

