// Holds info related to the screen's state
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('view', [function() {

      var defaultColumn = {id: 0, label: 'View All'};

      return {
        init: function() {
          this.tab.current      = 'board';
          this.column.options   = [defaultColumn];
          this.column.current   = defaultColumn;
          this.cardMenu.current = null;
        },

        cardDragging:   false,
        columnDragging: false,

        tab: {
          current: 'board',
          switch: function(tabName, otherwise) {
            if (this.current === tabName && otherwise) {
              this.current = otherwise;
            } else {
              this.current = tabName;
            }
          }
        },

        column: {
          options: [defaultColumn],
          current: defaultColumn,
          isAll: function() { return this.current.id === 0; },
          setOptionsByBoard: function(board) {
            var options = board.columns.map(function(column) {
              return {id: column.id, label: column.title, position: column.position};
            });

            options.push(options.shift());  // Move trash from the beginning to the end

            this.options = [defaultColumn].concat(options);
            this.current = this.options[0];
          }
        },

        modal: {
          reconnecting: {
            show:      false,
            closeable: false
          }
        },

        cardMenu: {
          current: null,  // card id of open menu
          switch: function(cId) {
            this.current = this.current === cId ? null : cId;
          }
        }
      };

    }])
})();

