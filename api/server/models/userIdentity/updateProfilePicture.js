'use strict';

const debug = require('debug')('gdt:loopback:authentication');

module.exports = function(userIdentity) {
  userIdentity.observe('after save', (context, next) => {
    const userId = context.instance.userId;
    var profilePictureUrl = '';

    try {
      if (context.instance.provider === 'facebook') {
        profilePictureUrl = context.instance.profile.photos[0].value;
      } else if (context.instance.provider === 'google') {
        profilePictureUrl = context.instance.profile._json.picture;
      }
    } catch (error) {
      debug('error updating profile picture');
    }

    userIdentity.app.models.user.findById(userId, (err, user) => {
      if (err) return err;
      user.updateAttribute('profilePictureUrl', profilePictureUrl);
    });
    next();
  });
};
