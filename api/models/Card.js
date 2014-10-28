/**
 * Card
 *
 * @module      :: Model
 * @description :: A card is a unit of content under a column
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  schema: true,

  attributes: {

    content:  'string',
    position: 'integer',

    column: { model: 'column' },

    votes: {
      collection: 'vote',
      via:        'card'
    }
  }

};
