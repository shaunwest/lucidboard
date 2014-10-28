/**
 * Column
 *
 * @module      :: Model
 * @description :: A column is a set of cards under a board
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

var titleRegex = /^.{1,20}$/;

module.exports = {

  schema: true,

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
    }

  }

};
