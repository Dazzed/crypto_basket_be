module.exports = {
  badRequest(message = 'Bad Request') {
    const error = new Error(message);
    error.statusCode = 400;
    error.name = 'Bad Request';
    delete error.stack;
    return error;
  },
  unauthorized(message = 'You are not authorized to perform this request') {
    const error = new Error(message);
    error.statusCode = 401;
    error.name = 'Unauthorized';
    delete error.stack;
    return error;
  },
  internalError() {
    const error = new Error('Internal Server Error');
    error.statusCode = 500;
    error.name = 'Internal Server Error';
    delete error.stack;
    return error;
  }
};
