const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = transfer => {
  createRemoteMethod({
    model: transfer,
    name: 'searchByUser',
    accepts: [
      { arg: 'term', type: 'string', required: true, description: 'search term (only email, firstName, lastName)' },
      { arg: 'filter', type: 'object', required: false, description: 'filter' },
    ],
    description: 'Search for transfers of a user',
    httpOptions: {
      errorStatus: 400,
      path: '/searchByUser/:term',
      status: 200,
      verb: 'GET',
    },
    returns: { root: true, type: 'array' }
  });

  transfer.searchByUser = async function (request, response, originalTerm, filter = {}, cb) {
    try {
      const ds = transfer.dataSource;
      filter.where = filter.where || {};
      const term = originalTerm.toLowerCase();
      let dateString = '';
      if (filter.custom_filter) {
        const { custom_filter: { start_range, end_range } } = filter;
        dateString = ` and (T.createdat between '${start_range} 00:00:00' and '${end_range} 23:59:59')`;
      }
      const matches = () => new Promise((resolve, reject) => {
        const orderByClause = (() => {
          return `\
            ORDER BY \
              CASE T.state \
                WHEN 'pending' then 1 \
                WHEN 'initiated' then 2 \
              END\
            `;
        })();
        const sql = `\
select U.email, T.*, T.createdat as "createdAt", T.confirmedtime as "confirmedTime", T.usdvalue as "usdValue", \
T.userid as "userId", T.txtype as "txType" \
from public.user U right join public.transfer T on U.id=T.userid \
where T.txtype='${filter.where.txType || 'deposit'}' and \
${filter.where.state ? `T.state='${filter.where.state}' and` : ''} \
(LOWER(U.email) like '%${term}%' or LOWER(U."firstName") like '%${term}%' \
or LOWER(U."lastName") like '%${term}%')${dateString} ${orderByClause}, T.createdat DESC limit ${filter.limit || 10} offset ${filter.offset || 0};`;
        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });

      const countResult = () => new Promise((resolve, reject) => {
        const sql = `\
select count(*) from public.user U right join public.transfer T on U.id=T.userid where T.txtype='${filter.where.txType || 'deposit'}' and (LOWER(U.email) like '%${term}%' or LOWER(U."firstName") like '%${term}%' or LOWER(U."lastName") like '%${term}%')${dateString}`;
        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data[0].count);
        });
      });
      // return results;
      const [results, count] = await Promise.all([matches(), countResult()]);
      response.set('X-Total-Count', count);
      return results;
    } catch (error) {
      console.log('Error in transfer.searchByUser', error);
      cb(internalError());
    }
  };
};
