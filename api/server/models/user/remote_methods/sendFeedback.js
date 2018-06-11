const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const {
  feedbackEmail
} = require('../../../helpers/sendGrid');

module.exports = user => {
  createRemoteMethod({
    model: user,
    name: 'sendFeedback',
    accepts: [
      { arg: 'feedback', type: 'string', required: true, description: 'The feedback text to email admin' }
    ],
    description: 'Leave a feedback that will be emailed to admin',
    httpOptions: {
      errorStatus: 400,
      path: '/submit_feedback',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  user.sendFeedback = async function (request, response, feedback, cb) {
    try {
      const currentUser = await user.findById(request.accessToken.userId);
      feedbackEmail(currentUser, feedback, process.env.ADMIN_EMAIL || 'sean.fahey@gigsternetwork.com ');
      return { message: 'ok' };
    } catch (error) {
      console.log('Error in user.sendFeedback', error);
      cb(internalError());
    }
  };
};
