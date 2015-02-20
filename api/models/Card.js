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

    // only relevant if the card is in a stack, that is, shares the same column and
    // position of another card. When a stack exists, in this case, cards are ordered
    // from lowest id to greatest id, and the last card or the one with topOfPile as
    // true is on top.
    topOfPile: {
      type:       'boolean',
      defaultsTo: false
    },

    creator: { model: 'user' },

    column: { model: 'column' },

    votes: {
      collection: 'vote',
      via:        'card'
    },

    toJSON: function() {
      return {
        id:         this.id,
        creator:    this.creator,
        content:    this.content,
        position:   this.position,
        topOfPile:  this.topOfPile,
        column:     this.column,
        votes:      this.votes
      };
    }
  }
};
