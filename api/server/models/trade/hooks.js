const priceConvert = require('../asset/priceConversion');
const { tradeEmail } = require('../../helpers/sendGrid');
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
}

module.exports = function(Trade) {
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
};
