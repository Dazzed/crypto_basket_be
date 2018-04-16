module.exports = {
  // random number between (1,1000)
  async getPrice(amount, source, destination) {
    return Promise.resolve(Math.floor(Math.random() * 1000));
  }
};
