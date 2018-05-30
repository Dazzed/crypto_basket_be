'use strict';

module.exports = function(Document) {
  require('./validation')(Document);
  require('./remote_methods')(Document);
};
