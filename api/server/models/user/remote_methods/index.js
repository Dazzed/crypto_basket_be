module.exports = function (user) {
  require('./search')(user);
  require('./filterByVerification')(user);
  require('./initiateTwoFactor')(user);
  require('./verifyTwoFactor')(user);
  require('./archiveUser')(user);
  require('./forgotUsername')(user);
  require('./checkUsername')(user);
  require('./isValidEmailToken')(user);
};
