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
        controller: ['$scope', 'api', 'user', function($scope, api, user) {

          var board = $scope.board,
              card  = $scope.card;

          $scope.user = user;
          $scope.cardMenu = false;

          $scope.onShow = function() { console.log('srsly'); };

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

          $scope.getCardLock = function() {
            api.cardLock(board.id(), card.id, function(gotLock) {
              if (gotLock) {
                board.rememberCardLock(card.id);  // so we can reestablish on websocket reconnect
              } else {
                $scope.editform.$cancel();  // no lock, dude.
              }
            });
          };

          $scope.endCardLock = function() {
            api.cardUnlock(board.id(), card.id, function(unlockWorked) {
              if (unlockWorked) board.forgetCardLock(card.id);
            });
          };

          $scope.editorShow = function() {
            if (board.card(card.id).locked) return;
            $scope.editform.$show();
          };

          $scope.isEditorVisible = function() {
            if (!$scope.editform) return false;
            return $scope.editform.$visible;
          };

          $scope.upvote = function(card, event) {
            event.stopPropagation();
            event.preventDefault();
            if (board.card(card.id).locked) return;
            api.cardUpvote(board.id(), board.column(card.column).id, card.id);
          };

          $scope.moveTo = function(column, card) {
            if (board.card(cardId).locked) return;
            api.boardMoveCard(board.id(), {
              cardId:       card.id,
              destColumnId: column.id,
              destPosition: column.cardSlots.length + 1
            });
          };

        }],
        link: function(scope, element) {

          // If we were the one who created this card, let's edit it!
          if (scope.card.you) {
            scope.editform.$show();
            delete scope.card.openForEditWhenReady;
          }

        }
      };
    }])
})();
