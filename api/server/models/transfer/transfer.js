'use strict';

const validation = require('./validation');
const webhook = require('./webhook');

module.exports = function(transfer) {
  // validation(transfer);
  webhook(transfer);

  require('./hooks')(transfer);
  transfer.disableRemoteMethodByName('deleteById');
  transfer.disableRemoteMethodByName('exists');
  transfer.disableRemoteMethodByName('patchOrCreate');
  transfer.disableRemoteMethodByName('replaceOrCreate');
  transfer.disableRemoteMethodByName('createChangeStream');
  transfer.disableRemoteMethodByName('updateAll');
  transfer.disableRemoteMethodByName('upsertWithWhere');
  transfer.disableRemoteMethodByName('create');
  transfer.disableRemoteMethodByName('replaceById');
  transfer.disableRemoteMethodByName('updateAll');
  transfer.disableRemoteMethodByName('prototype.patchAttributes');

  require('./remote_methods')(transfer);
};
