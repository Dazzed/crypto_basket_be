const server = require('../../../server');

module.exports = function(user) {
  async function getRole(id) {
    try {
      const { role } = server.models;
      const targetRole = await role.findById(Number(id));
      return targetRole;
    } catch (error) {
      throw error;
    }
  }

  async function getUserRoleMapping(userId) {
    try {
      const { roleMapping } = server.models;
      const targetRoleMapping = await roleMapping.findOne({
        where: {
          principalId: Number(userId)
        }
      });
      return targetRoleMapping;
    } catch (error) {
      throw error;
    }
  }

  user.isAdmin = async userId => {
    try {
      if (!userId) {
        return false;
      }
      const targetRoleMapping = await getUserRoleMapping(Number(userId));
      if (!targetRoleMapping) {
        return false;
      }
      const targetRole = await getRole(targetRoleMapping.roleId);
      if (targetRole.name === 'admin') {
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  user.isSuperAdmin = async userId => {
    try {
      if (!userId) {
        return false;
      }
      const targetRoleMapping = await getUserRoleMapping(Number(userId));
      if (!targetRoleMapping) {
        return false;
      }
      const targetRole = await getRole(targetRoleMapping.roleId);
      if (targetRole.name === 'super_admin') {
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };
};
