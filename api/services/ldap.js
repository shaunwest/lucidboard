var LdapAuth = require('ldapauth');

var auth = function(username, password, dn, cb) {
  return new LdapAuth({
    url:           sails.config.ldap.url,
    adminDn:       sails.config.ldap.adminDn,
    adminPassword: sails.config.ldap.adminPassword,
    searchBase:    dn,
    searchFilter:  sails.config.ldap.searchFilter
  }).authenticate(username, password, cb);
};

module.exports = {
  login: function(username, password, cb) {
    var mydns = sails.config.ldap.dns.slice(0);  // clone the array

    var authCb = function(err, data) {

      if (typeof err === 'string' && err.match(/no such user/)) {
        err = null;  // don't treat this as an error -- try the next dn.
      } else if (typeof err === 'object' && err !== null) {
        if (err.code === 49) {
          err = null;  // don't error. this means username exists, but bad pw.
        }
      }

      if (err) return cb(err);

      if (data) {
        // I took this logic from old eternia, but I'm not sure it will ever
        // actually happen. When I locked my account just now, I was getting
        // the "no such user" message back -- no data object at all.
        if (data.badPwdCount >= sails.config.ldap.maxAttempts) {
          return cb(data.badPwdCount + ' login attempts; denying.');
        } else {
          var hash = {
            dispName:  data.displayName,
            email:     data.mail,
            uid:       data.uid,
            cid:       data.extensionAttribute8,
            username:  data.sAMAccountName
          };

          return cb(null, hash);
        }
      }

      if (mydns.length) {
        auth(username, password, mydns.shift(), authCb);
      } else {
        cb();  // no user found !
      }
    };

    auth(username, password, mydns.shift(), authCb);
  }
};
