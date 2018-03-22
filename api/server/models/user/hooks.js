const uuidv4 = require('uuid/v4');

const { validateEmail } = require('../../utils');
const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');
const {
  postSignupEmail
} = require('../../helpers/sendGrid');

module.exports = function (user) {
  user.beforeRemote('login', async (context, _, next) => {
    try {
      const { email, password } = context.args.credentials;
      if (!email) {
        return next(badRequest('Missing email'));
      }
      const isEmail = validateEmail(email);
      if (!isEmail) {
        context.args.credentials = {
          username: email,
          password
        };
      }
    } catch (error) {
      console.log('Error in user.beforeRemote login', error);
      return next(internalError());
    }
  });

  user.afterRemote('create', async (context, userInstance, next) => {
    try {
      // 1. Send confirmation
      const verificationToken = uuidv4();
      await userInstance.updateAttribute('verificationToken', verificationToken);
      postSignupEmail(userInstance, verificationToken);

      const {options} = context.args;
      if (options.accessToken) {
        // 2. Check If admin creation requested
        if (userInstance.isCreatingAdmin) {
          const isSuperAdmin = await user.isSuperAdmin(
            options.accessToken.userId
          );
          if (isSuperAdmin) {
            await userInstance.promoteAdmin();
          }
        }
        // 3. Check If super admin creation requested
      }
    } catch (error) {
      console.log('Error in user.afterRemote create', error);
      return next(internalError());
    }
  });
};
