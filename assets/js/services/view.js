// Holds info related to the screen's state
(function() {
  'use strict';
  angular.module('hansei.services')
    .factory('view', ['$filter', '$timeout', function($filter, $timeout) {

      var defaultColumn     = {id: 0, label: 'View All'},
          timerInputDefault = '5:00';

      var closeMenus = function() {
        view.cardMenu.switch();
        view.boardMenu.toggle(false);
        view.timer.toggleForm(false);
      };

      var decideToggle = function(open, current) {
        if (open === undefined) {
          return !current;
        } else {
          return Boolean(open);
        }
      };

      var maybeStopEvent = function($event) {
        if (!$event) return;
        $event.stopPropagation();
        $event.preventDefault();
      };

      var view = {
        init: function(board) {
          this.tab.current      = 'board';
          this.column.options   = [defaultColumn];
          this.column.current   = defaultColumn;
          this.cardMenu.current = null;
          this.timer.showForm   = false;
          this.timer.showStart  = false;
          if (board.timerRunning) {
            this.timer.popTheClock();
          } else {
            this.timer.showStart = true;
            this.timer.setInputSeconds(board.timerLength);
          }
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
          current: null,                   // card id of open menu
          switch: function(cId, $event) {  // card id or undefined to close all
            if (this.current === cId || cId === undefined) {
              this.current = null;
            } else {
              this.current = cId;
              view.boardMenu.toggle(false);
              view.timer.toggleForm(false);
            }
            maybeStopEvent($event);
          }
        },

        boardMenu: {
          shown: false,
          toggle: function(open, $event) {  // true, false, or undefined to toggle
            maybeStopEvent($event);
            this.shown = decideToggle(open, this.shown);
            if (this.shown) {
              view.cardMenu.switch(undefined);
              view.timer.toggleForm(false);
            }
          }
        },

        timer: {
          showForm:  false,
          showStart: true,
          clockPop:  false,
          input:     timerInputDefault,
          start: function() {
            this.showStart = false;
            this.showForm  = false;
            this.popTheClock();
          },
          resetInput: function() { this.input = timerInputDefault; },
          setInputSeconds: function(seconds) {
            this.input = $filter('secondsToMinutes')(seconds);
          },
          inputInSeconds: function() {
            return $filter('minutesToSeconds')(this.input);
          },
          popTheClock: function() {
            this.clockPop = true;
            $timeout(function() { this.clockPop = false; }.bind(this), 500);
          },
          toggleForm: function(open, $event) {  // true, false, or undefined to toggle
            maybeStopEvent($event);
            this.showForm = decideToggle(open, this.showForm);
            if (this.showForm) {
              view.boardMenu.toggle(false);
              view.cardMenu.switch(undefined);
            }
          }
        }
      };

      return view;

    }])
})();
