const server = require('../../../server');

module.exports = function (user) {
  user.prototype.promoteAdmin = async function() {
    const { role, roleMapping } = server.models;
    const adminRole = await role.getAdminRole();
    await adminRole.principals.create({
      principalType: roleMapping.USER,
      principalId: this.id
    });
  };
};
