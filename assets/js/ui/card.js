(function() {
  'use strict';

  angular.module('hansei.ui')
    .directive('card', [function() {
      return {
        restrict: 'E',
        templateUrl: '/templates/_card.html',
        scope: {
          board:  '=',
          card:   '=',
          column: '=',
          index:  '='
        },
        controller: ['$scope', '$timeout', 'api', 'user', 'view', function($scope, $timeout, api, user, view) {

          var board = $scope.board,
              card  = $scope.card;

          $scope.view = view;
          $scope.user = user;

          $scope.onShow = function() { console.log('srsly'); };

          $scope.combineThings = function($event, $data, destCardId) {
            if ($data.pile) {
              api.boardCombinePiles(board.id, {
                sourceColumnId: $data.sourceColumnId,
                sourcePosition: $data.sourcePosition,
                destCardId:     destCardId
              });
            } else {
              api.boardCombineCards(board.id, {
                sourceCardId: $data.id,
                destCardId:   destCardId
              });
            }
          };

          $scope.checkCardContent = function(content, columnId, id) {
            api.cardUpdate(board.id, columnId, {id: id, content: content});
            // the false returned will close the editor and not update the model.
            // (model update will happen when the event is pushed from the server)
            return false;
          };

          $scope.getCardLock = function(c) {
            api.cardLock(board.id, c.id, function(gotLock) {
              if (gotLock) {
                board.rememberCardLock(c.id);  // so we can reestablish on websocket reconnect
              } else {
                $scope.editform.$cancel();  // no lock, dude.
              }
            });
          };

          $scope.endCardLock = function(c) {
            api.cardUnlock(board.id, c.id, function(unlockWorked) {
              if (unlockWorked) board.forgetCardLock(c.id);
            });
          };

          $scope.editorShow = function(c) {
            if (board.card(c.id).locked) return;
            $scope.editform.$show();
          };

          $scope.isEditorVisible = function() {
            if (!$scope.editform) return false;
            return $scope.editform.$visible;
          };

          $scope.upvote = function(card, event) {
            $scope.votePop = true;
            $timeout(function() { $scope.votePop = false; }, 500);
            event.stopPropagation();
            event.preventDefault();
            if (board.card(card.id).locked) return;
            if (board.hasCardLocks)         return;
            api.cardUpvote(board.id, board.column(card.column).id, card.id);
          };

          $scope.moveTo = function(column, card) {
            if (board.card(card.id).locked) return;
            if (board.hasCardLocks)         return;
            view.closeMenus();
            api.boardMoveCard(board.id, {
              cardId:       card.id,
              destColumnId: column.id,
              destPosition: column.cardSlots.length + 1
            });
          };

          $scope.color = function(card, color) {
            if (board.card(card.id).locked) return;
            if (board.hasCardLocks)         return;
            view.closeMenus();
            api.cardColor(board.id, card.column, card.id, color);
          };

        }],
        link: function(scope, element) {

          // If we were the one who created this card, let's edit it!
          if (scope.card.openForEditWhenReady) {
            scope.editform.$show();
            delete scope.card.openForEditWhenReady;
          }

        }
      };
    }])
})();
