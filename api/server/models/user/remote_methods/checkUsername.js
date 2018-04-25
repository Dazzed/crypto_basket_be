const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'checkUsername',
    accepts: [
      { arg: 'username', type: 'string', required: true, description: 'username to check if exists' }
    ],
    description: 'search whetherusername is already in use.',
    httpOptions: {
      errorStatus: 400,
      path: '/checkUsername',
      status: 200,
      verb: 'get',
    }
  });

  user.checkUsername = async (request, response, username) => {
    try {
      const isAlreadyPresent = await user.count({ username });
      if (isAlreadyPresent) {
        return response.status(200).send({ inUse: true });
      }
      return response.status(200).send({ inUse: false });
    } catch (error) {
      console.log('Error in remote method user.checkUsernameEmail ', error);
      return response.status(500).send({ message: 'Internal Server error' });
    }
  };
};
