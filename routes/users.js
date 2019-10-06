const express = require('express');
const {check, validationResult} = require('express-validator');
const utils = require('../utils');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const RememberMeStrategy = require('passport-remember-me').Strategy;
const router = express.Router();

let User = require('../models/user');

const tokens = {};


router.get('/register', (req, res, next) => {
    res.render('register', {title: "register"});
});

router.post('/register', [
        check('username').isLength({min: 1}).withMessage('Name must not be empty').not().contains(' ').withMessage("Username must not contain whitespace")
            .isAlphanumeric().withMessage("UserName must conatin only letters and numbers"),
        check('username').custom(value => {
            return User.getUser(value).then(user => {
                if (user && user.role == 'user') {
                    return Promise.reject('Username already taken');
                }
            });
        }),
        check('password').isLength({min: 8}).withMessage("Password must be at least 8 characters long"),
        check('email').isEmail().withMessage("Enter a valid email").custom(value => {
            return User.getUserByEmail(value).then(user => {
                if (user) {
                    return Promise.reject('Email already taken');
                }
            });
        }),
        check('confirmPassword').custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('register', {
                errors: errors.array(),
                data: req.body
            });
        } else {
            let newUser = new User({
                username: req.body.username,
                email: req.body.email,
                password: req.body.password,
                role: 'user',
                purchaseHistory: [],
            });

            User.createUser(newUser, function (err, user) {
                if (err) throw err;
            });

            req.flash('success', 'Registration successful, you can now login!');

            res.location('/');
            res.redirect('/')
        }
    }
);

router.get('/login', (req, res, next) => {
    res.render('login', {title: "login"});
});

router.get('/logout', (req, res) => {
    res.clearCookie('remember_me');
    req.logout();
    req.flash('success', 'You are now logged out');
    res.redirect('/users/login');
});

router.post('/login',
    passport.authenticate('local', {failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}),
    (req, res, next) => {
        // Issue a remember me cookie if the option was checked
        if (!req.body.remember_me) {
            return next();
        }

        issueToken(req.user, function (err, token) {
            if (err) {
                return next(err);
            }
            res.cookie('remember_me', token, {path: '/', httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 30});
            return next();
        });
    },
    function (req, res) {
        req.flash('success', 'You are now logged in');
        res.redirect('/');
    });


function consumeRememberMeToken(token, fn) {
    var uid = tokens[token];
    // invalidate the single-use token
    delete tokens[token];
    return fn(null, uid);
}

function saveRememberMeToken(token, uid, fn) {
    tokens[token] = uid;
    return fn();
}

passport.serializeUser(function (user, done) {
    done(null, user._id)
});

passport.deserializeUser((id, done) => {
    User.findUserById(id, (err, user) => {
        done(err, user);
    });
});

passport.use(new LocalStrategy((username, password, done) => {
    User.findUserByUsername(username, (err, user) => {
        if (err) throw err;
        if (!user) {
            return done(null, false, {message: 'Unknown User'})
        }

        User.comparePassword(password, user.password, (err, isMatch) => {
            if (err) return done(err);
            if (isMatch) {
                return done(null, user)
            } else {
                return done(null, false, {message: 'Invalid Password'})
            }
        });
    });
}));

// Remember Me cookie strategy
//   This strategy consumes a remember me token, supplying the user the
//   token was originally issued to.  The token is single-use, so a new
//   token is then issued to replace it.
passport.use(new RememberMeStrategy(
    function (token, done) {
        consumeRememberMeToken(token, function (err, uid) {
            if (err) {
                return done(err);
            }
            if (!uid) {
                return done(null, false);
            }

            User.findUserById(uid, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            });
        });
    },
    issueToken
));

function issueToken(user, done) {
    var token = utils.randomString(64);
    saveRememberMeToken(token, user._id, function (err) {
        if (err) {
            return done(err);
        }
        return done(null, token);
    });
}


module.exports = router;
