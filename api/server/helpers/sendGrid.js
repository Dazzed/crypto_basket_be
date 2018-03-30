'use strict';
const ejs = require('ejs');
const fs = require('fs');
const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
const sendgrid = require('sendgrid').mail;

const config = require('./config');
const APPLICATION_TEMPLATE_PATH = `${__dirname}/../../template/application/`;

const fromEmail = new sendgrid.Email('info@melotic.com');

function sendMail(mail) {
  // if (process.env.ENVIRONMENT_TYPE === 'development') {
  //   return true;
  // }

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request, (error, response) => {
    if (error) {
      console.log('SENDGRID ERROR', error.response.body);
    }
  });
}

module.exports = {
  postSignupEmail(user, token) {
    const templateString = fs.readFileSync(__dirname + '/../../template/verify.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Welcome to Melotic!';
    const content = new sendgrid.Content(
      'text/html', template({
        user,
        domain: `${config[process.env.NODE_ENV]}/verify_email_temp?token=${token}`
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  },
  resetPasswordEmail(user, accessToken) {
    const templateString = fs.readFileSync(__dirname + '/../../template/reset.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Reset Melotic password';
    const content = new sendgrid.Content(
      'text/html', template({
        user,
        domain: `${config[process.env.NODE_ENV]}/reset_password?access_token=${accessToken}`
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  },
  postNotifyChangePassword(user) {
    const templateString = fs.readFileSync(__dirname + '/../../template/post_change_password_notification.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Your password has been changed';
    const content = new sendgrid.Content(
      'text/html', template({
        user
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  },
  forgotUsername(user) {
    const templateString = fs.readFileSync(__dirname + '/../../template/forgot_username.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Your melotic account username';
    const content = new sendgrid.Content(
      'text/html', template({
        user
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  }
};
