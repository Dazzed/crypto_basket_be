const speakeasy = require('speakeasy');

const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'verifyTwoFactor',
    accepts: [
      { arg: 'otp', type: 'number', required: true }
    ],
    description: 'verify Two factor authentication for an user',
    httpOptions: {
      errorStatus: 400,
      path: '/verifyTwoFactor',
      status: 200,
      verb: 'post',
    }
  });

  user.beforeRemote('verifyTwoFactor', async (context, _, next) => {
    try {
      const currentUser = await user.findById(context.args.request.accessToken.userId);
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      if (!currentTemporarySecret && !currentUser.twoFactorSecret) {
        return next(badRequest('You have not opted for Two Factor authentication'));
      }
      if (currentTemporarySecret) {
        context.args.request.currentTemporarySecret = currentTemporarySecret;
      }
      context.args.request.currentUser = currentUser;
    } catch (error) {
      console.log('Error in user.beforeRemote verifyTwoFactor', error);
      return next(internalError());
    }
  });

  user.verifyTwoFactor = async (request, response, otp) => {
    try {
      const { currentUser, currentTemporarySecret = {} } = request;
      const verified = speakeasy.totp.verify({
        secret: currentTemporarySecret.secret || currentUser.twoFactorSecret,
        encoding: 'base32',
        token: otp
      });
      if (!verified) {
        return response.status(400).send({message: 'Invalid OTP'});
      }
      if (currentTemporarySecret.secret) {
        currentUser.twoFactorSecret = currentTemporarySecret.secret;
        await currentUser.save();
        await currentTemporarySecret.destroy();
      }
      return response.status(200).send({message: 'success'});
    } catch (error) {
      console.log('Error in remote method user.verifyTwoFactor ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
