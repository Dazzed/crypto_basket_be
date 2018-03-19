'use strict';

const validation = require('./validation');
const updateProfilePicture = require('./updateProfilePicture');

module.exports = function(userIdentity) {
  validation(userIdentity);
  updateProfilePicture(userIdentity);
};
