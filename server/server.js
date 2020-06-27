const path = require('path');
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const session = require('express-session');

const passport = require('passport');
const GitHubStategy = require('passport-github2').Strategy;

const { GITHUB_CLIENT_ID } = process.env;
const { GITHUB_CLIENT_SECRET } = process.env;

const userController = require('./controllers/user');
const verifyToken = require('./utils/verifyToken');

// const keys = require('./keys/keys');

const app = express();
const PORT = process.env.PORT || 5000;

// ------
// Routes
// ------

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.use(express.json({ extended: false }));
app.use(cookieParser());

// Passport setup

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new GitHubStategy(
    {
      clientID: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/auth/github/callback',
    },
    ((accessToken, refreshToken, profile, done) => {
      //
      console.log('githubStrategy', profile);
      /*
      User.remove({ githubId: profile.id }, function (err, user) {
        console.log('try to remove',err,user);
      });
      */
    }),
  ),
);

app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get(
  '/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  (req, res) => {
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  },
);

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('TESTING CALLBACK ROUTE');
    res.redirect('/api/collections');
  },
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.post('/api/register', userController.registerUser);
app.post('/api/login', userController.loginUser);
// Used to check if the users token is valid
// Allows us to protect routes on the client side
app.get('/api/checkToken', [verifyToken], (req, res) => {
  res.sendStatus(200);
});

// Collection routes
app.use('/api/collections', require('./routes/api/collections'));

// Let React handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

// -------------
// Connect to DB
// Then start server
// -----------------

console.log('MongoDB connection:', process.env.DB);

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });
});
