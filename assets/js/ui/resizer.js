(function() {
  angular.module('hansei.ui')
    .factory('resizerManager', ['$document', '$window', '$timeout', function($document, $window, $timeout) {
      var resizer, resizeCallback, handle, mouseOffsetY, expanded = false;
      var EXPAND_HEIGHT = 200;
      var HANDLE_HEIGHT = 32;
      var SLIDE_RATE_MS = 16;

      function mousemove(event) {
        var y, height;
        if(!resizer) {
          return;
        }
        y = ($window.innerHeight - event.pageY);
        height = y + mouseOffsetY;

        if(height > 28) {
          expanded = true;
          resizer.css({
            height: height + 'px'
          });
          if(resizeCallback) {
            resizeCallback(expanded);
          }
        }
      }

      function mouseup() {
        $document.unbind('mousemove', mousemove);
        $document.unbind('mouseup', mouseup);
      }

      function expand() {
        var offsetHeight;
        if(!resizer) {
          return;
        }
        offsetHeight = resizer[0].offsetHeight;
        if(offsetHeight < EXPAND_HEIGHT) {
          resizer[0].style.height = Math.min(offsetHeight + 20, EXPAND_HEIGHT) + 'px';
          $timeout(expand, SLIDE_RATE_MS);
        }
      }

      function collapse() {
        var offsetHeight;
        if(!resizer) {
          return;
        }
        offsetHeight = resizer[0].offsetHeight;
        if(offsetHeight > HANDLE_HEIGHT) {
          resizer[0].style.height = Math.max(offsetHeight - 20, HANDLE_HEIGHT) + 'px';
          $timeout(collapse, SLIDE_RATE_MS);
        }
      }

      return {
        registerHandle: function(el) {
          handle = el;
          handle.on('mousedown', function(event) {
            event.preventDefault();

            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
            mouseOffsetY = event.offsetY;
          });
        },
        registerResizer: function(el) {
          resizer = el;
        },
        registerExpandButton: function(el, callback) {
          resizeCallback = callback;

          el.on('click', function() {
            if(!resizer) {
              return;
            }

            if(!expanded) {
              expanded = true;
              $timeout(expand, SLIDE_RATE_MS);
            }

            if(resizeCallback) {
              resizeCallback(expanded);
            }
          });
        },
        registerToggleButton: function(el, callback) {
          resizeCallback = callback;

          el.on('click', function() {
            if(!resizer) {
              return;
            }

            // Expand
            if(!expanded) {
              expanded = true;
              $timeout(expand, SLIDE_RATE_MS);

            // Collapse
            } else {
              expanded = false;
              $timeout(collapse, SLIDE_RATE_MS);
            }

            if(resizeCallback) {
              resizeCallback(expanded);
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
    .directive('resizerToggle', ['resizerManager', function(resizerManager) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          scope.label = 'Open';
          resizerManager.registerToggleButton(element, function(expanded) {
            scope.label = (expanded) ? 'Close' : 'Open';
            scope.$apply();
          });
        },
        scope: {},
        template: '<a>{{ label }}</a>'
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
