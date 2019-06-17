const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const _ = require('lodash');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'search',
    accepts: [
      { arg: 'query', type: 'string', required: true, description: 'search query' },
      { arg: 'filter', type: 'object', required: false, description: 'search filter' }
    ],
    description: 'search for community members',
    httpOptions: {
      errorStatus: 400,
      path: '/search/:query',
      status: 200,
      verb: 'get',
    },
    returns: { root: true, type: 'array' }
  });

  user.search = async (request, response, query, filter, callback) => {
    try {
      const fields = ['firstName', 'lastName', 'email', 'username'];
      // ignore privledged users in search
      // const privledgedIds = await roleMapping.find({ fields: 'principalId' })
      //   .map(({ principalId }) => principalId);
      // const filterBase = {
      //   where: {
      //     and: [
      //       {
      //         id: {
      //           nin: privledgedIds
      //         },
      //       },
      //       {
      //         or: fields.map(field => ({
      //           [field]: {
      //             ilike: `%${query}%`
      //           }
      //         }))
      //       }
      //     ],
      //   }
      // };
      const filterBase = {
        where: {
          and: [
            {
              or: fields.map(field => ({
                [field]: {
                  ilike: `%${query}%`
                }
              }))
            }
          ]
        }
      };
      const filterQuery = _.assign({}, filter, filterBase);
      if (filter && filter.where) {
        filterQuery.where.and.push(filter.where);
      }

      return await user.find(filterQuery);
    } catch (error) {
      console.log('Error in remote method user.search ', error);
      return callback(internalError());
    }
  };
};
