'use strict';

const config = require('../../../server/config.json');
const path = require('path');

module.exports = function(User) {
  // send verification email after registration
  if (config.emailVerificationRequired) {
    User.afterRemote('create', function(context, user, next) {
      var options = {
        type: 'email',
        to: user.email,
        from: config.emailSender,
        subject: config.verifyEmailSubject,
        template: path.join(__dirname, '../../../template/verify.ejs'),
        redirect: '/verified',
        user: user,
      };
      user.verify(options, function(err, response) {
        if (err) {
          User.deleteById(user.id);
          return next(err);
        }
      });
    });
  }
};
