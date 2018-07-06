const moment = require('moment');
const _ = require('lodash');

const observe = async (context, Trade) => {
  if (!context.query.where)
    context.query.where = {};
  if (context.options && context.options.accessToken) {
    const userID = context.options.accessToken.userId;
    const user = await Trade.app.models.user.findOne({ where: { id: userID } });
    if (!(await user.isAdmin() || await user.isSuperAdmin())) {
      context.query.where.userId = userID;
    }
  }
  return true;
};

module.exports = function (Trade) {
  Trade.observe('access', async (context, next) => {
    if (context.options.skipAllHooks) {
      return next();
    } else {
      return observe(context, Trade).then(n => {
        return next();
      }).catch(e => {
        return next(e);
      });
    }
  });

  Trade.beforeRemote('find', (ctx, _, next) => {
    if (ctx.args && ctx.args.filter && ctx.args.filter.custom_filter) {
      if (ctx.args.filter.custom_filter.start_range && ctx.args.filter.custom_filter.end_range) {
        ctx.args.filter = {
          ...ctx.args.filter,
          where: {
            ...ctx.args.filter.where,
            and: [
              {
                createdAt: {
                  gte: moment(ctx.args.filter.custom_filter.start_range).set('hours', 0).set('minutes', 0),
                }
              },
              {
                createdAt: {
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

  Trade.afterRemote('find', async (ctx, result, next) => {
    let filter;
    if (ctx.args && ctx.args.filter && ctx.args.filter.where) {
      filter = ctx.args.filter.where;
    }
    const count = await Trade.count(filter);
    ctx.res.set('X-Total-Count', count);
  });
};
