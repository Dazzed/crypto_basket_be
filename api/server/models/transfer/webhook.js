const BitGoJS = require('bitgo');
const transfer = require('./transfer');
const user = require('../user/user');
module.exports = function(transfer){
  transfer.webhook = function(ctx, walletId, hash, cb) {

    console.log('in the webhook', walletId, hash);
    var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    var txid = "";
    var UsdBtcRatio = 1;
    bitgo.markets().latest({}).then(market=>{
      return market.latest.currencies.USD;
    }).then(prices=>{
        UsdBtcRatio = prices.last;
      return bitgo.wallets().get({id:walletId});
    }).then(wallet => {
        return wallet.getTransaction({id:hash});
    }).then(trans => {
        return trans;
    }).then(trans=>{
        return trans.outputs[0];
    }).then(opt=>{
      return transfer.app.models.wallet.findOne({address: opt.account}).then(wallet => {
        console.log('bew balance', parseFloat(wallet.balance)+parseFloat(opt.value), wallet.balance, opt.value);
        return wallet.updateAttribute('balance', parseFloat(wallet.balance)+parseFloat(opt.value)).then(wall=>{
          console.log('wall', wall);
          return transfer.create({
            coin: "BTC",
            txid: hash,
            wallet: wallet,
            sourceAddress: opt.account,
            destAddress: walletId,
            value: opt.value,
            usdValue: opt.value/1e8*UsdBtcRatio
          });
        });
      });
  });

    ctx.res.status(200).send(null);
  };
  transfer.remoteMethod('webhook', {
    accepts: [
      {
        arg: 'ctx',
        type: 'object',
        http:{
          source: 'context'
        }
      },
      {
        arg: 'walletId',
        type: 'string'
      },
      {
        arg: 'hash',
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
