const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'archive',
    accepts: [
      { arg: 'userId', type: 'number', required: true, description: 'userId to archive' }
    ],
    description: 'Archive an user',
    httpOptions: {
      errorStatus: 400,
      path: '/archive/:userId',
      status: 200,
      verb: 'delete',
    }
  });

  user.beforeRemote('archive', async (context, _, next) => {
    try {
      const targetUser = await user.findById(context.args.userId);
      const isSuperAdmin = await targetUser.isSuperAdmin();
      if (isSuperAdmin) {
        return next(unauthorized());
      }
      context.args.request.targetUser = targetUser;
    } catch (error) {
      console.log('Error in user.beforeRemote archive', error);
      return next(internalError());
    }
  });

  user.archive = async (request, response, userId) => {
    try {
      const { targetUser } = request;
      targetUser.isDeleted = true;
      targetUser.deletedAt = new Date();
      await targetUser.save();
      return response.status(200).send(targetUser);
    } catch (error) {
      console.log('Error in remote method user.archive', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
