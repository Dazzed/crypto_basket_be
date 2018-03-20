// const createRemoteMethod = require('../../../helpers/createRemoteMethod');
// const { badRequest, unauthorized, internalError } = require('../../../helpers/errorFormatter');

// module.exports = user => {
//   createRemoteMethod({
//     model: user,
//     name: 'createSuperAdmin',
//     accepts: [
//       { arg: 'id', type: 'number', required: true, description: 'userId' }
//     ],
//     description: 'Mark an organization/institution admin as deleted and alter his relationships with other models.',
//     httpOptions: {
//       errorStatus: 400,
//       path: '/:id/removeAdmin',
//       status: 200,
//       verb: 'delete',
//     }
//   });
// };
