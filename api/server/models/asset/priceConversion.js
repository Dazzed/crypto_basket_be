const app = require('../../server');
const BigNumber = require('bignumber.js');
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
  if(!fromAssetInstance){
    throw("Invalid fromAsset please provide ticker like btc or eth");
  }
  if (fromAssetInstance && fromAssetInstance.exchangeRates[toAsset]) {
    // console.log('in from asset if');
    if (method === 'ask') {
      // console.log('in from asset ask');
      return amount * fromAssetInstance.exchangeRates[toAsset][method];
    } else if (method === 'bid') {
      // console.log('in from asset bid');
      return amount * fromAssetInstance.exchangeRates[toAsset][invMethod];
    } else {
      // console.log('in from asset other');
      return amount * fromAssetInstance.exchangeRates[toAsset][method];
    }
  } else {
    const toAssetInstance = await app.models.asset.findOne({ where: { ticker: toAsset } });
    if ((!toAssetInstance || !fromAssetInstance.exchangeRates || !fromAssetInstance.exchangeRates[toAssetInstance.ticker]) && (!toAssetInstance || !toAssetInstance.exchangeRates || !toAssetInstance.exchangeRates[fromAssetInstance.ticker])){
      return null;
    }
    if(!toAssetInstance){
      return null;
    }
    if (toAssetInstance && toAssetInstance.exchangeRates[fromAsset]) {
      // console.log('in to asset if');
      if (method === 'ask') {
        // console.log('in to asset ask');
        return amount / toAssetInstance.exchangeRates[fromAsset][invMethod];
      } else if (method === 'bid') {
        // console.log('in to asset bid');
        return amount / toAssetInstance.exchangeRates[fromAsset][method];
      } else {
        // console.log('in to asset else');
        return amount / toAssetInstance.exchangeRates[fromAsset][method];
      }
    } else {
      const priceBTC = await convert(amount, fromAsset, 'btc', method);
      const priceToAsset = await convert(priceBTC, 'btc', toAsset, method);
      if (priceBTC!==null && priceToAsset!==null) {
        return priceToAsset;
      } else {
        const priceEth = await convert(amount, fromAsset, 'eth', method);
        const priceEthToAsset = await convert(priceEth, 'eth', toAsset, method);
        if (priceEthToAsset!==null) {
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
  const price = await convert(amount, fromAsset, toAsset, 'price');
  return price; 
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
