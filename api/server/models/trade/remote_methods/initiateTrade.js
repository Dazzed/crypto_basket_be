const priceConvert = require('../../asset/priceConversion');
const { tradeEmail } = require('../../../helpers/sendGrid');
const _ = require('lodash');
var BigNumber = require('bignumber.js');
BigNumber.config({ RANGE: 500 });

module.exports = Trade => {
  Trade.initiateTrade = async (context, request, response, fromAssetId, toAssetId, fromAssetAmount, toAssetAmount, tradeType) => {
    const userId = request.accessToken.userId;
    const user = await Trade.app.models.user.findOne({ where: { id: userId } });
    if (fromAssetId === toAssetId) {
      return response.status(400).send({ message: 'Cannot trade asset for itself' });
    }
    if (tradeType !== 'buy' && tradeType !== 'sell') {
      return response.status(400).send({ message: 'An asset must be bought or sold, tradeType may only be \'buy\' or \'sell\'' });
    }
    const fromAsset = await Trade.app.models.asset.findOne({ where: { id: fromAssetId } });
    const toAsset = await Trade.app.models.asset.findOne({ where: { id: toAssetId } });
    if(tradeType === 'buy' && !(fromAsset.ticker === 'btc' || fromAsset.ticker === 'eth')){
      return response.status(400).send({ message: 'You can only buy using BTC or ETH.' });
    }
    if(tradeType === 'sell' && !(toAsset.ticker === 'btc' || toAsset.ticker === 'eth')){
      return response.status(400).send({ message: 'You can only sell to BTC or ETH.' });
    }
    if (fromAsset.hidden || toAsset.hidden) {
      return response.status(400).send({ message: 'One or both assets unavailable for trading' });
    }
    if ((!fromAsset.exchangeRates || !fromAsset.exchangeRates[toAsset.ticker]) && (!toAsset.exchangeRates || !toAsset.exchangeRates[fromAsset.ticker])){
      return response.status(400).send({ message: 'Exchange rates unavailable for asset pair, cannot trade at this time.' });
    }
    const fromWallet = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: fromAsset.ticker } });
    const toWallet = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: toAsset.ticker } });
    if (!fromWallet)
      return response.status(400).send({ message: 'You do not have a wallet for ' + fromAsset.name });
    if (!toWallet)
      return response.status(400).send({ message: 'You do not have a wallet for ' + toAsset.name });
    if (tradeType === 'buy') {
      const truePrice = await priceConvert.buy((1 - parseFloat(toAsset.buyMargin)) * parseFloat(toAssetAmount), fromAsset.ticker, toAsset.ticker);
      if (Math.abs(truePrice - fromAssetAmount) / truePrice > 0.05) {
        return response.status(400).send({ message: 'Price has varied too drastically from original transaction price, please try transaction again and complete it in a timely fashion' });
      } else {
        fromAssetAmount = truePrice;
      }
    } else {
      const truePrice = await priceConvert.sell((1 - parseFloat(fromAsset.saleMargin)) * parseFloat(fromAssetAmount), fromAsset.ticker, toAsset.ticker);
      if (Math.abs(truePrice - toAssetAmount) / truePrice > 0.05) {
        return response.status(400).send({ message: 'Price has varied too drastically from original transaction price, please try transaction again and complete it in a timely fashion' });
      } else {
        toAssetAmount = truePrice;
      }
    }

    if (tradeType==='buy' && toAssetAmount > toAsset.maxPurchaseAmount) {
      return response.status(400).send({ message: 'Maximum purchase amount exceeded' });
    }
    if (tradeType==='buy' && toAssetAmount < toAsset.minPurchaseAmount) {
      return response.status(400).send({ message: 'Minimum purchase amount not met' });
    }
    if (tradeType==='sell' && fromAssetAmount > toAsset.maxSaleAmount) {
      return response.status(400).send({ message: 'Maximum sale amount exceeded' });
    }
    if (tradeType==='sell' && toAssetAmount < toAsset.minSaleAmount) {
      return response.status(400).send({ message: 'Minimum sale amount not met' });
    }

    if (fromAssetAmount > BigNumber(fromWallet.indivisibleQuantity).div(fromAsset.scalar).toNumber()) {
      return response.status(400).send({ message: 'Source wallet has insufficient balanace' });
    }

    const data = {
      userId: userId,
      fromAssetId: fromAssetId,
      toAssetId: toAssetId,
      fromWalletId: fromWallet.id,
      toWalletId: toWallet.id,
      fromAssetAmount: fromAssetAmount,
      toAssetAmount: toAssetAmount,
      isBuy: tradeType === 'buy'
    };

    const trade = await Trade.create(data);
    await fromWallet.updateAttribute('indivisibleQuantity', BigNumber(fromWallet.indivisibleQuantity).minus(BigNumber(fromAssetAmount).multipliedBy(toAsset.scalar)));
    await toWallet.updateAttribute('indivisibleQuantity', BigNumber(toWallet.indivisibleQuantity).minus(BigNumber(toAssetAmount).multipliedBy(toAsset.scalar)));
    const fromWalletUpdated = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: fromAsset.ticker } });
    const toWalletUpdated = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: toAsset.ticker } });
    tradeEmail(user, trade, fromAsset, toAsset, fromWalletUpdated, toWalletUpdated);
    const myWallets = await user.wallets.find();
    return response.status(200).send({ message: trade, myWallets });
  };

  Trade.remoteMethod('initiateTrade', {
    accepts: [
      {
        arg: 'context',
        type: 'object',
        http: {
          source: 'context'
        }
      },
      {
        arg: 'request',
        type: 'object',
        http: {
          source: 'req'
        }
      },
      {
        arg: 'response',
        type: 'object',
        http: {
          source: 'res'
        }
      },
      {
        arg: 'fromAssetId',
        type: 'number'
      },
      {
        arg: 'toAssetId',
        type: 'number'
      },
      {
        arg: 'fromAssetAmount',
        type: 'number'
      },
      {
        arg: 'toAssetAmount',
        type: 'number'
      },
      {
        arg: 'tradeType',
        type: 'string'
      }
    ],
    returns: [],
    http: {
      status: 200,
      verb: 'post'
    }
  });
  Trade.estimateTrade = async (context, request, response, fromAssetId, toAssetId, fromAssetAmount, toAssetAmount, tradeType) => {
    const userId = request.accessToken.userId;
    if (fromAssetId === toAssetId) {
      return response.status(400).send({ message: 'Cannot trade asset for itself' });
    }
    if (tradeType !== 'buy' && tradeType !== 'sell') {
      return response.status(400).send({ message: 'An asset must be bought or sold, tradeType may only be \'buy\' or \'sell\'' });
    }
    const fromAsset = await Trade.app.models.asset.findOne({ where: { id: fromAssetId } });
    const toAsset = await Trade.app.models.asset.findOne({ where: { id: toAssetId } });
    if(tradeType === 'buy' && !(fromAsset.ticker === 'btc' || fromAsset.ticker === 'eth')){
      return response.status(400).send({ message: 'You can only buy using BTC or ETH.' });
    }
    if(tradeType === 'sell' && !(toAsset.ticker === 'btc' || toAsset.ticker === 'eth')){
      return response.status(400).send({ message: 'You can only sell to BTC or ETH.' });
    }
    // console.log('fromAsset', fromAsset, 'toAsset', toAsset);
    if (fromAsset.hidden || toAsset.hidden) {
      return response.status(400).send({ message: 'One or both assets unavailable for trading' });
    }

    const fromWallet = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: fromAsset.ticker } });
    const toWallet = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: toAsset.ticker } });
    if (!fromWallet)
      return response.status(400).send({ message: 'You do not have a wallet for ' + fromAsset.name });
    if (!toWallet)
      return response.status(400).send({ message: 'You do not have a wallet for ' + toAsset.name });

    if (tradeType === 'buy') {
      const truePrice = await priceConvert.buy((1 - parseFloat(toAsset.buyMargin)) * parseFloat(toAssetAmount), fromAsset.ticker, toAsset.ticker);
      fromAssetAmount = truePrice;
    } else {
      const truePrice = await priceConvert.sell((1 - parseFloat(fromAsset.saleMargin)) * parseFloat(fromAssetAmount), fromAsset.ticker, toAsset.ticker);
      toAssetAmount = truePrice;
    }

    if (tradeType==='buy' && toAssetAmount > toAsset.maxPurchaseAmount) {
      return response.status(400).send({ message: 'Maximum purchase amount exceeded' });
    }
    if (tradeType==='buy' && toAssetAmount < toAsset.minPurchaseAmount) {
      return response.status(400).send({ message: 'Minimum purchase amount not met' });
    }
    if (tradeType==='sell' && fromAssetAmount > toAsset.maxSaleAmount) {
      return response.status(400).send({ message: 'Maximum sale amount exceeded' });
    }
    if (tradeType==='sell' && toAssetAmount < toAsset.minSaleAmount) {
      return response.status(400).send({ message: 'Minimum sale amount not met' });
    }

    if (Number(fromAssetAmount) > BigNumber(fromWallet.indivisibleQuantity).div(fromAsset.scalar).toNumber()) {
      return response.status(400).send({ message: 'Source wallet has insufficient balanace' });
    }
    const data = {
      userId,
      fromAssetId,
      toAssetId,
      fromAssetAmount,
      toAssetAmount,
      fromAsset,
      toAsset
    };
    return response.status(200).send({ message: data });
  };

  Trade.remoteMethod('estimateTrade', {
    accepts: [
      {
        arg: 'context',
        type: 'object',
        http: {
          source: 'context'
        }
      },
      {
        arg: 'request',
        type: 'object',
        http: {
          source: 'req'
        }
      },
      {
        arg: 'response',
        type: 'object',
        http: {
          source: 'res'
        }
      },
      {
        arg: 'fromAssetId',
        type: 'number'
      },
      {
        arg: 'toAssetId',
        type: 'number'
      },
      {
        arg: 'fromAssetAmount',
        type: 'number'
      },
      {
        arg: 'toAssetAmount',
        type: 'number'
      },
      {
        arg: 'tradeType',
        type: 'string'
      }
    ],
    returns: [],
    http: {
      status: 200,
      verb: 'post'
    }
  });
};
