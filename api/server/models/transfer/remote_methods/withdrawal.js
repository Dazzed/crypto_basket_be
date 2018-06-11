const BitGoJS = require('bitgo');
const speakeasy = require('speakeasy');
var BigNumber = require('bignumber.js');
const createRemoteMethod = require('../../../helpers/createRemoteMethod');

BigNumber.config({ RANGE: 500 });

module.exports = transfer => {
  createRemoteMethod({
    model: transfer,
    name: 'initiateWithdrawal',
    accepts: [
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
      { arg: 'coin', type: 'string', required: true, description: 'BTC or ETH' },
      { arg: 'amount', type: 'string', required: true, description: 'Amount of currency to withdraw.' },
      { arg: 'address', type: 'string', required: true, description: 'Address to send currency to.' }
    ],
    description: 'Initiate withdrawal from ',
    httpOptions: {
      errorStatus: 400,
      path: '/initiateWithdrawal/',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  transfer.initiateWithdrawal = async function (request, response, coin, amount, address, cb) {
    // var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    const userId = request.accessToken.userId;
    // const wallet = await bitgo.coin("t" + coin.toLowerCase()).wallets().get({ id: coin === 'BTC' ? process.env.BTC_WALLET : process.env.ETH_WALLET});
    const Wallet = await transfer.app.models.wallet.findOne({ where: { and: [{ userId: userId },{ assetId: coin.toLowerCase() }] } });
    const Asset = await transfer.app.models.asset.findOne({ where: { ticker: coin.toLowerCase() } });
    const usdValue = 0;
    let data = {
      coin: coin,
      txid: "",
      txHash: "",
      wallet: Wallet,
      sourceAddress: coin === 'BTC' ? process.env.BTC_WALLET : process.env.ETH_WALLET,
      destAddress: address,
      invidisibleValue: BigNumber(amount).multipliedBy(Asset.scalar).toString(),
      value: amount,
      usdValue: usdValue,
      userId: userId,
      confirmed: false,
      txType: 'withdraw',
      state: 'initiated'
    };

    const createdTransfer = await transfer.create(data);
    return createdTransfer;
  };

  createRemoteMethod({
    model: transfer,
    name: 'confirmWithdrawal',
    accepts: [
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
      { arg: 'id', type: 'string', required: true, description: 'withdrawal ID' },
      { arg: 'opt', type: 'string', required: true, description: 'Google Authenticator Code' }
    ],
    description: 'Confirm Withdrawal with 2FA',
    httpOptions: {
      errorStatus: 400,
      path: '/confirmWithdrawal/:id',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  transfer.confirmWithdrawal = async function (request, response, id, opt, cb) {
    // var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    const userId = request.accessToken.userId;
    const currentUser = await transfer.app.models.user.findOne({ where: { id: userId }});
    // const wallet = await bitgo.coin("t" + coin.toLowerCase()).wallets().get({ id: coin === 'BTC' ? process.env.BTC_WALLET : process.env.ETH_WALLET});
    const Transfer = await transfer.findOne({ where: { id: id } });
    try {
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      const verified = speakeasy.totp.verify({
        secret: currentTemporarySecret.secret || currentUser.twoFactorSecret,
        encoding: 'base32',
        token: opt
      });
      if (!verified) {
        return response.status(400).send({ message: 'Invalid OTP' });
      }
      if (currentTemporarySecret.secret) {
        currentUser.twoFactorSecret = currentTemporarySecret.secret;
        await currentUser.save();
        await currentTemporarySecret.destroy();
      }
      const updatedTransfer = await Transfer.updateAttribute('state', 'pending');
      return updatedTransfer;
    } catch (error) {
      console.log('Error in remote method user.verifyTwoFactor ', error);
      return response.status(500).send('Internal Server error');
    }
  };

  createRemoteMethod({
    model: transfer,
    name: 'cancelWithdrawal',
    accepts: [
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
      { arg: 'id', type: 'string', required: true, description: 'withdrawal ID' }
    ],
    description: 'Cancel withdrawal.',
    httpOptions: {
      errorStatus: 400,
      path: '/cancelWithdrawal/:id',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  transfer.cancelWithdrawal = async function (request, response, id, cb) {
    const userId = request.accessToken.userId;
    const user = await transfer.app.models.user.findOne({ where: { id: userID } });
    const Transfer = await transfer.findOne({ where: { id: id } });
    if((Transfer.userId === userId || (await user.isAdmin() || await user.isSuperAdmin()))){
        if(Transfer.userId === userId){
            if(Transfer.state === 'initiated'){
                await Transfer.updateAttribute('state', 'canceled');
                return response.status(200).send('Transaction canceled');
            }else{
                return response.status(500).send('You cannot cancel a transaction that is not in the \'initiated\' state.');
            }
        }else{
            if(Transfer.state === 'pending'){
                await Transfer.updateAttribute('state', 'canceled');
                return response.status(200).send('Transaction canceled');
            }else{
                return response.status(500).send('You cannot cancel a transaction that is not in the \'pending\' state as an admin.');
            }

        }
        await Transfer.updateAttribute('state', 'canceled');
        return response.status(200).send('Transaction canceled');
    }else{
        return response.status(500).send('You cannot cancel a transfer that you didn\' make');
    }
    
  };
}