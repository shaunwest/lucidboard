// Holds info related to the screen's state
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('view', ['$filter', function($filter) {

      var defaultColumn     = {id: 0, label: 'View All'},
          timerInputDefault = '5:00';

      var closeMenus = function() {
        view.cardMenu.switch();
        view.boardMenu.toggle(false);
      };

      var view = {
        init: function() {
          this.tab.current      = 'board';
          this.column.options   = [defaultColumn];
          this.column.current   = defaultColumn;
          this.cardMenu.current = null;
          this.timer.showForm   = false;
          this.timer.showStart  = false;
        },

        cardDragging:   false,
        columnDragging: false,

        closeMenus: closeMenus,

        tab: {
          current: 'board',
          switch: function(tabName, otherwise) {
            closeMenus();
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
            if (this.current === cId || cId === undefined) {
              this.current = null;
            } else {
              this.current = cId;
            }
          }
        },

        boardMenu: {
          shown: false,
          toggle: function(open) {
            if (open === undefined) {
              this.shown = !this.shown;
            } else {
              this.shown = Boolean(open)
            }
          }
        },

        timer: {
          showForm:  false,
          showStart: true,
          input:     timerInputDefault,
          resetInput: function() { this.input = timerInputDefault; },
          setInputSeconds: function(seconds) {
            this.input = $filter('secondsToMinutes')(seconds);
          },
          inputInSeconds: function() {
            return $filter('minutesToSeconds')(this.input);
          }
        }
      };

      return view;

    }])
})();
