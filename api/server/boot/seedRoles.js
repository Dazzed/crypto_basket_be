'use strict';

const APP_ROLES = [
  'super_admin',
  'admin'
];

module.exports = async server => {
  try {
    if (global.isUpdatingDataBase) {
      return;
    }
    const {roleMapping, role} = server.models;
    const totalRoleCount = await role.count();
    if (totalRoleCount === 0) {
      for (const appRole of APP_ROLES) {
        await role.create({
          name: appRole
        });
      }
    }
  } catch (e) {
    console.error(e);
  }
};
