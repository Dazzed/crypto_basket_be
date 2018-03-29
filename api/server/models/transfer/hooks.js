const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');
const BitGoJS = require('bitgo');
const uuidv4 = require('uuid/v4');
const loopback = require('loopback');

module.exports = function (Transfer) {
    
  Transfer.observe('access', async (context, next) => {
    if(!context.query.where)
        context.query.where = {};
    if(context.options && context.options.accessToken)
        context.query.where.userId = context.options.accessToken.userId;
    next();
  });
};
