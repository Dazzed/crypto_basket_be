var BigNumber = require('bignumber.js');
const createRemoteMethod = require('../../../helpers/createRemoteMethod');

BigNumber.config({ RANGE: 500 });

module.exports = transfer => {
      createRemoteMethod({
    model: transfer,
    name: 'refund',
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
      { arg: 'userId', type: 'string', required: true, description: 'User ID' },
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
    const selfId = request.accessToken.userId;
    const currentUser = await transfer.app.models.user.findOne({ where: { id: selfId } });
    const Asset = await transfer.app.models.asset.findOne({ where: { ticker: coin.toLowerCase() } });
    const Wallet = await transfer.app.models.wallet.findOne({ where: { and: [{ userId: userId },{ assetId: coin.toLowerCase() }] } });
    if(await currentUser.isSuperAdmin()){
      const usdValue = 0;
      let data = {
        coin: coin,
        txid: "",
        txHash: "",
        wallet: Wallet,
        sourceAddress: "",
        destAddress: "",
        invidisibleValue: BigNumber(amount).multipliedBy(Asset.scalar).toString(),
        value: amount,
        usdValue: usdValue,
        userId: userId,
        confirmed: true,
        txType: 'refund',
        state: 'complete'
      };
      const createdTransfer = await transfer.create(data);
      return createdTransfer;
    }else{
        return response.status(400).send('You are not authorized to perform this action');
    }
    
  };
}