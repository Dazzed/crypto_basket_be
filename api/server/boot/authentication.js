'use strict';

// HACK(mark): These modules are lazily required and cause problems for jest.
// Requiring them in the boot script alleviates this problem.
require('../server-passport');
require('loopback-component-passport');
require('express-flash');
require('passport-local');

require('../server-web');
require('cookie-parser');
require('express-session');
require('connect-ensure-login');

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();
};
