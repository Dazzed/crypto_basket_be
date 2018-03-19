'use strict';

const validation = require('./validation');

module.exports = function(accessToken) {
  validation(accessToken);
};
