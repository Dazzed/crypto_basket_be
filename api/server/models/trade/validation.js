module.exports = function(trade) {
  trade.validatesPresenceOf('quantity');
  trade.validatesPresenceOf('exchangeRate');
  trade.validatesPresenceOf('fromAssetAmount');
  trade.validatesPresenceOf('toAssetAmount');

  trade.validatesPresenceOf('userId');
  trade.validatesPresenceOf('fromAssetId');
  trade.validatesPresenceOf('toAssetId');
};
