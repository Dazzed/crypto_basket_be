const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'search',
    accepts: [
      { arg: 'query', type: 'string', required: true, description: 'search query' }
    ],
    description: 'search for community members',
    httpOptions: {
      errorStatus: 400,
      path: '/search/:query',
      status: 200,
      verb: 'get',
    }
  });

  user.search = async (request, response, query) => {
    try {
      const { roleMapping } = user.app.models;
      // ignore privledged users in search
      const privledgedIds = await roleMapping.find({ fields: 'principalId' })
        .map(({ principalId }) => principalId);
      const fields = ['firstName', 'lastName', 'email', 'username'];
      const results = await user.find({
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
      });
      return response.status(200).send(results);
    } catch (error) {
      console.log('Error in remote method user.search ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
