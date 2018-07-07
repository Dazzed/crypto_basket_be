const createRemoteMethod = require('../../../helpers/createRemoteMethod');
const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');
const { uploadFileToS3, deleteObjectInS3 } = require('../../../helpers/S3');
const getFileFromRequest = require('../../../helpers/getFileFromRequest');
const {
  notifyVerificationPendingChange
} = require('../../../helpers/sendGrid');

module.exports = Document => {
  createRemoteMethod({
    model: Document,
    name: 'uploadProof',
    accepts: [],
    description: 'upload proof for an user',
    httpOptions: {
      errorStatus: 400,
      path: '/uploadProof',
      status: 200,
      verb: 'POST',
    },
    returns: { root: true, type: 'object' }
  });

  Document.uploadProof = async (request, response, callback) => {
    try {
      const { user } = Document.app.models;
      const currentUserId = request.accessToken.userId;
      const targetUser = await user.findById(currentUserId, { include: 'documents' });
      if (!targetUser) {
        return callback(badRequest('Invalid accessToken supplied'));
      } else if (targetUser.verificationStatus === 'fully_verified') {
        return callback(badRequest({
          message: 'You cannot upload documents when you are verified'
        }));
      }

      // extract the file from the request object
      const file = await getFileFromRequest(request);

      // delete previous attachment if exists
      const { documents } = targetUser.__data;
      const existingDocument = documents.find(d => d.type === 'proof');
      if (existingDocument) {
        const thizKey = existingDocument.url.split(`https://${process.env.AWS_S3_DOCUMENTS_BUCKET}.s3.amazonaws.com/`)[1];
        await deleteObjectInS3(thizKey, process.env.AWS_S3_DOCUMENTS_BUCKET);
        await existingDocument.destroy();
      }

      // upload the file
      const { Location, ETag, Bucket, Key } = await uploadFileToS3(file, {}, process.env.AWS_S3_DOCUMENTS_BUCKET);
      const thizDocument = await targetUser.documents.create({
        type: 'proof',
        url: Location,
        originalFilename: file.originalFilename
      });
      let shouldChangeVerificationStatusToPending = false;
      const existingIdentityDocument = await Document.findOne({
        where: {
          userId: targetUser.id,
          type: 'identity'
        }
      });
      if (existingIdentityDocument && targetUser.verificationStatus === 'unverified') {
        await targetUser.updateAttribute('verificationStatus', 'verification_pending');
        notifyVerificationPendingChange(targetUser);
        shouldChangeVerificationStatusToPending = true;
      }
      return {
        link: Location,
        fileName: file.originalFilename,
        data: thizDocument,
        shouldChangeVerificationStatusToPending,
        newVerificationStatus: shouldChangeVerificationStatusToPending ? 'verification_pending' : null
      };
    } catch (error) {
      console.log('Error in Document.uploadResume', error);
      callback(internalError());
    }
  };
};
