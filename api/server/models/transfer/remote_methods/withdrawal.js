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
      { arg: 'coin', type: 'string', required: true, description: 'BTC or ETH' },
      { arg: 'amount', type: 'string', required: true, description: 'Amount of currency to withdraw.' },
      { arg: 'address', type: 'string', required: true, description: 'Address to send currency to.' },
      { arg: 'otp', type: 'string', required: true, description: 'Google Authenticator Code' }
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

  transfer.initiateWithdrawal = async function (request, response, coin, amount, address, otp, cb) {
    // var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    const userId = request.accessToken.userId;
    // const wallet = await bitgo.coin("t" + coin.toLowerCase()).wallets().get({ id: coin === 'BTC' ? process.env.BTC_WALLET : process.env.ETH_WALLET});
    const Wallet = await transfer.app.models.wallet.findOne({ where: { and: [{ userId: userId },{ assetId: coin.toLowerCase() }] } });
    const Asset = await transfer.app.models.asset.findOne({ where: { ticker: coin.toLowerCase() } });
    const usdValue = 0;
    let data = {
      coin: coin,
      txid: "withdrawal",
      txHash: "withdrawal",
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
    const currentUser = await transfer.app.models.user.findOne({ where: { id: userId }});
    // const wallet = await bitgo.coin("t" + coin.toLowerCase()).wallets().get({ id: coin === 'BTC' ? process.env.BTC_WALLET : process.env.ETH_WALLET});
    try {
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      const verified = speakeasy.totp.verify({
        secret: currentTemporarySecret.secret || currentUser.twoFactorSecret,
        encoding: 'base32',
        token: otp
      });
      if (!verified) {
        return response.status(400).send({ message: 'Invalid OTP' });
      }
      if (currentTemporarySecret.secret) {
        currentUser.twoFactorSecret = currentTemporarySecret.secret;
        await currentUser.save();
        await currentTemporarySecret.destroy();
      }
      const createdTransfer = await transfer.create(data);
      return createdTransfer;
    } catch (error) {
      console.log('Error in remote method transfer.initiateWithdrawal ', error);
      return response.status(500).send('Internal Server error');
    }
    
  };

  createRemoteMethod({
    model: transfer,
    name: 'confirmWithdrawal',
    accepts: [
      { arg: 'id', type: 'string', required: true, description: 'withdrawal ID' },
      { arg: 'otp', type: 'string', required: true, description: 'Google Authenticator Code' }
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

  transfer.confirmWithdrawal = async function (request, response, id, otp, cb) {
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
        token: otp
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
      console.log('Error in remote method transfer.confirmWithdrawal ', error);
      return response.status(500).send('Internal Server error');
    }
  };

  createRemoteMethod({
    model: transfer,
    name: 'cancelWithdrawal',
    accepts: [
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
                return response.status(400).send('You cannot cancel a transaction that is not in the \'initiated\' state.');
            }
        }else{
            if(Transfer.state === 'pending'){
                await Transfer.updateAttribute('state', 'canceled');
                return response.status(200).send('Transaction canceled');
            }else{
                return response.status(400).send('You cannot cancel a transaction that is not in the \'pending\' state as an admin.');
            }

        }
        await Transfer.updateAttribute('state', 'canceled');
        return response.status(200).send('Transaction canceled');
    }else{
        return response.status(400).send('You cannot cancel a transfer that you didn\' make');
    }
    
  };

  createRemoteMethod({
    model: transfer,
    name: 'completeWithdrawal',
    accepts: [
      { arg: 'id', type: 'string', required: true, description: 'withdrawal ID' }
    ],
    description: 'Complete withdrawal.',
    httpOptions: {
      errorStatus: 400,
      path: '/completeWithdrawal/:id',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  transfer.completeWithdrawal = async function (request, response, id, cb) {
    const userId = request.accessToken.userId;
    const user = await transfer.app.models.user.findOne({ where: { id: userID } });
    if(!(await user.isAdmin() || await user.isSuperAdmin())){
        return response.status(400).send('You must be an admin or superadmin to complete a withdrawal.');
    }else{
        const Transfer = await transfer.findOne({ where: { id: id } });
        if(Transfer.state !== 'pending'){
            return response.status(400).send('Withdrawal must be pending to complete.');
        }

        try{
            var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });

            const wallet = await bitgo.coin("t" + Transfer.coin.toLowerCase()).wallets().get({ id: Transfer.coin === 'BTC' ? process.env.BTC_WALLET : process.env.ETH_WALLET});

            const params = {
              amount: Transfer.invidisibleValue,
              address: Transfer.destAddress,
              walletPassphrase: Transfer.coin === 'BTC' ? process.env.BTC_WALLET_PASS : process.env.ETH_WALLET_PASS
            };
            const bitgoResponse = await wallet.send(params);
            const Wallet = await Transfer.wallet();
            const updatedWallet = await Wallet.updateAttribute('indivisibleQuantity', BigNumber(Wallet.indivisibleQuantity).minus(Transfer.invidisibleValue).toString());
            const updatedTransfer = await Transfer.updateAttributes({txid: bitgoResponse.txid, txHash: bitgoResponse.txid, state: 'complete'});
            return { transfer: updatedTransfer, wallet: Wallet};
        }catch(e){
            const updatedTransfer = await Transfer.updateAttributes({state: 'failed'});
            return response.status(500).send('Withdrawal could not be completed');
        }
    }
    
  };
}