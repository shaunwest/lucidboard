(function() {
  'use strict';

  angular.module('hansei.ui')
    .factory('resizerManager', ['$document', '$window', 'velocity', function($document, $window, velocity) {
      var $resizer, resizer, resizeCallback, $handle, handle,
        mouseOffsetY, expanded = false;

      var EXPAND_HEIGHT = 200,
        HANDLE_HEIGHT = 32,
        EXPAND_RATE = 500,
        COLLAPSE_RATE = EXPAND_RATE,
        SNAP_RATE = 100,
        COLLAPSE_THRESHOLD = 100;

      $window.onresize = function() {
        if(resizer && resizer.offsetHeight > $window.innerHeight) {
          snapClosed();
        }
      };

      function mousemove(event) {
        var y;
        if(!$resizer) {
          return;
        }
        y = ($window.innerHeight - event.pageY);
        resizeToHeight(y + mouseOffsetY);
      }

      function mouseup(event) {
        var y, height;
        if(event.target === handle) {
          y = $window.innerHeight - event.pageY;
          height = y + mouseOffsetY;
          if(height < COLLAPSE_THRESHOLD) {
            snapClosed();
          }
        }

        $document.unbind('mousemove', mousemove);
        $document.unbind('mouseup', mouseup);
      }

      function resizeToHeight(height) {
        if(height > HANDLE_HEIGHT && height < $window.innerHeight) {
          expanded = true;
          $resizer.css({
            height: height + 'px'
          });
          if(resizeCallback) {
            resizeCallback(expanded);
          }
        }
      }

      function snapClosed() {
        collapse(SNAP_RATE);
      }

      function expand(rate) {
        if(!expanded) {
          expanded = true;
          velocity($resizer[0], { height: EXPAND_HEIGHT }, {duration: rate || EXPAND_RATE});
          if(resizeCallback) {
            resizeCallback(expanded);
          }
        }
      }

      function collapse(rate) {
        if(expanded) {
          expanded = false;
          velocity($resizer[0], { height: HANDLE_HEIGHT }, {duration: rate || COLLAPSE_RATE});
          if(resizeCallback) {
            resizeCallback(expanded);
          }
        }
      }

      return {
        registerHandle: function(el) {
          $handle = el;
          handle = $handle[0];

          $handle.on('mousedown', function(event) {
            event.preventDefault();

            $document.on('mousemove', mousemove);
            $document.on('mouseup', mouseup);
            mouseOffsetY = event.offsetY;
          });
        },
        registerResizer: function(el) {
          $resizer = el;
          resizer = $resizer[0];
        },
        registerExpandButton: function(el, callback) {
          resizeCallback = callback;

          el.on('click', function() {
            if(!$resizer) {
              return;
            }
            expand();
          });
        },
        registerToggleButton: function(el, callback) {
          resizeCallback = callback;

          el.on('click', function(event) {
            if(!$resizer) {
              return;
            }
            if(!expanded) {
              expand();
            } else {
              collapse();
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
