const validation = require('./validation');

module.exports = function (twoFactorTemp) {
  validation(twoFactorTemp);
};
