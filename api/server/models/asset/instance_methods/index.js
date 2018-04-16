const { price } = require('../priceConversion');

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
        price(this.quantity, this.ticker, 'usd'),
        // 2
        this.ticker === 'btc' ?
          Promise.resolve(Number(this.minPurchaseAmount)) :
          price(this.minPurchaseAmount, this.ticker, 'btc'),
        // 3
        this.ticker === 'eth' ?
          Promise.resolve(Number(this.minPurchaseAmount)) :
          price(this.minPurchaseAmount, this.ticker, 'eth'),
        // 4
        price(this.minPurchaseAmount, this.ticker, 'usd')
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

  /**
   * populateCommunityValue
   *   Assets:
   *     As an admin I should be able to view the 1.`quantity` and
   *     2.`total amount (BTC, ETH, USD)` of an asset which is currently held by the community
   * @returns {undefined}
   */
  asset.prototype.populateCommunityValue = async function () {
    try {
      // 1
      const thizWallets = await this.wallets.find({}, { skipAllHooks: true });
      if (thizWallets.length === 0) {
        this.availableQuantityWithCommunity = 0;
        this.communityValueBTC = 0;
        this.communityValueETH = 0;
        this.communityValueUSD = 0;
      } else {
        this.availableQuantityWithCommunity = thizWallets
          .reduce((acc, thizWallet) => acc + Number(thizWallet.balance), 0);
        // 2
        const [
          communityValueBTC,
          communityValueETH,
          communityValueUSD
        ] = await Promise.all([
          this.ticker === 'btc' ?
            Promise.resolve(Number(this.availableQuantityWithCommunity)) :
            price(this.availableQuantityWithCommunity, this.ticker, 'btc'),
          this.ticker === 'eth' ?
            Promise.resolve(Number(this.availableQuantityWithCommunity)) :
            price(this.availableQuantityWithCommunity, this.ticker, 'eth'),
          price(this.availableQuantityWithCommunity, this.ticker, 'usd')
        ]);
        this.communityValueBTC = communityValueBTC;
        this.communityValueETH = communityValueETH;
        this.communityValueUSD = communityValueUSD;
      }
    } catch (error) {
      console.log('Error in asset.prototype.populateCommunityValue');
      console.log(error);
      throw error;
    }
  };

  /**
   * populateCommunityQuantity
   *   Assets:
   *     As an admin I should be able to view the total available 1.`quantity` of each
   *     asset (total quantity - total held by community)
   * @returns {undefined}
   */
  asset.prototype.populateCommunityQuantity = async function () {
    try {
      // 1
      const thizWallets = await this.wallets.find({}, { skipAllHooks: true });
      if (thizWallets.length === 0) {
        this.availableQuantityWithCommunity = 0;
      } else {
        this.availableQuantityWithCommunity = thizWallets
          .reduce((acc, thizWallet) => acc + Number(thizWallet.balance), 0);
      }
    } catch (error) {
      console.log('Error in asset.prototype.populateCommunityQuantity');
      console.log(error);
      throw error;
    }
  };

    /**
   * populatePrices
   *   Assets:
   *     As an admin I should be able to view a list of all individual assets which with name,
   *     amount (BTC, ETH, and USD) and a current available quantity for purchase.
   * @returns {undefined}
   */
  asset.prototype.populatePrices = async function () {
    try {
      const [
        totalValueInUSD,
        totalValueInBTC,
        totalValueInETH,
      ] = await Promise.all([
        // 1
        price(this.quantity, this.ticker, 'usd'),
        // 2
        this.ticker === 'btc' ?
          Promise.resolve(Number(this.quantity)) :
          price(this.quantity, this.ticker, 'btc'),
        // 3
        this.ticker === 'eth' ?
          Promise.resolve(Number(this.quantity)) :
          price(this.quantity, this.ticker, 'eth'),
      ]);
      this.totalValueInUSD = totalValueInUSD;
      this.totalValueInBTC = totalValueInBTC;
      this.totalValueInETH = totalValueInETH;
    } catch (error) {
      console.log('Error in asset.prototype.populatePrices');
      console.log(error);
      throw error;
    }
  };
};
