const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../databaseConnection/database'); // Database connection
const dbinfo = require('../databaseConnection/dbinfo.json'); // Contains Google OAuth credentials

const router = express.Router();

// Google OAuth Strategy configuration
passport.use(new GoogleStrategy({
    clientID: dbinfo.googleClientId,
    clientSecret: dbinfo.googleClientSecret,
    callbackURL: '/api/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id; // Google ID from profile
      const email = profile.emails[0].value; // Email from profile


      // Check if the user already exists
      const [results] = await pool.promise().query('SELECT * FROM users WHERE google_id = ?', [googleId]);
      console.log('Found this many users: ' + results.length);
      if (results.length > 0) {
        // User exists
        return done(null, results[0]);
      } else {
        // User does not exist, create a new user
        await pool.promise().query('INSERT INTO users (google_id, email) VALUES (?, ?)', [googleId, email]);

        // Retrieve the new user
        const [newUserResults] = await pool.promise().query('SELECT * FROM users WHERE google_id = ?', [googleId]);
        return done(null, newUserResults[0]);
      }
    } catch (err) {
      console.error('Error during Google authentication:', err);
      return done(err);
    }
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.userID);
});

passport.deserializeUser(async (userID, done) => {
  try {
    const [results] = await pool.promise().query('SELECT * FROM users WHERE userID = ?', [userID]);
    done(null, results[0]);
  } catch (err) {
    done(err);
  }
});

// Google login route
router.get('/google', passport.authenticate('google', { scope: ['email'] }));

// Google callback route
router.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: '/api/auth/success',
    failureRedirect: '/api/auth/failure'
  })
);

// Success route
router.get('/success', (req, res) => {
  if (req.isAuthenticated()) {
    // Redirecting back to the dashboard while sending the session cookie
    console.log('successed, redirected');
    res.cookie('sessionId', req.sessionID, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.redirect('http://localhost:8080/'); // Redirecting to the Vue app's dashboard
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
});


router.get('/failure', (req, res) => {
  res.status(401).json({ message: 'Login failed' });
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Route to check if user is authenticated
router.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = router;
