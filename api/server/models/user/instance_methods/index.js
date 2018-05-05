const server = require('../../../server');
const { price } = require('../../asset/priceConversion');

module.exports = function (user) {
  user.prototype.promoteAdmin = async function () {
    const { role, roleMapping } = server.models;
    const adminRole = await role.getAdminRole();
    await adminRole.principals.create({
      principalType: roleMapping.USER,
      principalId: this.id
    });
  };

  user.prototype.isNonPriviledgedUser = async function () {
    const { roleMapping } = server.models;
    const count = await roleMapping.count({ principalId: this.id });
    return count === 0;
  };

  user.prototype.isAdmin = async function () {
    const { roleMapping, role } = server.models;
    const adminRole = await role.getAdminRole();
    const count = await roleMapping.count({ principalId: this.id, roleId: adminRole.id });
    return count > 0;
  };

  user.prototype.isSuperAdmin = async function () {
    const { roleMapping, role } = server.models;
    const superAdminRole = await role.getSuperAdminRole();
    const count = await roleMapping.count({ principalId: this.id, roleId: superAdminRole.id });
    return count > 0;
  };

  user.prototype.populateAssetValue = async function() {
    const thizWallets = await this.wallets.find({
      include: 'asset'
    });
    for (const thizWallet of thizWallets) {
      const thizBalance = Number(thizWallet.balance);
      console.log('thizWallet.assetID', thizWallet.assetId);
      const [
        totalValueInUSD,
        totalValueInBTC,
        totalValueInETH,
      ] = await Promise.all([
        // 1
        price(thizBalance, thizWallet.assetId, 'usd'),
        // 2
        thizWallet.assetId === 'btc' ?
          Promise.resolve(thizBalance) :
          price(thizBalance, thizWallet.assetId, 'btc'),
        // 3
        thizWallet.assetId === 'eth' ?
          Promise.resolve(thizBalance) :
          price(thizBalance, thizWallet.assetId, 'eth'),
      ]);
      thizWallet.totalValueInUSD = totalValueInUSD;
      thizWallet.totalValueInBTC = totalValueInBTC;
      thizWallet.totalValueInETH = totalValueInETH;
    }

    this.walletsWithPrices = thizWallets;
  };
};
