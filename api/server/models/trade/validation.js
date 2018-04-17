module.exports = function(trade) {
  trade.validatesPresenceOf('fromAssetId');
  trade.validatesPresenceOf('toAssetId');
};
