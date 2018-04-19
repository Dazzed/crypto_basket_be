module.exports = {
  validateMinMaxValues(data, instance) {
    const {
      minPurchaseAmount,
      maxPurchaseAmount,
      minSaleAmount,
      maxSaleAmount
    } = data;
    let error = false;
    let message = '';
    if (minPurchaseAmount) {
      if (minPurchaseAmount > instance.maxPurchaseAmount) {
        error = true;
        message = 'minPurchaseAmount cannot be greater than maxPurchaseAmount';
      }
    }
    if (maxPurchaseAmount) {
      if (maxPurchaseAmount < instance.minPurchaseAmount) {
        error = true;
        message = 'maxPurchaseAmount cannot be lesser than minPurchaseAmount';
      }
    }
    if (minSaleAmount) {
      if (minSaleAmount > instance.maxSaleAmount) {
        error = true;
        message = 'minSaleAmount cannot be greater than maxSaleAmount';
      }
    }
    if (maxSaleAmount) {
      if (maxSaleAmount < instance.minSaleAmount) {
        error = true;
        message = 'maxSaleAmount cannot be greater than minSaleAmount';
      }
    }
    return {
      error,
      message
    };
  }
};
