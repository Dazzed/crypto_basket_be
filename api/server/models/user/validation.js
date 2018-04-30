'use strict';

module.exports = function(user) {
  user.validatesPresenceOf('email');
  user.validatesPresenceOf('password');
  user.validatesPresenceOf('firstName');
  user.validatesPresenceOf('lastName');
  user.validatesPresenceOf('username');
  // user.validatesFormatOf('username', {
  //   with: /^[a-zA-Z0-9]+$/
  // });
  user.validatesInclusionOf('verificationStatus', {
    in: ['fully_verified', 'unverified', 'verification_pending'],
  });
};
