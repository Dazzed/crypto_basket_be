const {resetPasswordEmail} = require('../../helpers/sendGrid');

module.exports = function(user) {
    // send password reset link when requested
  // User.on('resetPasswordRequest', function(info) {
  //   const templateFilePath = path.join(__dirname, '../../../template/reset.ejs');

  //   const templateString = fs.readFileSync(templateFilePath, 'utf8');
  //   const html = ejs.render(templateString, {
  //     host: config.host,
  //     port: config.port,
  //     accessToken: process.env.AUTH_RESET_REDIRECT_ID || info.accessToken.id,
  //   });

  //   User.app.models.Email.send({
  //     to: info.email,
  //     from: config.emailSender,
  //     subject: config.resetEmailSubject,
  //     html,
  //   }, function(err) {
  //     if (err) return debug('> error sending password reset email');
  //     debug('> sending password reset email to:', info.email);
  //   });
  // });

  user.on('resetPasswordRequest', info => {
    info.accessToken.user(function (err, user) {
      resetPasswordEmail(user, info.accessToken.id);
    });
  });
};
