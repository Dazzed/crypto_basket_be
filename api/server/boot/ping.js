'use strict';

module.exports = function(server) {
  // Install a `/ping` route that returns server status
  if (global.isUpdatingDataBase) {
    return;
  }
  var router = server.loopback.Router();
  router.get('/ping', server.loopback.status());
  server.use(router);
};
