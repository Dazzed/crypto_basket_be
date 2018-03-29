'use strict';

module.exports = function(transfer) {
  transfer.validatesInclusionOf('coin', {
    in: ['ETH', 'BTC'],
  });
  transfer.validatesPresenceOf('coin');
  transfer.validatesPresenceOf('txid');
  transfer.validatesPresenceOf('usdValue');
  transfer.validatesPresenceOf('sourceAddress');
  transfer.validatesPresenceOf('destAddress');
  transfer.validatesPresenceOf('value');
};
