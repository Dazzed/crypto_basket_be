module.exports = function(transfer) {
  require('./searchByUser')(transfer);
  require('./withdrawal')(transfer);
  require('./refund')(transfer);
};
