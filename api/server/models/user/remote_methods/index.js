module.exports = function(user) {
  require('./search')(user);
  require('./filterByVerification')(user);
};
