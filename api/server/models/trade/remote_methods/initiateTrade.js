const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

const { getPrice } = require('../../../helpers/mockPrices');
module.exports = trade => {
  createRemoteMethod({
    model: trade,
    name: 'initiateTrade',
    accepts: [
      { arg: 'quantity', type: 'number', required: true, description: 'Pass the quantity of the target asset' },
      { arg: 'fromAssetId', type: 'number', required: true, description: 'Pass the source assetId' },
      { arg: 'toAssetId', type: 'number', required: true, description: 'Pass the target assetId' }
    ],
    description: 'Validates the hidden status of the asset and responds back with success or failure',
    httpOptions: {
      errorStatus: 400,
      path: '/initiateTrade',
      status: 200,
      verb: 'post',
    }
  });

  trade.beforeRemote('initiateTrade', async (context, _, next) => {
    try {
      const { toAssetId, fromAssetId } = context.args;
      const { asset } = trade.app.models;
      const targetAsset = await asset.findById(toAssetId);
      if (!targetAsset) {
        return next(badRequest('Invalid toAssetId'));
      } else if (targetAsset.hidden) {
        return next(badRequest('target asset is hidden'));
      }
      const fromAsset = await asset.findById(fromAssetId);
      if (!fromAsset) {
        return next(badRequest('Invalid fromAssetId'));
      }
      context.args.request.fromAsset = fromAsset;
      context.args.request.targetAsset = targetAsset;
    } catch (error) {
      console.log('Error in trade.beforeRemote initiateTrade', error);
      return next(internalError());
    }
  });

  trade.initiateTrade = async (request, response, quantity) => {
    try {
      const { fromAsset, targetAsset } = request;
      const price = await getPrice(quantity, fromAsset.ticker, targetAsset.ticker);
      return response.status(200).send({
        price
      });
    } catch (error) {
      console.log('Error in remote method trade.initiateTrade ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
