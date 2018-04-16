const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

const { getPrice } = require('../../../helpers/mockPrices');
module.exports = asset => {
  createRemoteMethod({
    model: asset,
    name: 'communityAssets',
    accepts: [],
    description: 'View the quantity and total amount (BTC, ETH, USD) of an asset which is currently held by the community.',
    httpOptions: {
      errorStatus: 400,
      path: '/communityAssets',
      status: 200,
      verb: 'get',
    }
  });

  asset.communityAssets = async function (request, response) {
    try {
      const { wallet } = asset.app.models;
      const allWallets = await wallet.find({
        include: 'asset'
      }, { skipAllHooks: false });
      return response.status(200).send(allWallets);
    } catch (error) {
      console.log('Error in remote method asset.communityAssets ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
