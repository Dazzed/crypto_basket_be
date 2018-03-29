'use strict';

module.exports = function(Wallet) {
  require('./hooks')(Wallet);
  Wallet.disableRemoteMethodByName('deleteById');
  Wallet.disableRemoteMethodByName('createChangeStream');
  Wallet.disableRemoteMethodByName('updateAll');
  Wallet.disableRemoteMethodByName('upsertWithWhere');
  Wallet.disableRemoteMethodByName('updateAll');
};
