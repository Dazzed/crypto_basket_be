const { getPrice } = require('../../../helpers/mockPrices');

module.exports = function (asset) {
  /**
   * populateValueAndMinimumPurchase
   *   Assets:
   *     As a user I should be able to view a list of all individual assets with name,
   *     1.`total value (USD)`,
   *     and a configureable `minimum amount of purchase (2.BTC, 3.ETH, 4.USD)`.
   * @returns {undefined}
   */
  asset.prototype.populateValueAndMinimumPurchase = async function () {
    try {
      const [
        totalValueInUSD,
        minPurchaseAmountBTC,
        minPurchaseAmountETH,
        minPurchaseAmountUSD
      ] = await Promise.all([
        // 1
        getPrice(this.quantity, this.ticker, 'USD'),
        // 2
        this.ticker === 'BTC' ?
          Promise.resolve(Number(this.minPurchaseAmount)) :
          getPrice(this.minPurchaseAmount, this.ticker, 'BTC'),
        // 3
        this.ticker === 'ETH' ?
          Promise.resolve(Number(this.minPurchaseAmount)) :
          getPrice(this.minPurchaseAmount, this.ticker, 'ETH'),
        // 4
        getPrice(this.minPurchaseAmount, this.ticker, 'USD')
      ]);
      this.totalValueInUSD = totalValueInUSD;
      this.minPurchaseAmountBTC = minPurchaseAmountBTC;
      this.minPurchaseAmountETH = minPurchaseAmountETH;
      this.minPurchaseAmountUSD = minPurchaseAmountUSD;
    } catch (error) {
      console.log('Error in asset.prototype.populateValueAndMinimumPurchase');
      console.log(error);
      throw error;
    }
  };
};
