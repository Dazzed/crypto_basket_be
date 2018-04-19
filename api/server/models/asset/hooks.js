const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');

const {
  validateMinMaxValues
} = require('./validations');

module.exports = function (asset) {
  asset.afterRemote('find', async (context, assetInstances, next) => {
    try {
      if (context.args.filter) {
        const { custom_include } = context.args.filter;
        if (custom_include && assetInstances && assetInstances.length) {
          if (!Array.isArray(custom_include)) {
            return next(badRequest('custom_include must be an Array'));
          }
          if (custom_include.includes('populateValueAndMinimumPurchase')) {
            await Promise.all(
              assetInstances.map(
                thizInstance => thizInstance.populateValueAndMinimumPurchase()
              )
            );
          }
          if (custom_include.includes('populateCommunityValues')) {
            await Promise.all(
              assetInstances.map(
                thizInstance => thizInstance.populateCommunityValue()
              )
            );
          }
          if (custom_include.includes('populateCommunityQuantity')) {
            await Promise.all(
              assetInstances.map(
                thizInstance => thizInstance.populateCommunityQuantity()
              )
            );
          }
          if (custom_include.includes('populatePrices')) {
            await Promise.all(
              assetInstances.map(
                thizInstance => thizInstance.populatePrices()
              )
            );
          }
        }
      }
    } catch (error) {
      console.log('Error in asset.afterRemote find');
      console.log(error);
      next(internalError());
    }
  });

  asset.afterRemote('findById', async (context, instance, next) => {
    try {
      if (context.args.filter && instance) {
        const { custom_include } = context.args.filter;
        if (custom_include) {
          if (!Array.isArray(custom_include)) {
            return next(badRequest('custom_include must be an Array'));
          }
          if (custom_include.includes('populateValueAndMinimumPurchase')) {
            await instance.populateValueAndMinimumPurchase();
          }
          if (custom_include.includes('populateCommunityValues')) {
            await instance.populateCommunityValue();
          }
          if (custom_include.includes('populateCommunityQuantity')) {
            await instance.populateCommunityQuantity();
          }
          if (custom_include.includes('populatePrices')) {
            await instance.populatePrices();
          }
        }
      }
    } catch (error) {
      console.log('Error in asset.afterRemote findById');
      console.log(error);
      next(internalError());
    }
  });

  asset.beforeRemote('prototype.patchAttributes', async (context, instance, next) => {
    try {
      const minMaxValidation = validateMinMaxValues(context.args.data, context.instance);
      if (minMaxValidation.error) {
        return next(badRequest(minMaxValidation.message));
      }
    } catch (error) {
      console.log('Error in asset.beforeRemote prototype.patchAttributes');
      console.log(error);
      next(internalError());
    }
  });
};
