/* eslint-disable quotes */
module.exports = {
  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  },
  validatePassword(password) {
    const strongPassword = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    const eightLettersLength = new RegExp("^(?=.{8,})");
    const oneLowerCase = new RegExp("^(?=.*[a-z])");
    const oneUpperCase = new RegExp("^(?=.*[A-Z])");
    const oneSymbol = new RegExp("^(?=.*[!@#\$%\^&\*])");

    if (strongPassword.test(password)) {
      return { error: false };
    } else if (!eightLettersLength.test(password)) {
      return { error: true, message: 'Password must be atleast 8 characters in length' };
    } else if (!oneLowerCase.test(password)) {
      return { error: true, message: 'Password must contain atleast one Lower case alphabet' };
    } else if (!oneUpperCase.test(password)) {
      return { error: true, message: 'Password must contain atleast one Upper case alphabet' };
    } else if (!oneSymbol.test(password)) {
      return { error: true, message: 'Password must contain atleast one Symbol character (!@#$%^&*)' };
    } else {
      throw 'Internal server error in password';
    }
  }
};
