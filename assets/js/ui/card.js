(function() {
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

          $scope.dropSuccessHandler = function($event) {
            // console.log('array', $scope.index, $scope.column.cards);
            // array.splice(index, 1);
          };

          $scope.moveCard = function($event, $data, array, destColumnId, position) {
            alert('is this even being used??');
            return;
            // TODO: I'm going to need something like this ....
            var extra = 0;
            if ($data.column === $scope.column.id && position > $data.position) {
              extra = 1;
            }

            api.boardMoveCard(board.id(), {
              cardId:       $data.id,
              destColumnId: destColumnId,
              destPosition: position - extra
            });
          };

          $scope.combineCards = function($event, $data, destCardId) {
            api.boardCombineCards(board.id(), {
              sourceCardId: $data.id,
              destCardId:   destCardId
            });
          };

          // old news...
          // This directive is used without a card to create a junction where cards can
          // be dropped. The rest of this function is not needed in this case.
          // if (!$scope.card) return;

          $scope.checkCardContent = function(content, columnId, id) {
            api.cardUpdate(board.id(), columnId, {id: id, content: content});
            // the false returned will close the editor and not update the model.
            // (model update will happen when the event is pushed from the server)
            return false;
          };

          $scope.upvote = function(card, event) {
            event.stopPropagation();
            event.preventDefault();
            api.cardUpvote(board.id(), board.column(card.column).id, card.id);
          };

          $scope.$watch('cardDragging', function(a) {
            // console.log('YAYY', a);
          });
        }],
      };
    }])
})();
