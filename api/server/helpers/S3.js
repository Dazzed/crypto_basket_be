const AWS = require('aws-sdk');
const { readFileSync } = require('fs');
const { extname } = require('path');

const S3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
});

const uploadFileToS3 = (file, options = {}, BUCKET) => {
  // turn the file into a buffer for uploading
  const buffer = readFileSync(file.path);

  // generate a new random file name
  const fileName = options.name || String(Date.now());

  // the extension of your file
  const extension = extname(file.path);

  // return a promise
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: BUCKET,
      ACL: 'public-read',
      Key: `${fileName}${extension}`,
      Body: buffer,
    };
    return S3.upload(params, (err, result) => {
      if (err) reject(err);
      else resolve(result); // return the values of the successful AWS S3 request
    });
  });
};

const deleteObjectInS3 = (Key, BUCKET) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: BUCKET,
      Key
    };
    S3.deleteObject(params, function(err, data) {
      if (err) return reject(err);
      else return resolve(true);
    });
  });
};

module.exports = {
  S3,
  uploadFileToS3,
  deleteObjectInS3
};
