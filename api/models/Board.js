/**
 * Board
 *
 * @module      :: Model
 * @description :: A board is the thing that users collaborate over
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

var titleRegex = /^.{1,60}$/;

module.exports = {

  schema: true,

  attributes: {

    title: {
      type:  'string',
      regex: titleRegex
    },

    columns: {
      collection: 'column',
      via:        'board'
    },

    creator: { model: 'user' },

    timerLength: 'integer',
    timerStart:  'datetime',

    toJSON: function() {
      var timerLeft = 0;

      if (this.timerStart) {
        timerLeft = this.timerLength
          - (this.timerStart.getTime() - new Date().getTime())
          / 1000;
      }

      return {
        id:        this.id,
        title:     this.title,
        columns:   this.columns,
        creator:   this.creator,
        timerLeft: timerLeft
      };
    }
  },

};
