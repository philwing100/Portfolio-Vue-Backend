const express = require('express');
const router = express.Router();

// Import other route modules
const listsRouter = require('./lists');
const loginRouter = require('./login');
const signupRouter = require('./signup');
//console.log('loaded index.js');

// Define routes
router.use('/lists', listsRouter);
router.use('/login', loginRouter);
router.use('/logout', loginRouter);
router.use('/signup', signupRouter);
router.use('/check-auth', loginRouter);

  

module.exports = router;
