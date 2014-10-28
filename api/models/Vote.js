/**
 * Vote
 *
 * @module      :: Model
 * @description :: A vote is a "+1" for a Card
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  schema: true,

  attributes: {
    user: { model: 'user' },
    card: { model: 'card' }
  }

};
