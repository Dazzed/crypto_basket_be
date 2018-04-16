'use strict';

const BASE_ASSETS = [
  {
    name: 'Bitcoin',
    ticker: 'btc',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Ethereum',
    ticker: 'eth',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Ripple',
    ticker: 'xrp',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Bitcoin Cash',
    ticker: 'bch',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Litecoin',
    ticker: 'ltc',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Stellar',
    ticker: 'xlm',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Monero',
    ticker: 'xmr',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'ZCash',
    ticker: 'xmr',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Dash',
    ticker: 'dash',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  },
  {
    name: 'Cardano',
    ticker: 'ada',
    hidden: false,
    minPurchaseAmount: 0,
    minSaleAmount: 0,
    maxSaleAmount: 10000,
    maxPurchaseAmount: 10000,
    buyMargin: 0.01,
    saleMargin: 0.01,
    quantity: 10000,
    exchangeRates: {}
  }
];

module.exports = async server => {
  try {
    const { asset } = server.models;
    for (const index in BASE_ASSETS) {
      const assetInstance = await asset.findOne({ where: { ticker: BASE_ASSETS[index].ticker } });
      if (!assetInstance) {
        await asset.create(BASE_ASSETS[index]);
      }
    }
  } catch (e) {
    console.error(e);
  }
};
