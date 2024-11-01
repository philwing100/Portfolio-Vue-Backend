//Index.js
const express = require('express');
const router = express.Router();

// Import other route modules
const listsRouter = require('./lists');
const authRouter = require('./auth');
//console.log('loaded index.js');

// Define routes
router.use('/lists', listsRouter);
router.use('/auth', authRouter);

module.exports = router;
