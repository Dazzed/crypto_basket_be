'use strict';

module.exports = function (Document) {
  Document.validatesInclusionOf('type', {
    in: ['identity', 'proof']
  });
};
