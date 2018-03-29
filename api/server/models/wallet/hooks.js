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
        const foundWallet = await Wallet.findOne({where: {userId: userId, assetId: assetId}});
        if(foundWallet){
            return next(badRequest('Already have a wallet of this type.'));
        }
        var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
        if(assetId === 'btc' || assetId == 'eth'){
            const testCoin = "t" + assetId;
            try{
                const wallet = await bitgo.coin(testCoin).wallets().get({ id: testCoin === 'tbtc' ? process.env.BTC_WALLET : process.env.ETH_WALLET});
                const address = await wallet.createAddress({ label: uuidv4() });
                if(assetId === 'btc'){
                    context.args.data.address = address.address;
                }else{
                    context.args.data.address = address.id;
                }
            }
            catch(e){
                console.log('Error creating wallet');
            }
        }

  });
  Wallet.observe('access', async (context, next) => {
    if(!context.query.where)
        context.query.where = {};
    if(context.options && context.options.accessToken)
        context.query.where.userId = context.options.accessToken.userId;
    next();
  });
  Wallet.observe('loaded', async (context, next) => {
    if(context.data.assetId==='eth' && !context.data.address.startsWith('0x') && !!context.data.address && context.data.address!=="\"\""){
        var bitgo = new BitGoJS.BitGo({ env: 'test', accessToken: process.env.BITGO_API_KEY });
        const wallet = await bitgo.coin('teth').wallets().get({ id: process.env.ETH_WALLET});
        const address = await wallet.getAddress({address: context.data.address});
        if(address.address){
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
    next();
  });
};
