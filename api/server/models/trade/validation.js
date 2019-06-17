module.exports = function(trade) {
  trade.validatesPresenceOf('fromAssetId');
  trade.validatesPresenceOf('toAssetId');

  trade.validatesInclusionOf('state', {
    in: ['initiated', 'pending', 'confirmed', 'completed', 'failed', 'canceled']
  });
};
