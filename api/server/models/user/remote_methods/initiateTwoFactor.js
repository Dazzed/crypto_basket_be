const speakeasy = require('speakeasy');

const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { generateQrCode } = require('../../../utils');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'initiateTwoFactor',
    accepts: [
      { arg: 'twoFactorToken', type: 'string', required: true, description: 'temporary twoFactortoken received at login' }
    ],
    description: 'Initiate Two factor authentication for an user',
    httpOptions: {
      errorStatus: 400,
      path: '/initiateTwoFactor/:twoFactorToken',
      status: 200,
      verb: 'get',
    }
  });

  user.beforeRemote('initiateTwoFactor', async (context, _, next) => {
    try {
      const currentUser = await user.findOne({ where: { twoFactorToken: context.args.twoFactorToken } });
      if (!currentUser) {
        return next(badRequest('Invalid twoFactorToken'));
      }
      if (currentUser.twoFactorSecret) {
        return next(badRequest('You have already opted for Two Factor authentication'));
      }
      context.args.request.currentUser = currentUser;
    } catch (error) {
      console.log('Error in user.beforeRemote initiateTwoFactor', error);
      return next(internalError());
    }
  });

  user.initiateTwoFactor = async (request, response) => {
    try {
      const { currentUser } = request;
      const secret = speakeasy.generateSecret({ issuer: 'melotic', name: 'melotic', length: 64 });
      const qrCode = await generateQrCode(secret);
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      if (currentTemporarySecret) {
        currentTemporarySecret.secret = secret.base32;
        currentTemporarySecret.updatedAt = new Date();
        await currentTemporarySecret.save();
      } else {
        await currentUser.temporaryTwoFactorSecret.create({
          secret: secret.base32,
        });
      }
      return response.status(200).send({ qrCode, manual: secret.otpauth_url });
    } catch (error) {
      console.log('Error in remote method user.initiateTwoFactor ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
