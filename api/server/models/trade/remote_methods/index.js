module.exports = function(Trade) {
  require('./initiateTrade')(Trade);
  require('./search')(Trade);
  require('./searchByUser')(Trade);
};
