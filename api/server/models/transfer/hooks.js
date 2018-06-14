const moment = require('moment');
const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');

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
  });

  Transfer.beforeRemote('find', (ctx, _, next) => {
    if (ctx.args && ctx.args.filter && ctx.args.filter.custom_filter) {
      if (ctx.args.filter.custom_filter.start_range && ctx.args.filter.custom_filter.end_range) {
        ctx.args.filter = {
          ...ctx.args.filter,
          where: {
            ...ctx.args.filter.where,
            and: [
              {
                confirmedTime: {
                  gte: moment(ctx.args.filter.custom_filter.start_range).set('hours', 0).set('minutes', 0),
                }
              },
              {
                confirmedTime: {
                  lte: moment(ctx.args.filter.custom_filter.end_range).set('hours', 23).set('minutes', 59)
                }
              }
            ]
          }
        };
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
