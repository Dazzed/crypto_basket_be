const priceConvert = require('../../asset/priceConversion');
const { tradeEmail } = require('../../../helpers/sendGrid');
const _ = require('lodash');

module.exports = Trade => {
    Trade.initiateTrade = async (context, request, response, fromAssetId, toAssetId, fromAssetAmount, toAssetAmount, tradeType) => {
        const userId = request.accessToken.userId;
        const user = await Trade.app.models.user.findOne({ where: { id: userId }});
        if(fromAssetId === toAssetId){
            return response.status(400).send('Cannot trade asset for itself');
        }
        if(tradeType!=='buy' && tradeType!=='sell'){
            return response.status(400).send('An asset must be bought or sold, tradeType may only be \'buy\' or \'sell\'');
        }
        const fromAsset = await Trade.app.models.asset.findOne({ where: { id: fromAssetId } });
        const toAsset = await Trade.app.models.asset.findOne({ where: { id: toAssetId } });
        if(!(fromAsset.ticker==='btc' || fromAsset.ticker === 'eth' || toAsset.ticker==='btc' || toAsset.ticker==='eth')){
          return response.status(400).send('At least one of the assets must be ETH or BTC');
        }
        if(fromAsset.hidden || toAsset.hidden){
          return response.status(400).send('One or both assets unavailable for trading');
        }
        const fromWallet = await Trade.app.models.wallet.findOne({where: {userId: userId, assetId: fromAsset.ticker}});
        const toWallet = await Trade.app.models.wallet.findOne({where: {userId: userId, assetId: toAsset.ticker}});
        if(!fromWallet)
          return response.status(400).send('You do not have a wallet for ' + fromAsset.name);
        if(!toWallet)
          return response.status(400).send('You do not have a wallet for ' + toAsset.name);
        if(tradeType==='buy'){
            const truePrice = await priceConvert.buy((1-parseFloat(toAsset.buyMargin))*parseFloat(toAssetAmount), fromAsset.ticker, toAsset.ticker);
            if(Math.abs(truePrice-fromAssetAmount)/truePrice>0.05){
                return response.status(400).send('Price has varied too drastically from original transaction price, please try transaction again and complete it in a timely fashion');
            }else{
                fromAssetAmount = truePrice;
            }
        }else{
            const truePrice = await priceConvert.sell((1-parseFloat(fromAsset.saleMargin))*parseFloat(fromAssetAmount), fromAsset.ticker, toAsset.ticker);
            if(Math.abs(truePrice-toAssetAmount)/truePrice>0.05){
                return response.status(400).send('Price has varied too drastically from original transaction price, please try transaction again and complete it in a timely fashion');
            }else{
                toAssetAmount = truePrice;
            }
        }

        if(toAssetAmount > toAsset.maxPurchaseAmount){
            return response.status(400).send('Maximum purchase amount exceeded');
        }
        else if(toAssetAmount < toAsset.minPurchaseAmount){
            return response.status(400).send('Minimum purchase amount not met');
        }
        else if(fromAssetAmount > toAsset.maxSaleAmount){
            return response.status(400).send('Maximum sale amount exceeded');
        }
        else if(toAssetAmount < toAsset.minSaleAmount){
            return response.status(400).send('Minimum sale amount not met');
        }

        if(fromAssetAmount>fromWallet.balance){
            return response.status(400).send('Source wallet has insufficient balanace');
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
        await fromWallet.updateAttribute('balance', parseFloat(fromWallet.balance) - parseFloat(fromAssetAmount));
        await toWallet.updateAttribute('balance', parseFloat(toWallet.balance) + parseFloat(toAssetAmount));
        const fromWalletUpdated = await Trade.app.models.wallet.findOne({where: {userId: userId, assetId: fromAsset.ticker}});
        const toWalletUpdated = await Trade.app.models.wallet.findOne({where: {userId: userId, assetId: toAsset.ticker}});
        tradeEmail(user, trade, fromAsset, toAsset, fromWalletUpdated, toWalletUpdated);
        return response.status(200).send(trade);

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
        if(fromAssetId === toAssetId){
            return response.status(400).send('Cannot trade asset for itself');
        }
        if(tradeType!=='buy' && tradeType!=='sell'){
            return response.status(400).send('An asset must be bought or sold, tradeType may only be \'buy\' or \'sell\'');
        }
        const fromAsset = await Trade.app.models.asset.findOne({ where: { id: fromAssetId } });
        const toAsset = await Trade.app.models.asset.findOne({ where: { id: toAssetId } });
        // console.log('fromAsset', fromAsset, 'toAsset', toAsset);
        if(fromAsset.hidden || toAsset.hidden){
          return response.status(400).send('One or both assets unavailable for trading');
        }
        
        const fromWallet = await Trade.app.models.wallet.findOne({where: {userId: userId, assetId: fromAsset.ticker}});
        const toWallet = await Trade.app.models.wallet.findOne({where: {userId: userId, assetId: toAsset.ticker}});
        if(!fromWallet)
          return response.status(400).send('You do not have a wallet for ' + fromAsset.name);
        if(!toWallet)
          return response.status(400).send('You do not have a wallet for ' + toAsset.name);

        if(tradeType==='buy'){
            const truePrice = await priceConvert.buy((1-parseFloat(toAsset.buyMargin))*parseFloat(toAssetAmount), fromAsset.ticker, toAsset.ticker);
            fromAssetAmount = truePrice;
        }else{
            const truePrice = await priceConvert.sell((1-parseFloat(fromAsset.saleMargin))*parseFloat(fromAssetAmount), fromAsset.ticker, toAsset.ticker);
            toAssetAmount = truePrice;
        }
        if(fromAssetAmount>fromWallet.balance){
            return response.status(400).send('Source wallet has insufficient balanace');
        }
        const data = {
            userId: userId,
            fromAssetId: fromAssetId,
            toAssetId: toAssetId,
            fromAssetAmount: fromAssetAmount, 
            toAssetAmount: toAssetAmount
        };
        return response.status(200).send(data);
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
}