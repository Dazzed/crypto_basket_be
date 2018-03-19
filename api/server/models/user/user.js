'use strict';

const validation = require('./validation');
const verify = require('./verify');
const reset = require('./reset');

module.exports = function(user) {
  validation(user);
  verify(user);
  reset(user);
};
