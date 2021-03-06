const BitGoJS = require('bitgo');
const transfer = require('./transfer');
var BigNumber = require('bignumber.js');
BigNumber.config({ RANGE: 500 });

module.exports = function (transfer) {
  transfer.webhook = function (ctx, walletId, hash, coin, cb) {
    console.log('in the webhook', walletId, hash);
    var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    var txid = '';
    const processWebhook = async () => {
      const existingTransf = await transfer.findOne({ where: { txHash: hash } });
      if (existingTransf) {
        await existingTransf.updateAttributes({ 'confirmedTime': new Date(), confirmed: true, state: 'complete'});
        return true;
      } else {
        const wallet = await bitgo.coin(coin).wallets().get({ id: walletId });
        const mostRecentTranf = await transfer.find({ order: 'id DESC', limit: 1 })[0];
        let transactionList = [];
        try {
          transactionList = await wallet.transfers({ prevId: mostRecentTranf.txid });
        } catch (e) {
          transactionList = await wallet.transfers();
        }
        let transaction = null;
        transactionList.transfers.forEach(elem => {
          if (elem.txid === hash) {
            transaction = elem;
          }
        });
        if (!transaction) {
          return false;
        }
        let optRecieve = null;
        let optSend = null;
        transaction.entries.forEach(elem => {
          if (elem.wallet) {
            optRecieve = elem;
          } else if (elem.value >= 0) {
            optSend = elem;
          } else if (transaction.entries.length === 2) {
            optSend = elem;
          }
        });
        // console.log('optRecieve', optRecieve);
        const Wallet = await transfer.app.models.wallet.findOne({ where: { address: optRecieve.address } });
        let dividedValue = 0;
        if (coin === 'tbtc') {
          dividedValue = BigNumber(transaction.value).div("1e8").toString();
        } else if (coin === 'teth') {
          dividedValue = BigNumber(transaction.value).div("1e18").toString();
        }
        const updatedWallet = await Wallet.updateAttribute('indivisibleQuantity', parseFloat(Wallet.indivisibleQuantity) + parseFloat(transaction.value));
        const data = {
          coin: coin === 'tbtc' ? 'BTC' : 'ETH',
          txid: transaction.id,
          txHash: hash,
          wallet: Wallet,
          sourceAddress: optSend.address,
          destAddress: optRecieve.address,
          invidisibleValue: transaction.value,
          value: dividedValue,
          usdValue: transaction.usd,
          userId: Wallet.userId,
          confirmed: false,
          txType: 'deposit',
          state: 'pending'
        };
        if (transaction.state === 'confirmed') {
          data.confirmedTime = new Date();
          data.confirmed = true;
        }
        await transfer.create(data);
        console.log('created transfer');
      }
      return true;
    };
    processWebhook().then(transfer => {
      console.log('transfer', transfer ? 'created/updated' : 'not created/updated');
    }).catch(e =>{
      console.log('Transfer failed', e);
    });
    ctx.res.status(200).send(null);
  };
  transfer.remoteMethod('webhook', {
    accepts: [
      {
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      },
      {
        arg: 'wallet',
        type: 'string'
      },
      {
        arg: 'hash',
        type: 'string'
      },
      {
        arg: 'coin',
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
