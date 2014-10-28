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
  },


};
