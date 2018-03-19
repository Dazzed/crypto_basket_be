'use strict';

const validation = require('./validation');

module.exports = function(role) {
  validation(role);
};
