(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('board', ['api', '$q', function(api, $q) {
      var board, defer;

      return {

        load: function(boardId, cb) {
          defer = $q.defer();
          api.boardGet(boardId, function(b) {
            board = b;
            defer.resolve(board);
          });
          return defer.promise;
        },

        promise: function() { return defer.promise; },

        board: function() { return board; },

        id:      function() { return board.id; },
        title:   function() { return board.title; },
        columns: function() { return board.columns; }

      };
    }])
})();
