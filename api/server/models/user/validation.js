'use strict';

module.exports = function(user) {
  user.validatesPresenceOf('email');
  user.validatesPresenceOf('password');
  user.validatesPresenceOf('firstName');
  user.validatesPresenceOf('lastName');
  user.validatesPresenceOf('username');
  user.validatesPresenceOf('dob');
  user.validatesPresenceOf('address');
  user.validatesPresenceOf('phone');
  user.validatesPresenceOf('city');
  user.validatesPresenceOf('state');
  user.validatesPresenceOf('country');
};
