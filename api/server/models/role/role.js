'use strict';

const validation = require('./validation');

module.exports = function (role) {
  validation(role);

  role.getAdminRole = () => role.findOne({ where: { name: 'admin' } });
  role.getSuperAdminRole = () => role.findOne({ where: { name: 'super_admin' } });
};
