const uuidv4 = require('uuid/v4');

const { validateEmail, validatePassword } = require('../../utils');
const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');
const {
  postSignupEmail,
  postNotifyChangePassword
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

  /* before create
   * 1. validate email
   * 2. validate password
   */
  user.beforeRemote('create', async (context, _, next) => {
    try {
      const { email, password: thizPassword } = context.args.data;
      const isEmailValid = validateEmail(email);
      const validPassword = validatePassword(thizPassword);
      if (!isEmailValid) {
        return next(badRequest('Invalid Email'));
      } else if (validPassword.error) {
        return next(badRequest(validPassword.message));
      }
    } catch (error) {
      console.log('Error in user.beforeRemote create', error);
      return next(internalError());
    }
  });

  user.afterRemote('create', async (context, userInstance, next) => {
    try {
      // 1. Send confirmation
      const verificationToken = uuidv4();
      await userInstance.updateAttribute('verificationToken', verificationToken);
      postSignupEmail(userInstance, verificationToken);

      const { options } = context.args;
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

  user.afterRemote('login', async (context, tokenInstance, next) => {
    try {
      const thizUser = await user.findById(tokenInstance.userId, {
        include: { roleMapping: 'role' }
      });
      context.result = {
        ...context.result.toJSON(),
        user: thizUser.toJSON()
      };
    } catch (error) {
      console.log('Error in user.afterRemote login', error);
      return next(internalError());
    }
  });

  user.afterRemote('logout', async (context, _, next) => {
    context.result = {};
  });

  user.afterRemote('changePassword', async (context, _, next) => {
    context.result = {};
    const targetUser = await user.findById(context.args.id);
    postNotifyChangePassword(targetUser);
  });

  /* before resetPassword
   * 1. if username is passed, Then validate it and add the email property in the options.
   */
  user.beforeRemote('resetPassword', async (context, _, next) => {
    try {
      // 1
      const { username, email } = context.args.options;
      if (username && !email) {
        const thizUser = await user.findOne({ where: { username } });
        if (thizUser) {
          context.args.options.email = thizUser.email;
        } else {
          return next(badRequest('Invalid username'));
        }
      }
    } catch (error) {
      console.log('Error in user.beforeRemote resetPassword', error);
      return next(internalError());
    }
  });

  user.afterRemote('resetPassword', async (context, _, next) => {
    context.result = {};
  });

  user.afterRemote('setPassword', async (context, _, next) => {
    await context.args.options.accessToken.destroy();
    context.result = {};
  });

  /* before find
   * 1. custom_include ['only_community'] ~> Finds only normal users/community members
   */
  user.beforeRemote('find', async (context, _, next) => {
    try {
      const { custom_include = [] } = context.args.filter || {};
      // 1
      if (custom_include.includes('only_community')) {
        const { roleMapping } = user.app.models;
        const privledgedIds = await roleMapping.find({ fields: 'principalId' })
          .map(({ principalId }) => principalId);
        context.args.filter.where = {
          ...context.args.filter.where,
          id: {
            nin: privledgedIds
          }
        };
      }
    } catch (error) {
      console.log('Error in user.beforeRemote find', error);
      return next(internalError());
    }
  });

  /* before patchAttributes
   * 1. Do not allow to patch isDeleted or deletedAt
   * 2. Do not allow to patch emailVerified
   * 3. community_member / normal user cannot update his verificationStatus
   */
  user.beforeRemote('prototype.patchAttributes', async (context, _, next) => {
    try {
      // 1
      if (context.args.options.isDeleted || context.args.options.deletedAt) {
        return next(badRequest('isDeletedAt or deletedAt cannot be patched'));
      }

      // 2
      if (context.args.options.emailVerified) {
        return next(badRequest('emailVerified cannot be patched'));
      }

      // 3
      const { authorizedRoles, accessToken: thizAccessToken } = context.args.options;
      const verificationStatusPresent = 'verificationStatus' in context.args.data;
      if (verificationStatusPresent) {
        if (authorizedRoles.$owner && await context.instance.isNonPriviledgedUser()) {
          return next(unauthorized('verificationStatus cannot be changed by you'));
        }
      }
    } catch (error) {
      console.log('Error in user.beforeRemote patchAttributes', error);
      return next(internalError());
    }
  });

  /* before patchAttributes
   * 1. If updating email, set emailVerified to false and generate verfication token to send a new email.
   */
  user.afterRemote('prototype.patchAttributes', async (context, userInstance, next) => {
    try {
      // 1
      const verificationToken = uuidv4();
      await userInstance.updateAttributes({
        verificationToken,
        emailVerified: false
      });
      postSignupEmail(userInstance, verificationToken);
    } catch (error) {
      console.log('Error in user.beforeRemote patchAttributes', error);
      return next(internalError());
    }
  });
};
