module.exports = function (trade) {
  require('./validation')(trade);
  require('./remote_methods')(trade);
};
