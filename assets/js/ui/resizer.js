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
    .directive('resizer', ['resizer', function(resizer) {
      return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          resizer.registerResizer(element);
        }
      };
    }])
})();
