
const express = require('express');
const passport = require('passport');
const router = express.Router();

//console.log('loaded login.js');

router.post('/', (req, res, next) => {
    console.log('Login request received:', req.body);
    next();
}, passport.authenticate('local', {
    successRedirect: '/api/login/success',
    failureRedirect: '/api/login/failure',
}));


router.get('/success', (req, res) => {
    res.json({ message: 'Login successful', user: req.user });
    console.log('/success Signed in');
});


router.get('/failure', (req, res) => {
    res.status(401).json({ message: 'Login failed' });
    console.log('/failure Signed out');
});


router.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        res.redirect('/');
        console.log('/logout');
    });
});

router.get('/api/check-auth', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
}); 



module.exports = router;
