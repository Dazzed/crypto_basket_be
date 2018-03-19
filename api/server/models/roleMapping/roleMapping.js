'use strict';

const validation = require('./validation');

module.exports = function(roleMapping) {
  validation(roleMapping);
};
