module.exports.randomString = function(length, possible) {
  var ret      = '',
      possible = possible || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      i;

  for (i=0; i<length; i++) {
    ret += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return ret;
};
