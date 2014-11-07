// This silly service just watches for the top and bottom resizer parts
// to come in, and invoke the "we're done" finished method once everything
// is collected.
// Thankyou, http://embed.plnkr.co/Zi2f0EPxmtEUmdoFR63B/
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('resizer', ['$document', '$window', function($document, $window) {
      var top, bottom, resizer;

      var cb = function() {
        if (!top || !bottom || !resizer) return;

        resizer.on('mousedown', function(event) {
          event.preventDefault();

          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
        });

        function mousemove(event) {
          var y = $window.innerHeight - event.pageY;

          resizer.css({
            bottom: y + 'px'
          });

          top.css({
            bottom: (y + parseInt(resizer.attr('resizer-height'))) + 'px'
          });

          bottom.css({
            height: y + 'px'
          });
        }

        function mouseup() {
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }
      };

      return {
        registerTop: function(el) {
          top = el;
          cb();
        },
        registerBottom: function(el) {
          bottom = el;
          cb();
        },
        registerResizer: function(el) {
          resizer = el;
          cb();
        }
      };
    }])
})();
