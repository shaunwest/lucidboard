(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('ArchivedBoardsCtrl', ['$scope', 'theArchivedBoards',
    function($scope, theArchivedBoards) {

      $scope.boards = theArchivedBoards;

      // reverse the array to order boards by descending create date
      $scope.boards.reverse();

    }])

})();
