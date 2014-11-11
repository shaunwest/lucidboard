(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$scope', '$timeout', '$interval', 'api', 'board', 'eventerFactory',
    function($scope, $timeout, $interval, api, board, eventerFactory) {
      var openEditor, watcher, timer;

      // var regexColumnTitle = /^.{1,20}$/;

      $scope.board       = board.obj();
      $scope.timerLength = 5;//300;          // 5 minutes
      $scope.timerLeft   = $scope.timerLength;

      eventerFactory().event('column:create:' + $scope.board.id, function(col) {
        $scope.board.columns.push(col);
      }).event('column:update:' + $scope.board.id, function(col) {
        board.columnUpdate(col);
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
      }).event('timer:start:' + $scope.board.id, function(bits) {
        board.timerStart(bits);
        timer = $interval(function() {
          $scope.timerLeft -= 1;
          if ($scope.timerLeft <= 0) {
            $scope.timerLeft = 0;
          }
        }, 1000);
      }).hook($scope);

      openEditor = function(bits) {
        console.log('opening', bits);
        $scope.editor = bits;
      };

      /*
      for (var i=0; i<$scope.board.columns.length; i++) {
        (function() {
          var ii = i;
          $scope.$watch('board.columns[' + ii + '].title', function(newVal, oldVal) {
            api.columnUpdate($scope.board.id, {
              id:    $scope.board.columns[ii].id,
              title: newVal
            });
          });
        })();
      }
      */

      $scope.startTimer = function() {
        api.startTimer($scope.board.id);
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

      /*
      $scope.openCard = function(card) {
        openEditor({
          title:    'Editing card under ' + board.column(card.column).title,
          content:  card.content,
          id:       card.id,
          column:   card.column
        });
      };
      */

      $scope.upvote = function(card, event) {
        event.stopPropagation();
        event.preventDefault();
        api.cardUpvote($scope.board.id, board.column(card.column).id, card.id);
      };

      // --- BEGIN xeditable stuff

      $scope.checkColumnTitle = function(title, id) {
        api.columnUpdate($scope.board.id, {id: id, title: title});
        // the false returned will close the editor and not update the model.
        // (model update will happen when the event is pushed from the server)
        return false;
      };

      $scope.checkCardContent = function(content, columnId, id) {
        api.cardUpdate($scope.board.id, columnId, {id: id, content: content});
        return false;
      };
    }])

  .controller('NewColumnCtrl', ['$scope', 'board', 'api',
    function($scope, board, api) {
      $scope.createColumn = function() {
        api.columnCreate(board.id(), {title: $scope.title});
      };
    }])

})();
