(function() {
  'use strict';

  angular.module('hansei.ui')

  .controller('BoardCtrl', ['$rootScope', '$scope', '$state', '$interval', 'api',
    'user', 'board', 'eventerFactory', 'timer',
    function($rootScope, $scope, $state, $interval, api, user, board, eventerFactory, timer) {

      if (!board.loaded()) return $state.go('boards');  // If we has no board, go to boards list

      $scope.board             = board;
      $scope.timerMinutesInput = 5;

      $rootScope.columnViews = $scope.board.columns().map(function(column) {
        return { label: column.title, id: column.id };
      });
      $rootScope.columnViews.unshift($rootScope.columnViewSelected = {id: 0, label: 'View All'});
      $rootScope.getColumnViewState = function(columnId, columnViewSelected) {
        return (columnViewSelected.id === 0 || columnViewSelected.id === columnId);
      };


      // Unlock cards when our scope dies
      $scope.$on('$destroy', function() {
        board.locks.forEach(function(cardId) {
          api.cardUnlock(board.id(), cardId);
        });
      });

      eventerFactory().event('column:create:' + board.id(), function(col) {
        board.columnCreate(col);
      }).event('column:update:' + board.id(), function(col) {
        board.columnUpdate(col);
      }).event('card:create:' + board.id(), function(card) {
        if (card.you) card.openForEditWhenReady = true;
        board.cardCreate(card);
      }).event('card:update:' + board.id(), function(card) {
        board.cardUpdate(card);
      }).event('card:upvote:' + board.id(), function(vote) {
        board.cardUpvote(vote);
      }).event('card:vaporize:' + board.id(), function(cardId) {
        board.cardVaporize(cardId);
      }).event('card:lock:' + board.id(), function(info) {
        board.cardLock(info);
      }).event('card:unlock:' + board.id(), function(info) {
        board.cardUnlock(info);

        // This only matters for our own locked card id's, but
        // won't hurt for others.
        board.forgetCardLock(info.id);
      }).event('card:color:' + board.id(), function(bits) {
        board.cardColor(bits);
      }).event('board:update:' + board.id(), function(b) {
        board.update(b);
      }).event('board:moveCards:' + board.id(), function(info) {
        board.cardMove(info);
      }).event('board:moveColumns:' + board.id(), function(info) {
        board.columnMove(info);
      }).event('board:trashCardsAndDeleteColumn:' + board.id(), function(info) {
        board.columnDeleteAndTrashCards(info.columnId);
      }).event('board:timerStart:' + board.id(), function(bits) {
        timer.start(bits.seconds);
      }).event('board:combineCards:' + board.id(), function(info) {
        board.combineCards(info);
      }).event('board:flipCard:' + board.id(), function(cardId) {
        board.flipCard(cardId);

      }).hook($scope);

      $scope.createCard = function(column) {
        api.cardCreate(board.id(), column.id, {});
      };

      // --- BEGIN xeditable stuff

      $scope.checkColumnTitle = function(title, id) {
        api.columnUpdate(board.id(), {id: id, title: title});
        // the false returned will close the editor and not update the model.
        // (model update will happen when the event is pushed from the server)
        return false;
      };

      // --- BEGIN drag-drop stuff

      $scope.moveSlot = function($event, $data, cardSlots, destColumnId, position) {

        if ($data.pile) {

          api.boardMovePile(board.id(), {
            sourceColumnId: $data.sourceColumnId,
            sourcePosition: $data.sourcePosition,
            destColumnId:   destColumnId,
            destPosition:   position
          });

        } else {  // we're just moving a single card

          var extra = 0;

          if (
            $data.column === destColumnId &&             // same source & destination columns
            position > $data.position     &&             // source occurs higher than destination
            cardSlots[$data.position - 1].length === 1)  // source was not a [multi-card] pile
          {
            extra = 1;
          }

          api.boardMoveCard(board.id(), {
            cardId:       $data.id,
            destColumnId: destColumnId,
            destPosition: position - extra
          });
        }
      };

      $scope.moveColumn = function(column, position) {
        api.columnMove(board.id(), column.id, position);
      };

    }]);
})();
