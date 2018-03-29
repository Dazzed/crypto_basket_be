module.exports = function(twoFactorTemp) {
  twoFactorTemp.validatesPresenceOf('userId');
  twoFactorTemp.validatesPresenceOf('secret');
};
