const uuidv4 = require('uuid/v4');

const {
  validateEmail,
  validateUsername,
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

const UNPERMITTED_PARAMS = [
  'isDeleted',
  'emailVerified',
  'verificationToken',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'twoFactorSecret',
  'twoFactorToken'
];

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
          username: email.toLowerCase(),
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
   * 2. validate password if not creating admin
   * 3. validate TFA OTP if a super admin is creating admin and assign random username and password
   * 4. validate username if not creating admin
   * 5. If not creatingAdmin and no username or password is present, Throw a badRequest
   * 6. Transform username to lowerCase
   */
  user.beforeRemote('create', async (context, _, next) => {
    try {
      const { email, password: thizPassword, username } = context.args.data;
      const isEmailValid = validateEmail(email);
      const validPassword = validatePassword(thizPassword);
      const { isCreatingAdmin } = context.args.data;
      if (!isEmailValid) {
        // 1
        return next(badRequest('Invalid Email'));
      } else if (validPassword.error && !isCreatingAdmin) {
        // 2
        return next(badRequest(validPassword.message));
      } else if (isCreatingAdmin) {
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
        context.args.data.username = `__random__${uuidv4()}`;
        context.args.data.password = uuidv4();
      }
      if (!isCreatingAdmin) {
        // 4
        const validUsername = validateUsername(username);
        if (!validUsername) {
          return next(badRequest('Invalid username. username must only contain numbers and alphabets'));
        }
      }
      // 5
      if (!context.args.data.username || !context.args.data.password) {
        return next(badRequest('Username or password is missing'));
      }
      // 6
      context.args.data.username = context.args.data.username.toLowerCase();
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
      await userInstance.updateAttributes({
        verificationToken,
        twoFactorToken: uuidv4()
      });

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

  /* before findById
   * 1. As a user I can view the total overall value of all the assets in my asset portfolio (BTC, USD, ETH)
  */
  user.afterRemote('findById', async (context, thizUser, next) => {
    try {
      const { filter } = context.args;
      if (filter && thizUser) {
        // 1
        const { custom_include } = filter;
        if (custom_include) {
          if (!Array.isArray(custom_include)) {
            return next(badRequest('custom_include must be an Array'));
          }
          if (custom_include.includes('populateAssetValue')) {
            await thizUser.populateAssetValue();
          }
        }
      }
    } catch (error) {
      console.log('Error in user.afterRemote findById', error);
      return next(internalError());
    }
  });

  /* before patchAttributes
   * 1. Do not allow to patch UNPERMITTED_PARAMS
   * 2. community_member / normal user cannot update his verificationStatus
   * 3. Keep track of old email if it's changed
   * 4. If patching two factor loginEnabled or twoFactorWithdrawalEnabled, validate the otp
   */
  user.beforeRemote('prototype.patchAttributes', async (context, _, next) => {
    try {
      // 1
      for (const updateKey in context.args.data) {
        if (UNPERMITTED_PARAMS.includes(updateKey)) {
          return next(badRequest(`${updateKey} cannot be patched`));
        }
      }

      // 2
      const { authorizedRoles, accessToken: thizAccessToken } = context.args.options;
      const verificationStatusPresent = 'verificationStatus' in context.args.data;
      if (verificationStatusPresent) {
        if (authorizedRoles.$owner && await context.instance.isNonPriviledgedUser()) {
          return next(unauthorized('verificationStatus cannot be changed by you'));
        }
      }

      // 3
      if (context.args.data.email) {
        context.options.oldEmail = context.instance.email;
      }

      // 4
      if ('twoFactorLoginEnabled' in context.args.data || 'twoFactorWithdrawalEnabled' in context.args.data) {
        const { otp } = context.args.data;
        if (otp) {
          const currentUser = await context.args.options.accessToken.user.get();
          const isOtpValid = isValidTFAOtp(otp, currentUser.twoFactorSecret);
          if (!isOtpValid) {
            return next(badRequest('Invalid OTP'));
          }
        } else {
          return next(badRequest('otp is needed when patching twoFactorLoginEnabled or twoFactorWithdrawalEnabled'));
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
   * 3. Clear twoFactorSecret if the user has disabled TFA for both login and withdrawal
   */
  user.afterRemote('prototype.patchAttributes', async (context, userInstance, next) => {
    try {
      const attributesToUpdate = {};

      // 1
      if (context.args.data.email) {
        const verificationToken = uuidv4();
        attributesToUpdate.verificationToken = verificationToken;
        attributesToUpdate.emailVerified = false;

        postSignupEmail(userInstance, verificationToken);
        notifyChangeEmail(userInstance, context.options.oldEmail);
      }

      // 2
      if (context.args.data.verificationStatus) {
        notifyVerificationStatusChange(userInstance);
      }

      // 3
      if (!userInstance.twoFactorLoginEnabled && !userInstance.twoFactorWithdrawalEnabled) {
        if (userInstance.twoFactorSecret) {
          attributesToUpdate.twoFactorSecret = null;
        }
      }

      if (Object.keys(attributesToUpdate).length) {
        await userInstance.updateAttributes(attributesToUpdate);
      }
    } catch (error) {
      console.log('Error in user.beforeRemote patchAttributes', error);
      return next(internalError());
    }
  });
};
