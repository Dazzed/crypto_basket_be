const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const { forgotUsername } = require('../../../helpers/sendGrid');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'forgotUsername',
    accepts: [
      { arg: 'email', type: 'string', required: true, description: 'Pass the email to get the associated username' }
    ],
    description: 'Sends an email if an associated username is found otherwise throws an error',
    httpOptions: {
      errorStatus: 400,
      path: '/forgotUsername',
      status: 200,
      verb: 'post',
    }
  });

  user.beforeRemote('forgotUsername', async (context, _, next) => {
    try {
      const { email } = context.args;
      const targetUser = await user.findOne({ where: { email } });
      if (!targetUser) {
        return next(badRequest('Email not found in our records'));
      }
      context.args.request.targetUser = targetUser;
    } catch (error) {
      console.log('Error in user.beforeRemote forgotUsername', error);
      return next(internalError());
    }
  });

  user.forgotUsername = async (request, response, email) => {
    try {
      const { targetUser } = request;
      forgotUsername(targetUser);
      return response.status(200).send({
        message: 'Email sent successfully'
      });
    } catch (error) {
      console.log('Error in remote method user.forgotUsername ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
