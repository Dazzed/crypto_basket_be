const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'filterByVerification',
    accepts: [
      { arg: 'verificationStatus', type: 'string', required: true, description: "['fully_verified', 'unverified', 'verification_pending']" }
    ],
    description: 'filter the community members list by: fully_verified, unverified, and verification_pending',
    httpOptions: {
      errorStatus: 400,
      path: '/filterByVerification/:verificationStatus',
      status: 200,
      verb: 'get',
    }
  });

  user.beforeRemote('filterByVerification', async (context, _, next) => {
    try {
      const VALID_VERIFICATION_STATUSES = ['fully_verified', 'unverified', 'verification_pending'];
      const { verificationStatus } = context.args;
      if (!VALID_VERIFICATION_STATUSES.includes(verificationStatus)) {
        return next(
          badRequest(`verificationStatus must be one of [${VALID_VERIFICATION_STATUSES.join(',')}]`)
        );
      }
    } catch (error) {
      console.log('Error in user.beforeRemote filterByVerification', error);
      return next(internalError());
    }
  });

  user.filterByVerification = async (request, response, verificationStatus) => {
    try {
      const { roleMapping } = user.app.models;
      // ignore privledged users in search
      const privledgedIds = await roleMapping.find({ fields: 'principalId' })
        .map(({ principalId }) => principalId);
      const results = await user.find({
        where: {
          and: [
            {
              id: {
                nin: privledgedIds
              },
            },
            {
              verificationStatus
            }
          ],
        }
      });
      return response.status(200).send(results);
    } catch (error) {
      console.log('Error in remote method user.filterByVerification ', error);
      return response.status(500).send('Internal Server error');
    }
  };
};
