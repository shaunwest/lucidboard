(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('board', ['$rootScope', '$q', '$timeout', 'api', 'user',
      function($rootScope, $q, $timeout, api, user) {
      var board, defer, votesRemaining, eventCb,
          locks   = [],  // card ids that this client has locked
          _ = {
            pluck:   $rootScope.pluck,
            flatten: $rootScope.flatten,
            sortBy:  $rootScope.sortBy
          };

      var cb = function(type, bits) {
        if (typeof eventCb !== 'function') throw 'Must setEventCb()!';
        eventCb(type, bits);
      };

      var isBoardOwner = function() { return user.id() === board.creator; };


      var loadBoard = function(b) {
        board = b;
        boardSort();
        figureVotesRemaining();
        parseCards();
      };

      var boardSort = function() {
        board.columns = _.sortBy(board.columns, 'position');

        // Per column, cards are sorted by position, but if a position value
        // is shared, the cards are stacked with an order of the id, ascending.
        for (var i=0; i<board.columns.length; i++) {
          board.columns[i] = fixColumn(board.columns[i]);
        }
      };

      var sortByVotes = function() {
        for (var i=0; i<board.columns.length; i++) {
          board.columns[i].cardSlots.sort(function(a, b) {
            var votesA = 0, votesB = 0;
            a.forEach(function(c) { votesA += c.votes.length; });
            b.forEach(function(c) { votesB += c.votes.length; });
            return votesB - votesA;
          });
        }
      };

      var sortByReality = function() {
        for (var i=0; i<board.columns.length; i++) {
          board.columns[i].cardSlots.sort(function(a, b) {
            return a[0].position > b[0].position;
          });
        }
      };

      var fixColumn = function(column) {
        var buffer   = [],
            origlist = _.sortBy(_.sortBy(column.cards, 'id'), 'position'),
            j;

        // We'll use cardSlots instead.
        delete column.cards;
        column.cardSlots = [];

        // Group piles into arrays
        var maybeLoadSlot = function(curCard) {
          if (buffer.length && (!curCard || curCard.position != buffer[0].position)) {
            column.cardSlots.push(buffer);
            buffer = [];
          }
        };

        for (j=0; j<origlist.length; j++) {
          maybeLoadSlot(origlist[j]);
          buffer.push(origlist[j]);
        }

        maybeLoadSlot();  // but surely!

        return column;
      };

      var figureVotesRemaining = function() {
        if (board.votesPerUser === 0) {
          votesRemaining = -1;  // infinite votes
          return;
        }

        votesRemaining = board.votesPerUser;

        spiderCards(function(card) {
          card.votes.forEach(function(v) {
            if (v.user === user.obj().id) {
              votesRemaining--;
            }
          });
        });
      };

      var parseCards = function() {
        // Set up some card properties that exist purely on the client side
        spiderCards(function(card) {
          if (isBoardOwner()) {
            card.userCanWrite = true;
          } else {
            card.userCanWrite = card.creator === user.id();
          }

          card.lockedByAnother = !!card.locked;
        });
      };

      var spiderCards = function(cb) {
        board.columns.forEach(function(col) {
          col.cardSlots.forEach(function(slot) {
            if (angular.isArray(slot)) {
              slot.forEach(function(c) { cb(c); });
            } else {
              cb(slot);
            }
          });
        });
      };


      return {
        setEventCb: function(_cb) {
          eventCb = _cb;
        },

        // log: function(text, type, extra) {
        //   log.push({date: new Date(), text: text, type: type, extra: extra});
        // },

        load: function(boardId) {
          defer = $q.defer();
          api.boardGet(boardId, function(b) {
            loadBoard(b);
            defer.resolve(board);
          });
          return defer.promise;
        },

        sortByVotes:    sortByVotes,
        sortByReality:  sortByReality,

        isBoardOwner:   isBoardOwner,

        promise:        function() { return defer.promise; },

        obj:            function() { return board; },
        loaded:         function() { return board && board.id; },

        id:             function() { return board.id; },
        title:          function() { return board.title; },
        trash:          function() { return board.columns[0]; },
        trashIsEmpty:   function() { return (this.trash().cardSlots.length === 0); },
        allColumns:     function() { return board.columns; },

        votesPerUser:   function() { return board.votesPerUser; },
        p_seeVotes:     function() { return board.p_seeVotes; },
        p_seeContent:   function() { return board.p_seeContent; },
        p_combineCards: function() { return board.p_combineCards; },
        p_lock:         function() { return board.p_lock; },

        timerLength:    function() { return board.timerLength; },
        timerLeft:      function() { return board.timerLeft; },

        votesRemaining: function() { return votesRemaining; },

        nextPositionByColumnId: function(columnId) {
          var column = this.column(columnId);

          if (!column) return null;

          if (!column.cardSlots.length) return 1;

          return column.cardSlots[column.cardSlots.length - 1].position + 1;
        },

        columns: function(o) {
          var ret = board.columns.slice(1);

          if (o && o.withTrash) {
            ret.push(board.columns.slice(0, 1)[0]);
          }

          if (o && o.excludingId) {
            ret = ret.filter(function(c) { return c.id !== o.excludingId; });
          }

          return ret;
        },

        column: function(id) {
          for (var i in board.columns) {
            if (board.columns[i].id == id) return board.columns[i];
          }
          throw 'Failed to find column id ' + id;
        },

        card: function(id) {
          id = parseInt(id);
          var allCards = _.flatten(_.pluck(board.columns, 'cardSlots'));
          for (var i in allCards) {
            if (allCards[i].id === id) {
              return allCards[i];
            }
          }
          throw 'Failed to find card id ' + id;
        },

        update: function(b) {
          board.title          = b.title;
          board.votesPerUser   = b.votesPerUser;
          board.p_seeVotes     = b.p_seeVotes;
          board.p_seeContent   = b.p_seeContent;
          board.p_combineCards = b.p_combineCards;
          board.p_lock         = b.p_lock;

          figureVotesRemaining();
        },

        columnCreate: function(_column) {
          board.columns.push(fixColumn(_column));
        },

        columnUpdate: function(_column) {
          var column = this.column(_column.id);
          Object.keys(_column).forEach(function(k) {
            if (k === 'cards') return;
            column[k] = _column[k];
          });
        },

        columnMove: function(columnIds) {  // info is an array of column id's in the target order
          var pos = 0, cols = [];  // new column array

          columnIds.forEach(function(id) {
            var col = this.column(id);
            col.position = pos;
            pos++;
            cols.push(col);
          }.bind(this));

          board.columns.splice.apply(board.columns, [0, Number.MAX_VALUE].concat(cols));

        },

        cardCreate: function(card) {
          var column = this.column(card.column);
          column.cardSlots.push([card]);
          parseCards();
        },

        cardUpdate: function(_card) {
          var card = this.card(_card.id);
          Object.keys(_card).forEach(function(k) {
            card[k] = _card[k];
          });
        },

        cardUpvote: function(vote) {
          var card = this.card(vote.card);
          card.votes.push(vote);

          if (vote.user === user.id()) {
            votesRemaining--;
          }
        },

        cardVaporize: function(cardId) {
          var card        = this.card(cardId),
              sourceStack = this.column(card.column).cardSlots;

          sourceStack.splice(card.position - 1, 1);

          figureVotesRemaining();
        },

        cardLock: function(info) {
          var card = this.card(info.id);
          card.locked          = info.username;
          card.lockedByAnother = !info.you;
        },

        cardUnlock: function(info) {
          var card = this.card(info.id);
          card.locked          = false;
          card.lockedByAnother = false;
        },

        cardColor: function(bits) {
          this.card(bits.id).color = bits.color;
        },

        rememberCardLock: function(cardId) {
          if (locks.indexOf(cardId) === -1) locks.push(cardId);
        },

        forgetCardLock: function(cardId) {
          var idx = locks.indexOf(cardId);
          if (idx !== -1) locks.splice(idx, 1);
        },

        getLockedCardIds: function() {
          return locks;
        },

        // Replace the column/piles with the cards of the given id's, in order.
        //
        // info is an object with keys of column id's. Corresponding vals are arrays
        // of arrays, representing the slots in the column, in order. Each such sub-
        // array contains card ids. If there is more than one, then it's a pile.
        // (Note that multiple columns can be updated with one invocation.)
        //
        rebuildColumn: function(info) {
          var cardStacks = {};

          Object.keys(info).forEach(function(columnId) {
            var pos = 1, sourceStack = this.column(columnId).cards;

            cardStacks[columnId] = [];

            // make a new array to replace, renumbering positions as we go
            info[columnId].forEach(function(slotInfo) {
              var slot = [];
              slotInfo.forEach(function(cardId) {
                var card = this.card(cardId);
                card.position = pos;
                card.column   = columnId;
                slot.push(card);
              }.bind(this));
              cardStacks[columnId].push(slot);
              pos++;
            }.bind(this));

          }.bind(this));

          // replace the entire contents of each column with our new stack of cardSlots
          Object.keys(cardStacks).forEach(function(columnId) {
            var sourceStack = this.column(columnId).cardSlots;

            sourceStack.splice.apply(sourceStack,
              [0, Number.MAX_VALUE].concat(cardStacks[columnId]));

          }.bind(this));

        },

        cardMove: function(info) {
          this.rebuildColumn(info);
        },

        combineCards: function(info) {
          var cardInfo       = info.card,
              sourceMap      = info.sourceMap,
              sourceColumnId = info.sourceColumnId,
              destColumn     = this.column(cardInfo.column),
              card           = this.card(cardInfo.id),
              remap          = {};

          // Reorder the source column, removing the the dragged card if it's there
          remap[sourceColumnId] = sourceMap.map(function(s) {
            return s.filter(function(id) { return id != card.id; });
          });
          this.rebuildColumn(remap);

          // If topOfPile is coming down flipped on, make sure the others in the
          // relevant pile are flipped off.
          if (cardInfo.topOfPile) {
            destColumn.cardSlots.forEach(function(s) {
              if (!s.length || s[0].position !== cardInfo.position) return;
              s.forEach(function(c) { c.topOfPile = false; });
            });
          }

          // Update some things on the live card.
          card.column    = cardInfo.column;
          card.position  = cardInfo.position;
          card.topOfPile = cardInfo.topOfPile;

          // Add the card to the target slot!
          destColumn.cardSlots[card.position - 1].push(card);
        },

        flipCard: function(cardId) {
          var card = this.card(cardId),
              pile = this.column(card.column).cardSlots[card.position - 1];

          pile.forEach(function(c) {
            c.topOfPile = Boolean(c.id === card.id);
          });
        }

      };
    }])
})();
