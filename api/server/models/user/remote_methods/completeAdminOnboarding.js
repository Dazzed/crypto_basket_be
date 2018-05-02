const createRemoteMethod = require('../../../helpers/createRemoteMethod');

const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const {
  isValidTFAOtp,
  validateUsername,
  validatePassword
} = require('../../../utils');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'completeAdminOnboarding',
    accepts: [
      { arg: 'verificationToken', type: 'string', required: true, description: 'verificationToken that is received via email to confirm an user\'s email' },
      { arg: 'username', type: 'string', required: true },
      { arg: 'password', type: 'string', required: true },
      { arg: 'otp', type: 'string', required: true }
    ],
    description: 'Complete admin onboarding process',
    httpOptions: {
      errorStatus: 400,
      path: '/completeAdminOnboarding',
      status: 200,
      verb: 'POST',
    }
  });

  // 1. Verify the token and currentuser
  // 2. Validate the otp
  // 3. Verify that the user is an admin
  // 4. Validate the username
  // 5. Validate the password
  // 6. update the username and password to respond back with access_token
  user.completeAdminOnboarding = async (request, response, verificationToken, username, password, otp) => {
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
      if (!await currentUser.isAdmin()) {
        return response.status(400).send({
          valid: false
        });
      }
      // 2
      const currentTemporarySecret = await currentUser.temporaryTwoFactorSecret.get();
      if (!currentTemporarySecret) {
        return response.status(400).send({
          valid: false
        });
      }
      const isValidOtp = isValidTFAOtp(otp, currentTemporarySecret.secret);
      if (!isValidOtp) {
        return response.status(400).send({
          validationError: true,
          field: 'otp',
          message: 'Invalid OTP'
        });
      }

      // 3
      if (!await currentUser.isAdmin()) {
        return response.status(400).send({
          valid: false
        });
      }

      // 4
      const isUsernameAlreadyPresent = await user.count({ username });
      if (isUsernameAlreadyPresent) {
        return response.status(400).send({
          validationError: true,
          field: 'username',
          message: 'That User Name is already in use'
        });
      } else if (!validateUsername(username)) {
        return response.status(400).send({
          validationError: true,
          field: 'username',
          message: 'Username must contain only numbers and alphabets'
        });
      }

      // 5
      const isValidPassword = validatePassword(password);
      if (isValidPassword.error) {
        return response.status(400).send({
          validationError: true,
          field: 'password',
          message: isValidPassword.message
        });
      }

      // 6
      await currentUser.updateAttributes({
        username,
        password,
        verificationToken: null,
        emailVerified: true
      });
      const thizToken = await currentUser.createAccessToken('1209600');
      return response.status(200).send({
        ...currentUser.toJSON(),
        accessToken: thizToken.toJSON()
      });
    } catch (error) {
      console.log('Error in remote method user.completeAdminOnboarding', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
