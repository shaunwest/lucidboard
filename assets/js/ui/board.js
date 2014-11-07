(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$scope', '$timeout', 'api', 'board', 'eventerFactory',
    function($scope, $timeout, api, board, eventerFactory) {
      var openEditor, watcher;

      $scope.board = board.obj();

      eventerFactory().event('column:create:' + $scope.board.id, function(col) {
        $scope.board.columns.push(col);
      }).event('card:create:' + $scope.board.id, function(card) {
        board.cardCreate(card);
      }).event('card:update:' + $scope.board.id, function(card) {
        board.cardUpdate(card);
        // Purposefully deciding not to update the editor. Users will end up
        // fighting over the content as they both overwrite each other's changes.
        // Maybe we'll have some notification that this is happening... or a list
        // of other users looking at the card...... locking?...
      }).event('card:upvote:' + $scope.board.id, function(vote) {
        console.log('got vote', vote);
        board.cardUpvote(vote);
      }).hook($scope);

      openEditor = function(bits) {
        console.log('opening', bits);
        $scope.editor = bits;
      };

      $scope.waitAndSave = function() {
        if (watcher) $timeout.cancel(watcher);

        watcher = $timeout(function() {
          api.cardUpdate($scope.board.id, $scope.editor.column, {
            id:       $scope.editor.id,
            content:  $scope.editor.content
          });
        }, 1000);
      };

      $scope.createCard = function(column) {
        api.cardCreate($scope.board.id, column.id, {}, function(card) {
          openEditor({
            title:   'Creating new card under ' + column.title,
            content: '',
            id:      card.id,
            column:  column.id
          });
        });
      };

      $scope.openCard = function(card) {
        openEditor({
          title:    'Editing card under ' + board.column(card.column).title,
          content:  card.content,
          id:       card.id,
          column:   card.column
        });
      };

      $scope.upvote = function(card) {
        api.cardUpvote($scope.board.id, board.column(card.column).id, card.id);
      };
    }])

  .controller('NewColumnCtrl', ['$scope', 'board', 'api',
    function($scope, board, api) {
      $scope.createColumn = function() {
        api.columnCreate(board.id(), {title: $scope.title});
      };
    }])

})();
