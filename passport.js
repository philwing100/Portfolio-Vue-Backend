const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Dummy user database (replace with actual database integration)
const users = [];

// Serialize and deserialize user (store minimal info in session)
passport.serializeUser((user, done) => {
  done(null, user.id);  // store user id in session
});

passport.deserializeUser((id, done) => {
  const user = users.find(user => user.id === id);
  done(null, user);
});

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: "YOUR_GOOGLE_CLIENT_ID",
    clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // Check if user already exists in database
    let user = users.find(user => user.googleId === profile.id);

    if (user) {
      return done(null, user);
    } else {
      // Add new user to "database" (in real app, save to your DB)
      user = {
        id: users.length + 1,
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value
      };
      users.push(user);
      return done(null, user);
    }
  }
));

module.exports = passport;
