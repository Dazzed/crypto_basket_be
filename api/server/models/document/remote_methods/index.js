'use strict';

module.exports = function (Document) {
  require('./uploadIdentity')(Document);
  require('./uploadProof')(Document);
};
