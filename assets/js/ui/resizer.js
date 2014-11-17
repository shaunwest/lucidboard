(function() {
  angular.module('hansei.ui')
    .directive('resizerTop', ['resizer', function(resizer) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizer.registerTop(element);
        }
      };
    }])
    .directive('resizerBottom', ['resizer', function(resizer) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizer.registerBottom(element);
        }
      };
    }])
    .directive('resizerHandle', ['resizer', function(resizer) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizer.registerHandle(element);
        }
      };
    }])
    .directive('resizerExpand', ['resizer', function(resizer) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizer.registerExpandButton(element);
        }
      }
    }])
    .directive('resizer', ['resizer', function(resizer) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizer.registerResizer(element);
        }
      };
    }])
})();
