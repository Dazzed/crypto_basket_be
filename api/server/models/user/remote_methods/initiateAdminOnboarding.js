const speakeasy = require('speakeasy');

const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const { generateQrCode } = require('../../../utils');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'initiateAdminOnboarding',
    accepts: [
      { arg: 'verificationToken', type: 'string', required: true, description: 'verificationToken that is received via email to confirm an user\'s email' }
    ],
    description: 'Verify If the token received in the admin\'s email is valid for confirmation and respond back with data for onboarding',
    httpOptions: {
      errorStatus: 400,
      path: '/initiateAdminOnboarding',
      status: 200,
      verb: 'POST',
    }
  });

  // 1. Verify the token
  // 2. Verify that the user is an admin
  // 2. generate TFA qrCode and manualCode.
  user.initiateAdminOnboarding = async (request, response, verificationToken) => {
    try {
      // 1
      const currentUser = await user.findOne({
        where: {
          verificationToken
        }
      });
      if (!currentUser) {
        return response.status(400).send({
          valid: false
        });
      }

      // 2
      if (!await currentUser.isAdmin()) {
        return response.status(400).send({
          valid: false
        });
      }

      // 3
      const secret = speakeasy.generateSecret({ issuer: 'melotic', name: 'melotic', length: 16 });
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
      return response.status(200).send({
        currentUser,
        qrCode,
        manualCode: secret.base32
      });
    } catch (error) {
      console.log('Error in remote method user.initiateAdminOnboarding', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
