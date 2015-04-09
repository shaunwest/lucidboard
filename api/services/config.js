var Board  = require('../models/Board'),
    Column = require('../models/Column'),
    User   = require('../models/User'),
    conf   = sails.config.app;

var stringifyRegex = function(regex) {
  return String(regex).replace(/^\/|\/$/g, '');
};

conf.regex = {
  username:    stringifyRegex(User.usernameRegex),
  columnTitle: stringifyRegex(Column.titleRegex),
  boardTitle:  stringifyRegex(Board.titleRegex)
};

module.exports = {
  all:         function() { return conf; },
  appname:     function() { return conf.appname; },
  appversion:  function() { return conf.version; },
  signin:      function() { return conf.signin; },
  colsets:     function() { return conf.colsets; },
  regex:       function() { return conf.regex; },
  colsetsById: function() {
    var ret = {};
    conf.colsets.forEach(function(s) { ret[s.id] = s; });
    return ret;
  }
};
