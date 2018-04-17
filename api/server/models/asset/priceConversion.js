const app = require('../../server');
const convert = async (amount, fromAsset, toAsset, method) => {
  let invMethod = '';
  if (method) {
    if (method === 'buy') {
      method = 'ask';
      invMethod = 'bid';
    } else if (method === 'sell') {
      method = 'bid';
      invMethod = 'ask';
    } else {
      method = 'price';
      invMethod = 'price';
    }
  } else {
    method = 'price';
    invMethod = 'price';
  }
  const fromAssetInstance = await app.models.asset.findOne({ where: { ticker: fromAsset } });
  if (fromAssetInstance && fromAssetInstance.exchangeRates[toAsset]) {
    if (method === 'ask') {
      return amount * fromAssetInstance.exchangeRates[toAsset][method];
    } else if (method === 'bid') {
      return amount / fromAssetInstance.exchangeRates[toAsset][invMethod];
    } else {
      return amount * fromAssetInstance.exchangeRates[toAsset][method];
    }
  } else {
    const toAssetInstance = await app.models.asset.findOne({ where: { ticker: toAsset } });
    if (toAssetInstance && toAssetInstance.exchangeRates[fromAsset]) {
      if (method === 'ask') {
        return amount * toAssetInstance.exchangeRates[fromAsset][invMethod];
      } else if (method === 'bid') {
        return amount / toAssetInstance.exchangeRates[fromAsset][method];
      } else {
        return amount / toAssetInstance.exchangeRates[fromAsset][method];
      }
    } else {
      const priceBTC = await convert(amount, fromAsset, 'btc', method);
      const priceToAsset = await convert(priceBTC, 'btc', toAsset, method);
      if (priceBTC && priceToAsset) {
        return priceToAsset;
      } else {
        const priceEth = await convert(amount, fromAsset, 'eth', method);
        const priceEthToAsset = await convert(priceEth, 'eth', toAsset, method);
        if (priceEthToAsset) {
          return priceEthToAsset;
        } else {
          return null;
        }
      }
    }
  }
  return null;
};
const price = async (amount, fromAsset, toAsset) => {
  return await convert(amount, fromAsset, toAsset, 'price');
};

const buy = async (amount, fromAsset, toAsset) => {
  return await convert(amount, fromAsset, toAsset, 'buy');
};
const sell = async (amount, fromAsset, toAsset) => {
  return await convert(amount, fromAsset, toAsset, 'sell');
};
exports.convert = convert;
exports.price = price;
exports.buy = buy;
exports.sell = sell;
