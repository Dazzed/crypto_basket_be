'use strict';

module.exports = function(user) {
  user.validatesPresenceOf('email');
  user.validatesPresenceOf('password');
  user.validatesPresenceOf('firstName');
  user.validatesPresenceOf('lastName');
};
