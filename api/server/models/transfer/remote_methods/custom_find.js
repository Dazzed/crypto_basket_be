const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = transfer => {
  createRemoteMethod({
    model: transfer,
    name: 'custom_find',
    accepts: [
      { arg: 'filter', type: 'object', required: true, description: 'filter json. accepts: page, offset, where, custom_filter(start_range and end_range)' },
      { arg: 'pendingFirst', type: 'boolean', required: true, description: 'order the records by pending first value in state column' },
      { arg: 'inProgress', type: 'boolean', required: true, description: 'order the records by in progress first in state column' }
    ],
    description: 'Search for transfers of a user',
    httpOptions: {
      errorStatus: 400,
      path: '/custom_find',
      status: 200,
      verb: 'GET',
    },
    returns: { root: true, type: 'array' }
  });

  transfer.custom_find = async function (request, response, filter, pendingFirst, inProgress, callback) {
    try {
      const { user } = transfer.app.models;
      const currentUser = await user.findById(request.accessToken.userId);
      const isRegularUser = await currentUser.isNonPriviledgedUser();
      const ds = transfer.dataSource;
      filter.where = filter.where || {};
      let dateString = '';
      let userFilterWhere = '';
      if (filter.custom_filter) {
        const { custom_filter: { start_range, end_range } } = filter;
        dateString = ` and (T.createdat between '${start_range} 00:00:00' and '${end_range} 23:59:59')`;
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
select U.email, T.*, T.createdat as "createdAt", T.confirmedtime as "confirmedTime", T.usdvalue as "usdValue", T."ethvalue" as "ethValue", T."btcvalue" as "btcValue",\
T.userid as "userId", T.txtype as "txType" \
from public.transfer T left join public.user U on U.id=T.userid \
where T.txtype='${filter.where.txType || 'deposit'}' \
${dateString}${userFilterWhere} ${orderByClause}, T.createdat DESC limit ${filter.limit || 10} offset ${filter.offset || 0};`;
        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });

      const countResult = () => new Promise((resolve, reject) => {
        const sql = `\
select count(*) from public.user U right join public.transfer T on U.id=T.userid where T.txtype='${filter.where.txType || 'deposit'}'${dateString}${userFilterWhere}`;
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
      console.log('Error in transfer.custom_find', error);
      return callback(internalError());
    }
  };
};
