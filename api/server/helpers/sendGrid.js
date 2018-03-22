'use strict';
const ejs = require('ejs');
const fs = require('fs');
const sg = require('sendgrid')(process.env.SENDGRID_API_KEY);
const sendgrid = require('sendgrid').mail;

const config = require('./config');
const APPLICATION_TEMPLATE_PATH = `${__dirname}/../../template/application/`;

const fromEmail = new sendgrid.Email('info@melotic.com');

function sendMail(mail) {
  if (process.env.ENVIRONMENT_TYPE === 'development') {
    return true;
  }

  const request = sg.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: mail.toJSON(),
  });

  sg.API(request, (error, response) => {
    if (error) {
      console.log(error.response.body);
    }
  });
}

function postSignupEmail(user, token) {
  const templateString = fs.readFileSync(__dirname + '/../../template/verify.ejs', 'utf-8');
  const template = ejs.compile(templateString);
  const toEmail = new sendgrid.Email(user.email);
  const subject = 'Welcome to Melotic!';
  const content = new sendgrid.Content(
    'text/html', template({
      user,
      domain: `${config[process.env.NODE_ENV]}/verify?token=${token}`
    })
  );
  const mail = new sendgrid.Mail(fromEmail, subject, toEmail, content);
  sendMail(mail);
}

module.exports = {
  postSignupEmail
};
