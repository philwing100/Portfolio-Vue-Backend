const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./databaseConnection/database'); // Database pool connection
const dbinfo = require('./databaseConnection/dbinfo.json'); // Contains session secrets
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;

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

// Middleware to parse cookies and JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS with credentials to allow cookie usage across origins
app.use(cors({
  origin: 'http://localhost:8080', // Your frontend origin
  credentials: true, // Allow cookies and credentials to be shared
}));

// Session middleware configuration
app.use(session({
  key: dbinfo.key, // Unique session key
  secret: dbinfo.secret, // Secret used to sign the session cookie
  store: sessionStore, // Store session in MySQL
  resave: false, // Avoid resaving sessions if nothing changed
  saveUninitialized: false, // Only save sessions that have been modified
  cookie: {
    maxAge: 1000 * 60 * 30, // Set cookie lifespan (30 minutes)
    httpOnly: true, // For security, prevents JavaScript from accessing the cookie
    secure: false, // Set true if using HTTPS (adjust for production)
    sameSite: 'lax', // Controls cross-site cookie handling
  },
}));

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, proceed to the next middleware/route
  } else {
    return res.status(401).json({ message: 'Unauthorized access, please login.' }); // User is not authenticated
  }
};

// Import and use routes
const routes = require('./routes/index');
app.use('/api', routes);

// Example of protected route
app.get('/api/protected', isAuthenticated, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Static testing route (optional)
app.get('/api/test', (req, res) => {
  res.send('Proxy is working!');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
