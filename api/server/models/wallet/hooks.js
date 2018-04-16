const {
    badRequest,
    unauthorized,
    internalError
} = require('../../helpers/errorFormatter');
const BitGoJS = require('bitgo');
const uuidv4 = require('uuid/v4');
const loopback = require('loopback');

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
        const {
            skipAllHooks
        } = context.options;
        if (skipAllHooks) {
            next();
        } else {
            if (!context.query.where)
                context.query.where = {};
            if (context.options && context.options.accessToken) {
                const userID = context.options.accessToken.userId;
                const user = await Wallet.app.models.user.findOne({ where: { id: userID } });
                if (!(await user.isAdmin() || await user.isSuperAdmin())) {
                    context.query.where.userId = userID;
                }
            }
            next();
        }
    });
    Wallet.observe('loaded', async (context, next) => {
        const {
            skipAllHooks
        } = context.options;
        if (skipAllHooks) {
            next();
        } else {
            var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
            if (context.data.assetId === 'eth' && !context.data.address.startsWith('0x') && !!context.data.address && context.data.address !== "\"\"") {
                const wallet = await bitgo.coin('teth').wallets().get({ id: process.env.ETH_WALLET });
                const address = await wallet.getAddress({ address: context.data.address });
                if (address.address) {
                    console.log('id', context.data.id);
                    setTimeout(async () => {
                        const instance = await Wallet.findOne({ where: { id: context.data.id } });
                        console.log('instance', instance);
                        await instance.updateAttribute('address', address.address);
                        console.log('updated attribute');
                    }, 1000);
                    context.data.address = address.address;
                }
            }
            const latestETH = await bitgo.coin('teth').markets().latest();
            const priceEth = latestETH.latest.currencies.USD.last;
            const latestBTC = await bitgo.coin('tbtc').markets().latest();
            const priceBtc = latestBTC.latest.currencies.USD.last;
            if (context.data.assetId === 'eth') {
                context.data.usdPrice = context.data.balance / 1e18 * priceEth;
                context.data.btcPrice = context.data.usdPrice / priceBtc;
            } else if (context.data.assetId === 'btc') {
                context.data.usdPrice = context.data.balance / 1e8 * priceBtc;
                context.data.ethPrice = context.data.usdPrice / priceEth;
            }
            next();
        }
    });
};
