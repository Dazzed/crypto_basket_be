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
        domain: `${config[process.env.NODE_ENV]}/user_register?confirm_token=${token}`
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
  },
  notifyChangeEmail(user, oldEmail) {
    const templateString = fs.readFileSync(__dirname + '/../../template/notify_change_email.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(oldEmail);
    const subject = 'Your Melotic email changed';
    const content = new sendgrid.Content(
      'text/html', template({
        user,
        oldEmail
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  },
  notifyVerificationStatusChange(user) {
    const templateString = fs.readFileSync(__dirname + '/../../template/notify_verification_status_change.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Your Melotic verification status updated';
    const content = new sendgrid.Content(
      'text/html', template({
        user
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  },
  adminWelcomeEmail(user, token) {
    const templateString = fs.readFileSync(__dirname + '/../../template/admin_welcome.ejs', 'utf-8');
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
  tradeEmail(user, trade, fromAsset, toAsset, fromWallet, toWallet){
    const templateString = fs.readFileSync(__dirname + '/../../template/trade_completed.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Trade Completed!';
    const content = new sendgrid.Content(
      'text/html', template({
        trade, fromAsset, toAsset, fromWallet, toWallet
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  },
  notifyDownTime(user) {
    const templateString = fs.readFileSync(__dirname + '/../../template/notify_downtime.ejs', 'utf-8');
    const template = ejs.compile(templateString);
    const toEmail = new sendgrid.Email(user.email);
    const subject = 'Melotic Downtime';
    const content = new sendgrid.Content(
      'text/html', template({
        user
      })
    );
    const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
    sendMail(mail);
  }
};
