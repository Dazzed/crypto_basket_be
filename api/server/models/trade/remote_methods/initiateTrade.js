const priceConvert = require('../../asset/priceConversion');
const { tradeEmail } = require('../../../helpers/sendGrid');
const _ = require('lodash');
var BigNumber = require('bignumber.js');
BigNumber.config({ RANGE: 500 });

const completeTrade = async (trade) => {
    await fromWallet.updateAttribute('indivisibleQuantity', BigNumber(fromWallet.indivisibleQuantity).minus(BigNumber(fromAssetAmount).multipliedBy(fromAsset.scalar)));
    await toWallet.updateAttribute('indivisibleQuantity', BigNumber(toWallet.indivisibleQuantity).plus(BigNumber(toAssetAmount).multipliedBy(toAsset.scalar)));
    //consumedIndivisibleQuantity
    if(tradeType === 'buy'){
      await toAsset.updateAttribute('consumedIndivisibleQuantity', BigNumber(toAsset.consumedIndivisibleQuantity).plus(BigNumber(toAssetAmount).multipliedBy(toAsset.scalar)));
    }else{
      await toAsset.updateAttribute('consumedIndivisibleQuantity', BigNumber(fromAsset.consumedIndivisibleQuantity).minus(BigNumber(fromAssetAmount).multipliedBy(fromAsset.scalar)));
    }
    const fromWalletUpdated = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: fromAsset.ticker } });
    const toWalletUpdated = await Trade.app.models.wallet.findOne({ where: { userId: userId, assetId: toAsset.ticker } });
    tradeEmail(user, trade, fromAsset, toAsset, fromWalletUpdated, toWalletUpdated);
}

module.exports = Trade => {
  Trade.initiateTrade = async (context, request, response, fromAssetId, toAssetId, fromAssetAmount, toAssetAmount, tradeType) => {
    const userId = request.accessToken.userId;
    const user = await Trade.app.models.user.findOne({ where: { id: userId } });
    fromAssetAmount = parseFloat(fromAssetAmount);
    toAssetAmount = parseFloat(toAssetAmount);
    if (fromAssetId === toAssetId) {
      return response.status(400).send({ message: 'Cannot trade asset for itself' });
    }
    if (tradeType !== 'buy' && tradeType !== 'sell') {
      return response.status(400).send({ message: 'An asset must be bought or sold, tradeType may only be \'buy\' or \'sell\'' });
    }
    const fromAsset = await Trade.app.models.asset.findOne({ where: { id: fromAssetId } });
    const toAsset = await Trade.app.models.asset.findOne({ where: { id: toAssetId } });
    if(!fromAsset || !toAsset){
      return response.status(400).send({ message: 'You must provide both a selling and buying asset.' });
    }
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
    if (tradeType==='sell' && fromAssetAmount > fromAsset.maxSaleAmount) {
      return response.status(400).send({ message: 'Maximum sale amount exceeded' });
    }
    if (tradeType==='sell' && fromAssetAmount < fromAsset.minSaleAmount) {
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

    const available = BigNumber(toAsset.indivisibleQuantity).minus(toAsset.consumedIndivisibleQuantity).div(toAsset.scalar);
    
    if(available.gte(toAssetAmount)){
      data.state = 'completed';
      const trade = await Trade.create(data);
      await completeTrade(trade);
    }else{
      data.state = 'pending';
      const trade = await Trade.create(data);
    }
    
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
    let errors = [];
    fromAssetAmount = parseFloat(fromAssetAmount);
    toAssetAmount = parseFloat(toAssetAmount);
    if (fromAssetId === toAssetId) {
      return response.status(400).send({ message: 'Cannot trade asset for itself' });
    }
    if (tradeType !== 'buy' && tradeType !== 'sell') {
      return response.status(400).send({ message: 'An asset must be bought or sold, tradeType may only be \'buy\' or \'sell\'' });
    }
    const fromAsset = await Trade.app.models.asset.findOne({ where: { id: fromAssetId } });
    const toAsset = await Trade.app.models.asset.findOne({ where: { id: toAssetId } });
    if(!fromAsset || !toAsset){
      return response.status(400).send({ message: 'You must provide both a selling and buying asset.' });
    }
    if(tradeType === 'buy' && !(fromAsset.ticker === 'btc' || fromAsset.ticker === 'eth')){
      return response.status(400).send({ message: 'You can only buy using BTC or ETH.' });
    }
    if(tradeType === 'sell' && !(toAsset.ticker === 'btc' || toAsset.ticker === 'eth')){
      return response.status(400).send({ message: 'You can only sell to BTC or ETH.' });
    }
    if (fromAsset.hidden || toAsset.hidden) {
      errors.push('One or both assets unavailable for trading' );
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
      errors.push('Maximum purchase amount exceeded');
    }
    if (tradeType==='buy' && toAssetAmount < toAsset.minPurchaseAmount) {
      errors.push('Minimum purchase amount not met');
    }
    if (tradeType==='sell' && fromAssetAmount > fromAsset.maxSaleAmount) {
      errors.push('Maximum sale amount exceeded');
    }
    if (tradeType==='sell' && fromAssetAmount < fromAsset.minSaleAmount) {
      errors.push('Minimum sale amount not met');
    }

    if (Number(fromAssetAmount) > BigNumber(fromWallet.indivisibleQuantity).div(fromAsset.scalar).toNumber()) {
      errors.push('Source wallet has insufficient balanace');
    }
    const data = {
      userId,
      fromAssetId,
      toAssetId,
      fromAssetAmount,
      toAssetAmount,
      fromAsset,
      toAsset,
      errors: errors
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

  Trade.cancelTrade = async (context, request, response, id) => {
    const userId = request.accessToken.userId;
    const user = await Trade.app.models.user.findOne({where: {id: userId}});
    const tradeInstance = await Trade.findOne({where: { id: id }});
    if((userId !== tradeInstance.userId) && !(await user.isAdmin() || await user.isSuperAdmin())){
      return response.status(403).send("You do not have permissions to perform this action.");
    }
    if(tradeInstance.state !== 'pending'){
      return response.status(403).send("You cannot cancel a trade that is not currently pending.");
    }
    const updatedTrade = await tradeInstance.updateAttribute('state', 'canceled');
    return updatedTrade;
  }

  Trade.remoteMethod('cancelTrade', {
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
        arg: 'id',
        type: 'number'
      }
    ],
    returns: [],
    http: {
      status: 200,
      verb: 'post'
    }
  });

  Trade.confirmTrade = async (context, request, response, id) => {
    const userId = request.accessToken.userId;
    const user = await Trade.app.models.user.findOne({where: {id: userId}});
    const tradeInstance = await Trade.findOne({where: { id: id }});
    if(!(await user.isAdmin() || await user.isSuperAdmin())){
      return response.status(403).send("You do not have permissions to perform this action.");
    }
    if(tradeInstance.state !== 'pending'){
      return response.status(403).send("You cannot confirm a trade that is not currently pending.");
    }
    const updatedTrade = await tradeInstance.updateAttribute('state', 'confirmed');
    return updatedTrade;
  }

  Trade.remoteMethod('confirmTrade', {
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
        arg: 'id',
        type: 'number'
      }
    ],
    returns: [],
    http: {
      status: 200,
      verb: 'post'
    }
  });


  Trade.completeTrade = async (context, request, response, id) => {
    const userId = request.accessToken.userId;
    const user = await Trade.app.models.user.findOne({where: {id: userId}});
    const tradeInstance = await Trade.findOne({where: { id: id }});
    if(!(await user.isAdmin() || await user.isSuperAdmin())){
      return response.status(403).send("You do not have permissions to perform this action.");
    }
    if(tradeInstance.state !== 'confirmed'){
      return response.status(403).send("You cannot complete a trade that is not currently confirmed.");
    }
    await completeTrade(tradeInstance);
    const updatedTrade = await tradeInstance.updateAttribute('state', 'completed');
    return updatedTrade;
  }

  Trade.remoteMethod('completeTrade', {
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
        arg: 'id',
        type: 'number'
      }
    ],
    returns: [],
    http: {
      status: 200,
      verb: 'post'
    }
  });
};