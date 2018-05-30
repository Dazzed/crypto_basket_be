const multiparty = require('multiparty');

module.exports = function getFileFromRequest(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      if (!files) {
        return reject(false);
      }
      const file = files['file'][0]; // get the file from the returned files object
      if (!file) Promise.reject('File was not found in form data.');
      else resolve(file);
    });
  });
};
