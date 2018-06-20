var BigNumber = require('bignumber.js');
const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const speakeasy = require('speakeasy');

BigNumber.config({ RANGE: 500 });

module.exports = transfer => {
      createRemoteMethod({
    model: transfer,
    name: 'refund',
    accepts: [
      { arg: 'userId', type: 'number', required: true, description: 'User ID' },
      { arg: 'coin', type: 'string', required: true, description: 'Cryptocurrency, BTC or ETH' },
      { arg: 'amount', type: 'string', required: true, description: 'Amount to refund' },
      { arg: 'otp', type: 'string', required: true, description: 'Two Factor Auth OTP' }
    ],
    description: 'Admin utility to issue refunds',
    httpOptions: {
      errorStatus: 400,
      path: '/refund/',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  transfer.refund = async function (request, response, userId, coin, amount, otp, cb) {
    console.log('in refund', userId, coin, amount, otp);
    const selfId = request.accessToken.userId;
    const currentUser = await transfer.app.models.user.findOne({ where: { id: selfId } });
    const Asset = await transfer.app.models.asset.findOne({ where: { ticker: coin.toLowerCase() } });
    const Wallet = await transfer.app.models.wallet.findOne({ where: { and: [{ userId: userId },{ assetId: coin.toLowerCase() }] } });
    try {
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      let secret = currentTemporarySecret && currentTemporarySecret.secret ? currentTemporarySecret.secret : currentUser.twoFactorSecret;
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: otp
      });
      if (!verified) {
        return response.status(400).send({ message: 'Invalid OTP' });
      }
      if (currentTemporarySecret && currentTemporarySecret.secret) {
        currentUser.twoFactorSecret = currentTemporarySecret.secret;
        await currentUser.save();
        await currentTemporarySecret.destroy();
      }
      if(await currentUser.isSuperAdmin()){
        const usdValue = 0;
        let data = {
            coin: coin,
            txid: "refund",
            txHash: "refund",
            wallet: Wallet,
            sourceAddress: "refund",
            destAddress: "refund",
            invidisibleValue: BigNumber(amount).multipliedBy(Asset.scalar).toString(),
            value: amount,
            usdValue: usdValue,
            userId: userId,
            confirmed: true,
            txType: 'refund',
            state: 'complete'
        };
        const createdTransfer = await transfer.create(data);
        const newAmount = Wallet.indivisibleQuantity && !isNaN(Wallet.indivisibleQuantity) ? BigNumber(Wallet.indivisibleQuantity).div(Asset.scalar).plus(amount).multipliedBy(Asset.scalar).toString() : BigNumber(amount).multipliedBy(Asset.scalar).toString();
        await Wallet.updateAttribute('indivisibleQuantity', newAmount);
        return createdTransfer;
      }else{
        return response.status(400).send('You are not authorized to perform this action');
      }
    } catch (error) {
      console.log('Error in remote method user.verifyTwoFactor ', error);
      return response.status(500).send('Internal Server error');
    }
    
  };
}