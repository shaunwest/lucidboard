/**
 * Column
 *
 * @module      :: Model
 * @description :: A column is a set of cards under a board
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

var titleRegex = /^.{1,25}$/;

module.exports = {

  schema: true,

  titleRegex: titleRegex,

  attributes: {

    title: {
      type:  'string',
      regex: titleRegex
    },

    position: 'integer',

    board: { model: 'board' },

    cards: {
      collection: 'card',
      via:        'column'
    },

    toJSON: function() {
      return {
        id:       this.id,
        title:    this.title,
        position: this.position,
        board:    this.board,
        cards:    this.cards
      };
    }

  }

};
