'use strict';

module.exports = function(asset) {
  require('./instance_methods')(asset);
  require('./hooks')(asset);
  require('./remote_methods')(asset);
};
