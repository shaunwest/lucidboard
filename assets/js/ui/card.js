(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('card', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_card.html',
        scope: {
          board:        '=',
          card:         '=',
          column:       '=',
          index:        '=',
          cardDragging: '='
        },
        controller: ['$scope', 'api', 'user', function($scope, api, user) {
          var board = $scope.board;

          $scope.user = user;
          $scope.cardMenu = false;

          $scope.onShow = function() { console.log('srsly'); };

          $scope.lockedByAnother = function() {
            return card.locked && card.locked !== user.name;
          };

          // $scope.dropSuccessHandler = function($event) {
          //   console.log('array', $scope.index, $scope.column.cards);
          //   array.splice(index, 1);
          // };

          $scope.combineThings = function($event, $data, destCardId) {
            if ($data.pile) {
              api.boardCombinePiles(board.id(), {
                sourceColumnId: $data.sourceColumnId,
                sourcePosition: $data.sourcePosition,
                destCardId:     destCardId
              });
            } else {
              api.boardCombineCards(board.id(), {
                sourceCardId: $data.id,
                destCardId:   destCardId
              });
            }
          };

          $scope.checkCardContent = function(content, columnId, id) {
            api.cardUpdate(board.id(), columnId, {id: id, content: content});
            // the false returned will close the editor and not update the model.
            // (model update will happen when the event is pushed from the server)
            return false;
          };

          $scope.getCardLock = function(cardId) {
            api.cardLock(board.id(), cardId, function(gotLock) {
              if (gotLock) {
                board.rememberCardLock(cardId);  // so we can reestablish on websocket reconnect
              } else {
                $scope['cardeditor_' + cardId].$cancel();  // no lock, dude.
              }
            });
          };

          $scope.endCardLock = function(cardId) {
            api.cardUnlock(board.id(), cardId, function(unlockWorked) {
              if (unlockWorked) board.forgetCardLock(cardId);
            });
          };

          $scope.editorShow = function(cardId) {
            if (board.card(cardId).locked) return;
            $scope['cardeditor_' + cardId].$show();
          };

          $scope.isEditorVisible = function(cardId) {
            return $scope['cardeditor_' + cardId].$visible;
          };

          $scope.upvote = function(card, event) {
            event.stopPropagation();
            event.preventDefault();
            api.cardUpvote(board.id(), board.column(card.column).id, card.id);
          };

          // $scope.$watch('cardDragging', function(a) {
          //   console.log('YAYY', a);
          // });

          $scope.moveTo = function(column, card) {
            api.boardMoveCard(board.id(), {
              cardId:       card.id,
              destColumnId: column.id,
              destPosition: column.cardSlots.length + 1
            });
          };
        }]
      };
    }])
})();
