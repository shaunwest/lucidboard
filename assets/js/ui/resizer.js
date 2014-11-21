(function() {
  angular.module('hansei.ui')
    .factory('resizerManager', ['$document', '$window', '$timeout', function($document, $window, $timeout) {
      var resizer, handle, expanded = false;
      var EXPAND_HEIGHT = 200;

      function init() {
        var mouseOffsetY;

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
            height: (y + mouseOffsetY) + 'px'
          });
        }

        function mouseup() {
          $document.unbind('mousemove', mousemove);
          $document.unbind('mouseup', mouseup);
        }
      }

      return {
        registerHandle: function(el) {
          handle = el;
          init();
        },
        registerResizer: function(el) {
          resizer = el;
          init();
        },
        registerExpandButton: function(el) {
          function expand() {
            var offsetHeight = resizer[0].offsetHeight;
            if(offsetHeight < EXPAND_HEIGHT) {
              resizer[0].style.height = Math.min(offsetHeight + 20, EXPAND_HEIGHT) + 'px';
              $timeout(expand, 16);
            }
          }

          function collapse() {
            var offsetHeight = resizer[0].offsetHeight;
            if(offsetHeight > 32) {
              resizer[0].style.height = Math.max(offsetHeight - 20, 32) + 'px';
              $timeout(collapse, 16);
            }
          }

          el.on('click', function() {
            if(!resizer) {
              return;
            }

            if(!expanded) {
              expanded = true;
              $timeout(expand, 16);
            } else {
              expanded = false;
              $timeout(collapse, 16);
            }
          });
        }
      };
    }])
    .directive('resizerHandle', ['resizerManager', function(resizerManager) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizerManager.registerHandle(element);
        }
      };
    }])
    .directive('resizerExpand', ['resizerManager', function(resizerManager) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizerManager.registerExpandButton(element);
        }
      };
    }])
    .directive('resizer', ['resizerManager', function(resizerManager) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizerManager.registerResizer(element);
        }
      };
    }])
})();
