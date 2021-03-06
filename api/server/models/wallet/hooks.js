const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');
const BitGoJS = require('bitgo');
const uuidv4 = require('uuid/v4');
const loopback = require('loopback');
const priceConvert = require('../asset/priceConversion');
var BigNumber = require('bignumber.js');
BigNumber.config({ RANGE: 500 });

const loaded = async (context, Wallet) => {
  const asset = await Wallet.app.models.asset.findOne({ where: { ticker: context.data.assetId }});
  const invidQuant = BigNumber(context.data.indivisibleQuantity);
  const scalar = BigNumber(asset.scalar);
  context.data.balance = invidQuant.div(scalar).toNumber();
  var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
  if (!context.data.assetId) {
    return true;
  }
  try{
    if (context.data.assetId === 'eth' && !context.data.address.startsWith('0x') && !!context.data.address && context.data.address !== "\"\"") {
      const wallet = await bitgo.coin('teth').wallets().get({ id: process.env.ETH_WALLET });
      const address = await wallet.getAddress({ address: context.data.address });
      if (address.address) {
        context.data.address = address.address;
        const update = await context.Model.update({id: context.data.id},{address: address.address});
      }
    }

    if (context.data.assetId === 'eth') {
      context.data.usdPrice = await priceConvert.price(context.data.balance, 'eth', 'usd');
      context.data.btcPrice = await priceConvert.price(context.data.balance, 'eth', 'btc');
      context.data.ethPrice = parseFloat(context.data.balance);
    } else if (context.data.assetId === 'btc') {
      context.data.usdPrice = await priceConvert.price(context.data.balance, 'btc', 'usd');
      context.data.ethPrice = await priceConvert.price(context.data.balance, 'btc', 'eth');
      context.data.btcPrice = parseFloat(context.data.balance);
    } else {
      context.data.btcPrice = await priceConvert.price(context.data.balance, context.data.assetId, 'btc');
      context.data.ethPrice = await priceConvert.price(context.data.balance, context.data.assetId, 'eth');
      context.data.usdPrice = await priceConvert.price(context.data.balance, context.data.assetId, 'usd');
    }

  }catch(e){
    console.log(e);
  }
  return true;
};

const observe = async (context, Wallet) => {
  console.log('observe called');
  if (!context.query.where)
    context.query.where = {};
  if (context.options && context.options.accessToken) {
    const userID = context.options.accessToken.userId;
    try{
      const user = await Wallet.app.models.user.findOne({ where: { id: userID } });
      if (!(await user.isAdmin() || await user.isSuperAdmin())) {
        context.query.where.userId = userID;
      }
    }catch(e){
      console.log('Promise rejection in observe');
    }
  }
  return true;
};

async function beforeSave(context) {
  try {
    if (context.isNewInstance) {
      const { assetId, userId } = context.instance;
      const bitgo = new BitGoJS.BitGo({
        env: 'test', accessToken: process.env.BITGO_API_KEY
      });
      if (assetId === 'btc' || assetId === 'eth') {
        const testCoin = 't' + assetId;
        const wallet = await bitgo
          .coin(testCoin).wallets()
          .get({
            id: testCoin === 'tbtc' ? process.env.BTC_WALLET : process.env.ETH_WALLET
          });
        const address = await wallet.createAddress({ label: uuidv4() });
        if (assetId === 'btc') {
          context.instance.address = address.address;
        } else {
          context.instance.address = address.id;
        }
      }
      return true;
    } else {
      return true;
    }
  } catch (error) {
    console.log('Error in Wallet.observe.save', error);
    throw error;
  }
}

module.exports = function (Wallet) {
  Wallet.beforeRemote('create', async (context, _, next) => {
    const assetId = context.args.data.assetId;
    const userId = context.args.options.accessToken.userId;
    context.args.data.userId = userId;
    // console.log('assetId', assetId);
    const foundWallet = await Wallet.findOne({ where: { userId: userId, assetId: assetId } });
    // console.log('foundWallet', foundWallet);
    if (foundWallet) {
      return next(badRequest('Already have a wallet of this type.'));
    }
    var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    if (assetId === 'btc' || assetId == 'eth') {
      const testCoin = 't' + assetId;
      try {
        const wallet = await bitgo.coin(testCoin).wallets().get({ id: testCoin === 'tbtc' ? process.env.BTC_WALLET : process.env.ETH_WALLET });
        const address = await wallet.createAddress({ label: uuidv4() });
        if (assetId === 'btc') {
          context.args.data.address = address.address;
        } else {
          context.args.data.address = address.id;
        }
      } catch (e) {
        console.log('Error creating wallet');
      }
    }
  });

  Wallet.observe('before save', (context, next) => {
    beforeSave(context)
      .then(() => next())
      .catch(() => next(internalError()));
  });

  Wallet.observe('access', (context, next) => {
    if (context.options.skipAllHooks) {
      return next();
    } else {
      observe(context, Wallet).then(n => {
        return next();
      }).catch(e => {
        return next(e);
      });
    }
  });
  Wallet.observe('loaded', (context, next) => {
    if (context.options.skipAllHooks) {
      return next();
    } else {
      loaded(context, Wallet).then(n => {
        return next();
      }).catch(e => {
        return next(e);
      });
    }
  });
};
