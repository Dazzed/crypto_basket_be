const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const _ = require('lodash');

module.exports = Trade => {
  createRemoteMethod({
    model: Trade,
    name: 'searchByUser',
    accepts: [
      { arg: 'term', type: 'string', required: true, description: 'search term (only email, firstName, lastName)' },
      { arg: 'filter', type: 'object', required: false, description: 'filter' },
    ],
    description: 'search for trades by users',
    httpOptions: {
      errorStatus: 400,
      path: '/searchByUser/:term',
      status: 200,
      verb: 'get',
    },
    returns: { root: true, type: 'array' }
  });

  Trade.searchByUser = async (request, response, originalTerm, filter = {}, callback) => {
    try {
      const ds = Trade.dataSource;
      filter.where = filter.where || {};
      const term = originalTerm.toLowerCase();
      let dateString = '';
      if (filter.custom_filter) {
        const { custom_filter: { start_range, end_range } } = filter;
        dateString = ` and (T."createdAt" between '${start_range} 00:00:00' and '${end_range} 23:59:59')`;
      }
      const matches = () => new Promise((resolve, reject) => {
        const sql = `\
select U.email, T."isBuy", T."createdAt", T."updatedAt", T."fromAssetAmount", T."toAssetAmount", \
FA.name as "fromAssetName", FA.ticker as "fromAssetTicker", TA.name as "toAssetName", TA.ticker as "toAssetTicker" \
from public.user U left join public.trade T on U.id=T.userid \
left join asset FA on T.fromassetid=FA.id \
left join asset TA on T.toassetid=TA.id \
where T."isBuy"=${filter.where.isBuy || false} and \
(LOWER(U.email) like '%${term}%' or LOWER(U."firstName") like '%${term}%' \
or LOWER(U."lastName") like '%${term}%') ${dateString} order by T.id DESC limit 10 offset ${filter.offset || 0};`;

        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });

      const countResult = () => new Promise((resolve, reject) => {
        const sql = `\
select count(*) from public.user U left join public.trade T on U.id=T.userid where T."isBuy"='${filter.where.isBuy || false}' and (LOWER(U.email) like '%${term}%' or LOWER(U."firstName") like '%${term}%' or LOWER(U."lastName") like '%${term}%')${dateString}`;
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
      console.log('Error in remote method trade.searchByUser ', error);
      return callback(internalError(error));
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
