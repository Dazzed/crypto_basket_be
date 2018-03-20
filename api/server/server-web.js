'use strict';

const debug = require('debug')('gdt:loopback:authentication');

module.exports = function(app) {
  var cookieParser = require('cookie-parser');
  var session = require('express-session');

  debug('Enabling Web interface');

  /*
  * body-parser is a piece of express middleware that
  *   reads a form's input and stores it as a javascript
  *   object accessible through `req.body`
  *
  */
  var bodyParser = require('body-parser');

  // Setup the view engine (jade)
  var path = require('path');
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // to support JSON-encoded bodies
  app.middleware('parse', bodyParser.json());
  // to support URL-encoded bodies
  app.middleware('parse', bodyParser.urlencoded({
    extended: true,
  }));

  const cookieSecret = process.env.COOKIE_SECRET ||
      '246bace2-38cb-4138-85d9-0ae8160b07c8';
  app.middleware('session:before', cookieParser(cookieSecret));

  const sessionSecret = process.env.SESSION_SECRET || 'kitty';
  app.middleware('session', session({
    secret: sessionSecret,
    saveUninitialized: true,
    resave: true,
  }));

  var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  app.get('/', function(req, res, next) {
    res.render('pages/index', {user:
      req.user,
      url: req.url,
    });
  });

  app.get('/auth/account', ensureLoggedIn('/login'), function(req, res, next) {
    res.render('pages/loginProfiles', {
      user: req.user,
      url: req.url,
    });
  });

  app.get('/local', function(req, res, next) {
    res.render('pages/local', {
      user: req.user,
      url: req.url,
    });
  });

  app.get('/ldap', function(req, res, next) {
    res.render('pages/ldap', {
      user: req.user,
      url: req.url,
    });
  });

  app.get('/signup', function(req, res, next) {
    res.render('pages/signup', {
      user: req.user,
      url: req.url,
    });
  });

  app.post('/signup', function(req, res, next) {
    var User = app.models.user;

    var newUser = {};
    newUser.email = req.body.email.toLowerCase();
    newUser.username = req.body.username.trim();
    newUser.password = req.body.password;
    newUser.emailVerified = (!(app.get('emailVerificationRequired')));

    User.create(newUser, function(err, user) {
      if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
      } else {
        // Passport exposes a login() function on req (also aliased as logIn())
        // that can be used to establish a login session. This function is
        // primarily used when users sign up, during which req.login() can
        // be invoked to log in the newly registered user.
        req.login(user, function(err) {
          if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          return res.redirect('/auth/account');
        });
      }
    });
  });

  app.get('/login', function(req, res, next) {
    res.render('pages/login', {
      user: req.user,
      url: req.url,
    });
  });

  app.get('/auth/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
  });

  app.get('/verify_email_temp', async (req, res) => {
    const { token } = req.query;
    const {user} = app.models;
    if (!token) {
      return res.send(`<script type="text/javascript">alert('Error!')</script>`);
    }
    const thizUser = await user.findOne({
      where: {
        verificationToken: token
      }
    });
    if (!thizUser) {
      return res.send(`<script type="text/javascript">alert('Error!')</script>`);
    }
    await thizUser.updateAttributes({
      emailVerified: true,
      verificationToken: null
    });
    res.send(`<script type="text/javascript">var a = confirm('Your email is verified!')</script>`);
  });
};
