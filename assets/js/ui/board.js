(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$rootScope', '$scope', '$state', '$timeout', '$interval', 'api', 'board', 'eventerFactory',
    function($rootScope, $scope, $state, $timeout, $interval, api, board, eventerFactory) {
      var openEditor, timer;

      if (!board.loaded()) {
        return $state.go('boards');
      }

      // var regexColumnTitle = /^.{1,20}$/;

      $scope.board             = board;
      $scope.timerMinutesInput = 5;
      $scope.timerLeft         = 0;
      // $scope.timerLength = 5;//300;          // 5 minutes

      $scope.b = board.obj();

      $rootScope.cardDragging = false;

      var startTimer = function(bits) {
        var sound          = new Audio();
        sound.src          = '/sounds/ding.mp3';
        // $scope.timerLength = bits.seconds;
        $scope.timerLeft   = bits.seconds;

        $interval.cancel(timer);

        timer = $interval(function() {
          $scope.timerLeft -= 1;
          if ($scope.timerLeft <= 0) {
            $scope.timerLeft = 0;
            sound.play();
            $interval.cancel(timer);
          }
        }, 1000);
      };

      if (board.timerLeft() > 0) {
        startTimer({seconds: board.timerLeft()});
      }

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
      }).event('board:update:' + board.id(), function(b) {
        board.update(b);
      }).event('board:moveCard:' + board.id(), function(info) {
        board.moveCard(info);
      }).event('board:timerStart:' + board.id(), function(bits) {
        startTimer(bits);
      }).event('board:combineCards:' + board.id(), function(info) {
        board.combineCards(info);
      }).event('board:flipCard:' + board.id(), function(cardId) {
        board.flipCard(cardId);
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

      $scope.timerStart = function(minutes) {
        $scope.showTimerForm = false;
        api.timerStart(board.id(), minutes * 60);
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

      $scope.currentTab = 'board';

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

      $rootScope.$watch('cardDragging', function(newVal, oldVal) {
        // console.log('a', a);
        // console.log('b', b);
      });

      $rootScope.$on('ANGULAR_DRAG_START', function(event, channel, card) {
        $rootScope.cardDragging = true;
      });

      $rootScope.$on('ANGULAR_DRAG_END', function(event, channel, card) {
        $rootScope.cardDragging = false;
      });

      $scope.moveCard = function($event, $data, array, destColumnId, position) {
        api.boardMoveCard(board.id(), {
          cardId:       $data.id,
          destColumnId: destColumnId,
          destPosition: position
        });
      };
    }]);
})();
