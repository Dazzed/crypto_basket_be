const speakeasy = require('speakeasy');

const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'verifyTwoFactor',
    accepts: [
      { arg: 'otp', type: 'number', required: true },
      { arg: 'twoFactorToken', type: 'string', required: true, description: 'temporary twoFactortoken received at login' },
      { arg: 'type', type: 'string', required: false, description: '(login, withdrawal, creatingAdmin) Whether verifying OTP to enable TFA for login or withdrawal or creatingAdmin' }
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
      const currentUser = await user.findOne({
        where: {
          twoFactorToken: context.args.twoFactorToken
        },
        include: { roleMapping: 'role' }
      });
      if (!currentUser) {
        return next(badRequest('Invalid twoFactorToken'));
      }
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      if (!currentTemporarySecret && !currentUser.twoFactorSecret) {
        return next(badRequest('You have not opted for Two Factor authentication'));
      }
      if (context.args.type && !['login', 'withdrawal', 'creatingAdmin'].includes(context.args.type)) {
        return next(badRequest('type must be either login or withdrawal or creatingAdmin'));
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

  user.verifyTwoFactor = async (request, response, otp, twoFactorToken, type) => {
    try {
      const { currentUser, currentTemporarySecret = {} } = request;
      const verified = speakeasy.totp.verify({
        secret: currentTemporarySecret.secret || currentUser.twoFactorSecret,
        encoding: 'base32',
        token: otp
      });
      if (!verified) {
        return response.status(400).send({ message: 'Invalid OTP' });
      }
      if (currentTemporarySecret.secret) {
        currentUser.twoFactorSecret = currentTemporarySecret.secret;
        await currentUser.save();
        await currentTemporarySecret.destroy();
      }
      if (type) {
        if (type === 'login') {
          currentUser.twoFactorLoginEnabled = true;
        } else if (type === 'withdrawal') {
          currentUser.twoFactorWithdrawalEnabled = true;
        } else if (type === 'creatingAdmin') {
          currentUser.twoFactorCreateAdminEnabled = true;
        }
        await currentUser.save();
      }
      const thizToken = await currentUser.createAccessToken('1209600');
      return response.status(200).send({
        ...currentUser.toJSON(),
        accessToken: thizToken.toJSON()
      });
    } catch (error) {
      console.log('Error in remote method user.verifyTwoFactor ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
