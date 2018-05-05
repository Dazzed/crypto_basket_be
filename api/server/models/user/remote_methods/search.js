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
    }
  });

  user.search = async (request, response, query, filter) => {
    try {
      const { roleMapping } = user.app.models;
      // ignore privledged users in search
      const privledgedIds = await roleMapping.find({ fields: 'principalId' })
        .map(({ principalId }) => principalId);
      const fields = ['firstName', 'lastName', 'email', 'username'];
      const filterBase = {
        where: {
          and: [
            {
              id: {
                nin: privledgedIds
              },
            },
            {
              or: fields.map(field => ({
                [field]: {
                  ilike: `%${query}%`
                }
              }))
            }
          ],
        }
      };
      let filterQuery = _.assign({}, filter, filterBase);
      if(filter){
        filterQuery.where.and.push(filter.where);
      }
      const results = await user.find(filterQuery);
      return response.status(200).send(results);
    } catch (error) {
      console.log('Error in remote method user.search ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
