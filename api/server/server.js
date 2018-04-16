'use strict';
process.setMaxListeners(0);

require('dotenv').config();
var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

global.log = console.log;
global.sleep = millis => new Promise(resolve => setTimeout(resolve.bind(null, millis), millis));

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;
  require('./server-passport')(app);
  if (app.get('webEnabled')) require('./server-web')(app);

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
