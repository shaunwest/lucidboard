/**
 * User
 *
 * @module      :: Model
 * @description :: A user
 * @docs		    :: http://sailsjs.org/#!documentation/models
 */

var
  crypto        = require('crypto'),
  usernameRegex = /^[a-zA-Z0-9_]{2,20}$/;

module.exports = {

  schema: true,

  usernameRegex: usernameRegex,

  attributes: {
    name: {
      type: 'string',
      regex: usernameRegex,
      unique: true
    },
    // email: {
    //   type: 'string',
    //   unique: true,
    //   required: true
    // },
    // gravatarHash: {
    //   type: 'string'
    // },
    // password: {
    //   type: 'string',
    //   required: true
    // },

    boards: {
      collection: 'board',
      via:        'creator'
    }
  },

  toJSON: function() {
    var obj = this.toObject();
    delete obj.password;
    delete obj._csrf;
    return obj;
  },

  // beforeCreate: function (attrs, next) {
  //   var bcrypt = require('bcrypt');
  //
  //   bcrypt.genSalt(10, function(err, salt) {
  //     if (err) return next(err);
  //
  //     bcrypt.hash(attrs.password, salt, function(err, hash) {
  //       if (err) return next(err);
  //
  //       attrs.password     = hash;
  //       attrs.gravatarHash = crypto.createHash('md5').update(
  //         attrs.email.toLowerCase()
  //       ).digest('hex');
  //
  //       next();
  //     });
  //   });
  // }

};
