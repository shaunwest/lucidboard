// This silly service just watches for the top and bottom resizer parts
// to come in, and invoke the "we're done" finished method once everything
// is collected.
// Thankyou, http://embed.plnkr.co/Zi2f0EPxmtEUmdoFR63B/
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('resizer', ['$document', '$window', '$timeout', function($document, $window, $timeout) {
      var top, bottom, resizer, handle, mouseOffsetY, expanded = false;
      var EXPAND_HEIGHT = 200;

      var cb = function() {
        //if (!top || !bottom || !resizer) return;
        if(!resizer && !handle) return;

        handle.on('mousedown', function(event) {
          event.preventDefault();

          $document.on('mousemove', mousemove);
          $document.on('mouseup', mouseup);
          mouseOffsetY = event.offsetY;
        });

        function mousemove(event) {
          var y = $window.innerHeight - event.pageY;
          expanded = true;
          resizer.css({
            //bottom: y + 'px'
            height: (y + mouseOffsetY) + 'px'
          });

          /*top.css({
            bottom: (y + parseInt(resizer.attr('resizer-height'))) + 'px'
          });

          bottom.css({
            height: y + 'px'
          });*/
        }

        function mouseup() {
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }
      };

      return {
        registerHandle: function(el) {
          handle = el;
          cb();
        },
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
        },
        registerExpandButton: function(el) {
          var expand = function() {
            var offsetHeight = resizer[0].offsetHeight;
            if(offsetHeight < EXPAND_HEIGHT) {
              resizer[0].style.height = Math.min(offsetHeight + 20, EXPAND_HEIGHT) + 'px';
              $timeout(expand, 16);
            }
          };

          var collapse = function() {
            var offsetHeight = resizer[0].offsetHeight;
            if(offsetHeight > 32) {
              resizer[0].style.height = Math.max(offsetHeight - 20, 32) + 'px';
              $timeout(collapse, 16);
            }
          };

          el.on('click', function() {
            if(resizer) {
              if(!expanded) {
                expanded = true;
                $timeout(expand, 16);
              } else {
                expanded = false;
                $timeout(collapse, 16);
              }
            }
          });
        }
      };
    }])
})();
