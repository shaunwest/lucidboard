(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$rootScope', '$scope', '$timeout', '$interval', 'api', 'board', 'eventerFactory',
    function($rootScope, $scope, $timeout, $interval, api, board, eventerFactory) {
      var openEditor, timer;

      // var regexColumnTitle = /^.{1,20}$/;

      $scope.board       = board;
      $scope.timerLength = 5;//300;          // 5 minutes
      $scope.timerLeft   = $scope.timerLength;

      $rootScope.cardDragging = false;

      eventerFactory().event('column:create:' + board.id(), function(col) {
        board.columnCreate(col);
      }).event('column:update:' + board.id(), function(col) {
        board.columnUpdate(col);
      }).event('card:create:' + board.id(), function(card) {
        board.cardCreate(card);
      }).event('card:update:' + board.id(), function(card) {
        board.cardUpdate(card);
        // Purposefully deciding not to update the editor. Users will end up
        // fighting over the content as they both overwrite each other's changes.
        // Maybe we'll have some notification that this is happening... or a list
        // of other users looking at the card...... locking?...
      }).event('card:upvote:' + board.id(), function(vote) {
        board.cardUpvote(vote);
      }).event('board:moveCard:' + board.id(), function(info) {
        board.moveCard(info);
      }).event('timer:start:' + board.id(), function(bits) {
        board.timerStart(bits);
        timer = $interval(function() {
          $scope.timerLeft -= 1;
          if ($scope.timerLeft <= 0) {
            $scope.timerLeft = 0;
          }
        }, 1000);
      }).hook($scope);

      /*
      openEditor = function(bits) {
        console.log('opening', bits);
        $scope.editor = bits;
      };

      for (var i=0; i<board.columns().length; i++) {
        (function() {
          var ii = i;
          $scope.$watch('board.columns[' + ii + '].title', function(newVal, oldVal) {
            api.columnUpdate(board.id(), {
              id:    board.columns()[ii].id,
              title: newVal
            });
          });
        })();
      }
      */

      $scope.startTimer = function() {
        api.startTimer(board.id());
      };

      /*
      $scope.waitAndSave = function() {
        if (watcher) $timeout.cancel(watcher);

        watcher = $timeout(function() {
          api.cardUpdate(board.id(), $scope.editor.column, {
            id:       $scope.editor.id,
            content:  $scope.editor.content
          });
        }, 1000);
      };
      */

      $scope.createCard = function(column) {
        api.cardCreate(board.id(), column.id, {}, function(card) {
          // TODO: Open edit automatically
          //
          // vv old junk vv
          // openEditor({
          //   title:   'Creating new card under ' + column.title,
          //   content: '',
          //   id:      card.id,
          //   column:  column.id
          // });
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

      // --- BEGIN Tabber stuff

      $scope.currentTab = 'trash';

      // $scope.tabs = [{
      //   title:

      $scope.switchTab = function(tabName) {
        $scope.currentTab = tabName;
      };


      // --- BEGIN xeditable stuff

      $scope.checkColumnTitle = function(title, id) {
        api.columnUpdate(board.id(), {id: id, title: title});
        // the false returned will close the editor and not update the model.
        // (model update will happen when the event is pushed from the server)
        return false;
      };

      // --- BEGIN drag-drop stuff

      $rootScope.$watch('cardDragging', function(a, b) {
        // console.log('a', a);
        // console.log('b', b);
      });

      $rootScope.$on('ANGULAR_DRAG_START', function(event, channel, card) {
        $rootScope.cardDragging = true;
        // console.log('ha', $rootScope.cardDragging);
        $rootScope.$apply();  // why the fuck do i need this?
      });

      $rootScope.$on('ANGULAR_DRAG_END', function(event, channel, card) {
        $rootScope.cardDragging = false;
        // console.log('oh', $rootScope.cardDragging);
        $rootScope.$apply();  // why the fuck do i need this?
      });
    }])

  .controller('NewColumnCtrl', ['$scope', 'board', 'api',
    function($scope, board, api) {
      $scope.createColumn = function() {
        api.columnCreate(board.id(), {title: $scope.title});
      };
    }])

})();
