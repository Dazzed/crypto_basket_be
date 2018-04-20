const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const _ = require('lodash');

module.exports = Trade => {
  createRemoteMethod({
    model: Trade,
    name: 'search',
    accepts: [
      { arg: 'query', type: 'string', required: true, description: 'search query' }
    ],
    description: 'search for trades by users',
    httpOptions: {
      errorStatus: 400,
      path: '/search/:query',
      status: 200,
      verb: 'get',
    }
  });

  Trade.search = async (request, response, query) => {
    try {
      const { roleMapping, user } = Trade.app.models;
      // ignore privledged users in search
      const privledgedIds = await roleMapping.find({ fields: 'principalId' })
        .map(({ principalId }) => principalId);
      const fields = ['firstName', 'lastName', 'email', 'username'];
      const users = await user.find({
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
        },
        include: 'trades'
      });
      const trades = _.flatten(_.map(users, (u) => {
        return u.trades();
      }));
      return response.status(200).send(trades);
    } catch (error) {
      console.log('Error in remote method trade.search ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
