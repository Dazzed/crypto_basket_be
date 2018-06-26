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
      const matches = () => new Promise((resolve, reject) => {
        const sql = `\
select U.email, T.*, T.createdat as "createdAt", T.confirmedtime as "confirmedTime", \
T.userid as "userId", T.txtype as "txType" \
from public.user U right join public.transfer T on U.id=T.userid \
where T.txtype='${filter.where.txType || 'deposit'}' and \
(LOWER(U.email) like '%${term}%' or LOWER(U."firstName") like '%${term}%' \
or LOWER(U."lastName") like '%${term}%') order by T.id limit 10 offset ${filter.offset || 0};`;
        ds.connector.query(sql, function (err, data) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });

      const countResult = () => new Promise((resolve, reject) => {
        const sql = `\
select count(*) from public.user U right join public.transfer T on U.id=T.userid where T.txtype='${filter.where.txType || 'deposit'}' and (LOWER(U.email) like '%${term}%' or LOWER(U."firstName") like '%${term}%' or LOWER(U."lastName") like '%${term}%')`;
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
