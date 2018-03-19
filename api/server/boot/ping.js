'use strict';

module.exports = function(server) {
  // Install a `/ping` route that returns server status
  var router = server.loopback.Router();
  router.get('/ping', server.loopback.status());
  server.use(router);
};
