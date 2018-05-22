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
    if (!context.query.where)
      context.query.where = {};
    if (context.options && context.options.accessToken) {
      const userID = context.options.accessToken.userId;
      const user = await Transfer.app.models.user.findOne({ where: { id: userID } });
      if (!(await user.isAdmin() || await user.isSuperAdmin())) {
        context.query.where.userId = userID;
      }
    }
    next();
  });

  Transfer.afterRemote('find', async (ctx, result, next) => {
    let filter;
    if (ctx.args && ctx.args.filter && ctx.args.filter.where) {
      filter = ctx.args.filter.where;
    }
    const count = await Transfer.count(filter);
    ctx.res.set('X-Total-Count', count);
  });
};
