const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const _ = require('lodash');

module.exports = Trade => {
  createRemoteMethod({
    model: Trade,
    name: 'custom_find',
    accepts: [
      { arg: 'filter', type: 'object', required: true, description: 'filter json. accepts: page, offset, where, custom_filter(start_range and end_range)' },
      { arg: 'pendingFirst', type: 'boolean', required: true, description: 'order the records by pending first value in state column' },
      { arg: 'inProgress', type: 'boolean', required: true, description: 'order the records by in progress first in state column' }
    ],
    description: 'find trade records.',
    httpOptions: {
      errorStatus: 400,
      path: '/custom_find',
      status: 200,
      verb: 'get',
    },
    returns: { root: true, type: 'array' }
  });

  Trade.custom_find = async (request, response, filter, pendingFirst, inProgress, callback) => {
    try {
      const { user } = Trade.app.models;
      const currentUser = await user.findById(request.accessToken.userId);
      const isRegularUser = await currentUser.isNonPriviledgedUser();
      const ds = Trade.dataSource;
      filter.where = filter.where || {};
      let dateString = '';
      let userFilterWhere = '';
      if (filter.custom_filter) {
        const { custom_filter: { start_range, end_range } } = filter;
        dateString = ` and (T."createdAt" between '${start_range} 00:00:00' and '${end_range} 23:59:59')`;
      }
      if (filter.where.state) {
        userFilterWhere = ` and T.state='${filter.where.state}'`;
      }
      if (isRegularUser) {
        userFilterWhere = ` and T.userid=${currentUser.id}`;
      } else if (filter.where.userId) {
        userFilterWhere = ` and T.userid=${filter.where.userId}`;
      }
      const matches = () => new Promise((resolve, reject) => {
        const orderByClause = (() => {
          if (pendingFirst && inProgress) {
            return `\
              ORDER BY \
                CASE T.state \
                  WHEN 'pending' then 1 \
                  WHEN 'initiated' then 2 \
                END\
            `;
          } else if (pendingFirst) {
            return `\
              ORDER BY \
                CASE T.state \
                  WHEN 'pending' then 1 \
                END\
            `;
          } else if (inProgress) {
            return `\
              ORDER BY \
                CASE T.state \
                  WHEN 'initiated' then 1 \
                END\
            `;
          }
          return '';
        })();
        const sql = `\
select U.email, T.id, T.userid, T."isBuy", T."createdAt", T."updatedAt", T."fromAssetAmount", T."toAssetAmount", T."state", T."usdValue", T."ethValue", T."btcValue",\
FA.name as "fromAssetName", FA.ticker as "fromAssetTicker", TA.name as "toAssetName", TA.ticker as "toAssetTicker" \
from public.trade T left join public.user U on U.id=T.userid \
left join asset FA on T.fromassetid=FA.id \
left join asset TA on T.toassetid=TA.id \
where T."isBuy"=${filter.where.isBuy || false} \
${dateString}${userFilterWhere} ${orderByClause}, T."createdAt" DESC limit ${filter.limit || 10} offset ${filter.offset || 0};`;
        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });

      const countResult = () => new Promise((resolve, reject) => {
        const sql = `\
select count(*) from public.user U left join public.trade T on U.id=T.userid where T."isBuy"='${filter.where.isBuy || false}'${dateString}${userFilterWhere}`;
        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data[0].count);
        });
      });
      const [results, count] = await Promise.all([matches(), countResult()]);
      response.set('X-Total-Count', count);
      return formatResults(results);
    } catch (error) {
      console.log('Error in remote method trade.custom_find ', error);
      return callback(internalError());
    }
  };
};

function formatResults(results) {
  return results.map(r => ({
    ...r,
    fromAsset: {
      name: r.fromAssetName,
      ticker: r.fromAssetTicker
    },
    toAsset: {
      name: r.toAssetName,
      ticker: r.toAssetTicker
    },
    user: {
      email: r.email
    }
  }));
}
