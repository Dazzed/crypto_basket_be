const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'verifyEmail',
    accepts: [
      { arg: 'verificationToken', type: 'string', required: true, description: 'verificationToken that is received via email to confirm an user\'s email' }
    ],
    description: 'Verify If the token received in the user\'s email is valid for confirmation',
    httpOptions: {
      errorStatus: 400,
      path: '/verifyEmail',
      status: 200,
      verb: 'POST',
    }
  });

  user.verifyEmail = async (request, response, verificationToken) => {
    try {
      const thizUser = await user.findOne({
        where: {
          verificationToken
        }
      });
      if (!thizUser) {
        return response.status(400).send({
          valid: false
        });
      }
      await thizUser.updateAttributes({
        emailVerified: true,
        verificationToken: null
      });
      return response.status(200).send({
        valid: true
      });
    } catch (error) {
      console.log('Error in remote method user.isValidEmailToken', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
