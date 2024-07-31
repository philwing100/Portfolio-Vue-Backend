const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const dbinfo = require('./databaseConnection/dbinfo.json');

// Create a MySQL connection pool
const pool = require('./databaseConnection/database');

// Session store options
const options = {
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'sessionID',
      expires: 'expires',
      data: 'data'
    }
  }
};

// Create a session store using MySQL
const sessionStore = new MySQLStore(options, pool.promise());

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:8080', 
  credentials: true, 
}));

// Session middleware
app.use(session({
  key: dbinfo.key,
  secret: dbinfo.secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 30 } // 30 seconds
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport LocalStrategy
passport.use(new LocalStrategy(
  {
    usernameField: 'username', // Should match the name attribute in your form
    passwordField: 'password'
  },
  async (username, password, done) => {
    try {
      //console.log('Entry into LocalStrategy with username:', username);
      const [results] = await pool.promise().query('SELECT * FROM users WHERE email = ?', [username]);
      if (!results.length) {
       // console.log('Invalid username:', username);
        return done(null, false, { message: 'That email does not match any emails in our system' });
      }
      const user = results[0];
      //console.log('User found:', user);
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        //console.log('Invalid password for user:', username);
        return done(null, false, { message: 'Invalid username or password' });
      }
      //console.log('Authentication successful for user:', username);
      return done(null, user);
    } catch (err) {
      console.error('Error during authentication:', err);
      return done(err);
    }
  }
));

// Passport serialize and deserialize
passport.serializeUser((user, done) => {
  done(null, user.userID);
  console.log('Cerealizing user');
});


passport.deserializeUser(async (userID, done) => {
    try {
      const [results] = await pool.promise().query('SELECT * FROM users WHERE userID = ?', [userID]);
      console.log('Deserializing user:', results[0]); // Log the deserialized user object
      done(null, results[0]);
    } catch (err) {
      done(err);
    }
  });
// Routes
const routes = require('./routes/index');
app.use('/api', routes);

app.use('/api/test', (req, res) => {
  console.log('test api called');
  res.send('Proxy is working!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
