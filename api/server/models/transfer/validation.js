'use strict';

module.exports = function(transfer) {
  transfer.validatesInclusionOf('coin', {
    in: ['ETH', 'BTC'],
  });
  transfer.validatesInclusionOf('txType', {
    in: ['deposit', 'withdraw', 'refund']
  });
  transfer.validatesInclusionOf('state', {
    in: ['initiated', 'pending', 'complete', 'failed', 'canceled']
  });
  transfer.validatesPresenceOf('coin');
  transfer.validatesPresenceOf('txid');
  transfer.validatesPresenceOf('usdValue');
  transfer.validatesPresenceOf('sourceAddress');
  transfer.validatesPresenceOf('destAddress');
  transfer.validatesPresenceOf('value');
};
