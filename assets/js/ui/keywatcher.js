(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('keywatcher', ['view', 'board', function(view, board) {
      return {
        restrict: 'A',
        link: function(scope, element) {

          element.bind('keydown keypress', function(event) {
            switch (event.which) {
              case 27:   // escape
                scope.$apply(function() {
                  view.tab.switch('board');
                  view.closeMenus();
                });
                break;
              case 192:  // backtick
                if (!board.isFacilitator) return;
                scope.$apply(function() {
                  view.tab.switch('board', 'settings');
                  view.closeMenus();
                });
                break;
            }
          });

        }
      };
    }])
})();
