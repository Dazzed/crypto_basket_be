'use strict';

module.exports = function(user) {
  user.validatesPresenceOf('email');
  user.validatesPresenceOf('password');
  user.validatesPresenceOf('firstName');
  user.validatesPresenceOf('lastName');
  user.validatesPresenceOf('username');
  user.validatesFormatOf('username', {
    with: /^[a-zA-Z0-9]+$/
  });
  user.validatesPresenceOf('dob');
  user.validatesPresenceOf('address');
  user.validatesPresenceOf('phone');
  user.validatesPresenceOf('city');
  user.validatesPresenceOf('state');
  user.validatesPresenceOf('country');
  user.validatesInclusionOf('verificationStatus', {
    in: ['fully_verified', 'partially_verified', 'unverified', 'verification_pending'],
  });
};
