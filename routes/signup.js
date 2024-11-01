//signup.js
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../databaseConnection/database');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 10 })
      .withMessage('Password must be at least 10 characters long')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-z]/)
      .withMessage('Password must contain at least one lowercase letter')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must contain at least one special character')
  ],
  async function (req, res, next) {
    const { email, password } = req.body;

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
        const emailExists = await checkEmailInDatabase(email);
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }

      const userID = await generateUniqueUserID();

      // Generate a salt and hash the password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
        //console.log(hashedPassword);
      // Save the new user to the database
      pool.query(
        'INSERT INTO users (email, password, userID) VALUES (?, ?, ?)',
        [email, hashedPassword, userID],
        function (err, results) {
          if (err) {
            return next(err);
          }
          const user = { id: results.insertId, email };
          res.status(201).json({ message: 'User registered successfully', user });
        }
      );
    } catch (err) {
      return next(err);
    }
  }
);

async function generateUniqueUserID() {
  for (let i = 0; i < 5; i++) {
    const userID = uuidv4();
    const result = await checkUserIDInDatabase(userID);
    if (result.length === 0) {
      return userID; // Return the unique userID
    }
  }
  throw new Error('Failed to generate a unique userID after 5 attempts.');
}

function checkUserIDInDatabase(userID) {
  return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM users WHERE userID = ?', [userID], function (err, results) {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
}

function checkEmailInDatabase(email) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM users WHERE email = ?', [email], function (err, results) {
        if (err) {
          return reject(err);
        }
        // Check if any results were returned
        if (results.length > 0) {
          resolve(true); // Email exists
        } else {
          resolve(false); // Email does not exist
        }
      });
    });
  }

module.exports = router;
