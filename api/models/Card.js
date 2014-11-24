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

    attached: {  // +1 for each card dropped on this one
      type:       'integer',
      defaultsTo: 0
    },

    column: { model: 'column' },

    votes: {
      collection: 'vote',
      via:        'card'
    },

    toJSON: function() {
      return {
        id:       this.id,
        content:  this.content,
        position: this.position,
        attached: this.attached,
        column:   this.column,
        votes:    this.votes
      };
    }
  }

};
