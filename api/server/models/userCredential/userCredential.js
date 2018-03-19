'use strict';

const validation = require('./validation');

module.exports = function(userCredential) {
  validation(userCredential);
};
