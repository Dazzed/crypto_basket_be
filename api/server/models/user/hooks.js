const uuidv4 = require('uuid/v4');

const {
  validateEmail,
  validatePassword,
  sortArrayByParam,
  isValidTFAOtp
} = require('../../utils');

const {
  badRequest,
  unauthorized,
  internalError
} = require('../../helpers/errorFormatter');

const {
  postSignupEmail,
  postNotifyChangePassword,
  notifyChangeEmail,
  notifyVerificationStatusChange,
  adminWelcomeEmail
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
   * 3. validate TFA OTP if a super admin is creating admin
   */
  user.beforeRemote('create', async (context, _, next) => {
    try {
      const { email, password: thizPassword } = context.args.data;
      const isEmailValid = validateEmail(email);
      const validPassword = validatePassword(thizPassword);
      if (!isEmailValid) {
        // 1
        return next(badRequest('Invalid Email'));
      } else if (validPassword.error) {
        // 2
        return next(badRequest(validPassword.message));
      } else if (context.args.data.isCreatingAdmin) {
        // 3
        if (!context.args.options.accessToken) {
          return next(unauthorized());
        }
        const { otp } = context.args.data;
        const currentUser = await context.args.options.accessToken.user.get();
        const isSuperAdmin = await user.isSuperAdmin(
          currentUser.id
        );
        if (!isSuperAdmin) {
          return next(unauthorized());
        }
        const isOtpValid = isValidTFAOtp(otp, currentUser.twoFactorSecret);
        if (!isOtpValid) {
          return next(badRequest('Invalid OTP'));
        }
      }
    } catch (error) {
      console.log('Error in user.beforeRemote create', error);
      return next(internalError());
    }
  });

  /* after create
   * 1. set the verificationToken for email
   * 2. If a super admin is creating admin force TFA and send admin welcome email
   */
  user.afterRemote('create', async (context, userInstance, next) => {
    try {
      // 1
      const verificationToken = uuidv4();
      await userInstance.updateAttribute('verificationToken', verificationToken);

      const { options } = context.args;
      // 2
      if (userInstance.isCreatingAdmin) {
        userInstance.twoFactorLoginEnabled = true;
        userInstance.twoFactorWithdrawalEnabled = true;
        await userInstance.save();
        await userInstance.promoteAdmin();
        adminWelcomeEmail(userInstance, verificationToken);
      } else {
        postSignupEmail(userInstance, verificationToken);
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
      if (thizUser.twoFactorLoginEnabled) {
        await thizUser.updateAttribute('twoFactorToken', uuidv4());
        context.result = {
          user: thizUser.toJSON(),
          twoFactorRequired: true
        };
      } else {
        context.result = {
          ...context.result.toJSON(),
          user: thizUser.toJSON()
        };
      }
    } catch (error) {
      console.log('Error in user.afterRemote login', error);
      return next(internalError());
    }
  });

  user.beforeRemote('logout', async (context, _, next) => {
    const { accessToken } = user.app.models;
    const thizToken = await accessToken.findById(context.args.access_token);
    context.options.thizToken = thizToken;
  });

  user.afterRemote('logout', async (context, _, next) => {
    context.result = {};
    const { accessToken } = user.app.models;
    const { thizToken } = context.options;
    await accessToken.destroyAll({ userId: thizToken.userId });
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

  /* after find
   * 1. If ordering by email, firstName, lastName sort it in case insensitive manner and present to FE
   */
  user.afterRemote('find', async (context, foundUsers, next) => {
    try {
      const { filter } = context.args;
      if (filter) {
        switch (filter.order) {
          case 'firstName ASC':
            context.result = sortArrayByParam(context.result, 'firstName');
            break;
          case 'lastName ASC':
            context.result = sortArrayByParam(context.result, 'lastName');
            break;
          case 'email ASC':
            context.result = sortArrayByParam(context.result, 'email');
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.log('Error in user.afterRemote find', error);
      return next(internalError());
    }
  });

  /* before patchAttributes
   * 1. Do not allow to patch isDeleted or deletedAt or twoFactorSecret
   * 2. Do not allow to patch emailVerified
   * 3. community_member / normal user cannot update his verificationStatus
   * 4. Keep track of old email if it's changed
   * 5. If patching two factor loginEnabled or twoFactorWithdrawalEnabled, validate the otp
   */
  user.beforeRemote('prototype.patchAttributes', async (context, _, next) => {
    try {
      // 1
      if (context.args.data.isDeleted || context.args.data.deletedAt || context.args.data.twoFactorSecret) {
        return next(badRequest('isDeletedAt or deletedAt or twoFactorSecret cannot be patched'));
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

      // 4
      if (context.args.data.email) {
        context.options.oldEmail = context.instance.email;
      }

      // 5
      if (context.args.data.twoFactorLoginEnabled === false || context.args.data.twoFactorWithdrawalEnabled === false) {
        const { otp } = context.args.data;
        if (otp) {
          const currentUser = await context.args.options.accessToken.user.get();
          const isOtpValid = isValidTFAOtp(otp, currentUser.twoFactorSecret);
          if (!isOtpValid) {
            return next(badRequest('Invalid otp'));
          }
        } else {
          return next(badRequest('otp is needed when updating twoFactorLoginEnabled or twoFactorWithdrawalEnabled'))
        }
      }
    } catch (error) {
      console.log('Error in user.beforeRemote patchAttributes', error);
      return next(internalError());
    }
  });

  /* before patchAttributes
   * 1. If updating email, set emailVerified to false and generate verfication token to send a new email.
   * 2. If updating verificationStatus, notify the target user about the update
   */
  user.afterRemote('prototype.patchAttributes', async (context, userInstance, next) => {
    try {
      // 1
      if (context.args.data.email) {
        const verificationToken = uuidv4();
        await userInstance.updateAttributes({
          verificationToken,
          emailVerified: false
        });
        postSignupEmail(userInstance, verificationToken);
        notifyChangeEmail(userInstance, context.options.oldEmail);
      }

      // 2
      if (context.args.data.verificationStatus) {
        notifyVerificationStatusChange(userInstance);
      }
    } catch (error) {
      console.log('Error in user.beforeRemote patchAttributes', error);
      return next(internalError());
    }
  });
};
