var User   = require('../models/User'),
    Column = require('../models/Column'),
    conf   = sails.config.app;

var stringifyRegex = function(regex) {
  return String(regex).replace(/^\/|\/$/g, '');
};

conf.regex = {
  username:    stringifyRegex(User.usernameRegex),
  columnTitle: stringifyRegex(Column.titleRegex)
};

module.exports = {
  all:     function() { return conf; },
  signin:  function() { return conf.signin; },
  colsets: function() { return conf.colsets; },
  regex:   function() { return conf.regex; },
  colsetsById: function() {
    var ret = {};
    conf.colsets.forEach(function(s) { ret[s.id] = s; });
    return ret;
  }
};
