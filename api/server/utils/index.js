/* eslint-disable quotes */
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');

module.exports = {
  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },
  validateUsername(username) {
    const re = /^[a-zA-Z0-9]+$/;
    return re.test(username);
  },
  validatePassword(password) {
    const strongPassword = new RegExp('^(?=.*[0-9])^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$%\^&\*])(?=.{8,})');
    const eightLettersLength = new RegExp('^(?=.{8,})');
    const oneLowerCase = new RegExp('^(?=.*[a-z])');
    const oneUpperCase = new RegExp('^(?=.*[A-Z])');
    const oneSymbol = new RegExp('^(?=.*[!@#\$%\^&\*])');
    const oneNumber = new RegExp('[0-9]', 'g');

    if (strongPassword.test(password)) {
      return { error: false };
    } else if (!eightLettersLength.test(password)) {
      return { error: true, message: 'Password must be atleast 8 characters in length' };
    } else if (!oneLowerCase.test(password)) {
      return { error: true, message: 'Your password must include at least one lower case letter' };
    } else if (!oneUpperCase.test(password)) {
      return { error: true, message: 'Your password must include at least one upper case letter' };
    } else if (!oneSymbol.test(password)) {
      return { error: true, message: 'Your password must include at least one symbol (!@#$%^&*)' };
    } else if (!oneNumber.test(password)) {
      return { error: true, message: 'Your password must include at least one numeric value' };
    }
    return { error: false };
  },
  generateQrCode(secret) {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
        if (err) return reject(err);
        return resolve(data_url);
      });
    });
  },
  sortArrayByParam(targetArray, param) {
    return targetArray.sort((obj1, obj2) => {
      if (obj1[param].toLowerCase() > obj2[param].toLowerCase()) {
        return 1;
      }
      return -1;
    });
  },
  isValidTFAOtp(otp, secret) {
    if (!otp || !secret) {
      return false;
    }
    const valid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: otp
    });
    if (!valid) {
      return false;
    }
    return true;
  }
};
