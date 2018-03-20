const validation = require('./validation');
const verify = require('./verify');
const reset = require('./reset');

module.exports = function(user) {
  validation(user);
  verify(user);
  reset(user);

  require('./hooks')(user);

  user.disableRemoteMethodByName('deleteById');
  user.disableRemoteMethodByName('replaceById');
  user.disableRemoteMethodByName('confirm');
  user.disableRemoteMethodByName('prototype.verify');
};
