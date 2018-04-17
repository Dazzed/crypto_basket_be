const {
    badRequest,
    unauthorized,
    internalError
} = require('../../helpers/errorFormatter');
const BitGoJS = require('bitgo');
const uuidv4 = require('uuid/v4');
const loopback = require('loopback');
const priceConvert = require('../asset/priceConversion');

const loaded = async (context, Wallet) => {
    var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
    if (!context.data.assetId) {
        return true;
    }

    if (context.data.assetId === 'eth' && !context.data.address.startsWith('0x') && !!context.data.address && context.data.address !== "\"\"") {
        const wallet = await bitgo.coin('teth').wallets().get({ id: process.env.ETH_WALLET });
        const address = await wallet.getAddress({ address: context.data.address });
        if (address.address) {
            setTimeout(async () => {
                const instance = await Wallet.findOne({ where: { id: context.data.id } });
                await instance.updateAttribute('address', address.address);
            }, 1000);
            context.data.address = address.address;
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
        console.log('ethPrice other', context.data.ethPrice);
        context.data.usdPrice = await priceConvert.price(context.data.balance, context.data.assetId, 'usd');
    }
    return true;
}

const observe = async (context, Wallet) => {
    if (!context.query.where)
        context.query.where = {};
    if (context.options && context.options.accessToken) {
        const userID = context.options.accessToken.userId;
        const user = await Wallet.app.models.user.findOne({ where: { id: userID } });
        if (!(await user.isAdmin() || await user.isSuperAdmin())) {
            context.query.where.userId = userID;
        }
    }
    return true;
}

module.exports = function (Wallet) {
    Wallet.beforeRemote('create', async (context, _, next) => {
        const assetId = context.args.data.assetId;
        const userId = context.args.options.accessToken.userId;
        context.args.data.userId = userId;
        const foundWallet = await Wallet.findOne({ where: { userId: userId, assetId: assetId } });
        if (foundWallet) {
            return next(badRequest('Already have a wallet of this type.'));
        }
        var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
        if (assetId === 'btc' || assetId == 'eth') {
            const testCoin = "t" + assetId;
            try {
                const wallet = await bitgo.coin(testCoin).wallets().get({ id: testCoin === 'tbtc' ? process.env.BTC_WALLET : process.env.ETH_WALLET });
                const address = await wallet.createAddress({ label: uuidv4() });
                if (assetId === 'btc') {
                    context.args.data.address = address.address;
                } else {
                    context.args.data.address = address.id;
                }
            }
            catch (e) {
                console.log('Error creating wallet');
            }
        }

    });
    Wallet.observe('access', async (context, next) => {
        if (context.options.skipAllHooks) {
            return next();
        } else {
            return observe(context, Wallet).then(n => {
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
            return loaded(context, Wallet).then(n => {
                return next();
            }).catch(e => {
                return next(e);
            });
        }
    });
};
