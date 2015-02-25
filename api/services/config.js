var conf = sails.config.app;

module.exports = {
  all:     function() { return conf; },
  signin:  function() { return conf.signin; },
  colsets: function() { return conf.colsets; },
  colsetsById: function() {
    var ret = {};
    conf.colsets.forEach(function(s) { ret[s.id] = s; });
    return ret;
  }
};
