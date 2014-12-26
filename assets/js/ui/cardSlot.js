(function() {
  angular.module('hansei.ui')
    .directive('cardSlot', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_cardSlot.html',
        scope: {
          board:  '=',
          item:   '=',
          column: '=',
          index:  '='
        }
      };
    }])
})();
