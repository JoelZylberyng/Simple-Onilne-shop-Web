const path = require('path');
const express = require('express');
const {check, validationResult} = require('express-validator');
const router = express.Router();
let User = require('../models/user');
let Item = require('../models/item');
let Cart = require('../models/cart');

router.get('/', (req, res, next) => {
    res.render('landingPage', {title: "Home"});
});

router.get('/admin', ensureAuthenticatedAdmin, (req, res) => {
    User.find()
        .then((registrations) => {
            console.log(registrations.email);
            res.render('usersinfo', {title: 'Listing registrations', registrations});
        })
        .catch(() => {
            res.send('No registrations');
        });
});

router.get('/readme', (req, res) => {
    res.render('readme/readmeIndex', {title: 'Readme'})
});

router.get('/about', (req, res) => {
    res.render('about', {title: 'About Us'})
});

router.get('/deals', ensureAuthenticated, (req, res) => {
    res.render('deals', {title: 'Deals'})
});

router.get('/jobs', (req, res) => {
    res.render('jobs', {title: 'Jobs'})
});

router.get('/store', ensureAuthenticated, (req, res, next) => {
    res.render('store', {title: "Store"});
});

router.get('/add-to-cart', ensureAuthenticated, (req, res, next) => {
    let itemName = req.query.name;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    Item.findItemByName(itemName, function (err, item) {
        if (err) {
            return res.redirect('/');
        }

        cart.add(item, item.id);
        req.session.cart = cart;
        req.flash('success', 'Item added to cart!');
        res.redirect('/store');
    });
});

router.get('/remove-from-cart', ensureAuthenticated, (req, res, next) => {
    let itemName = req.query.name;
    let cart = new Cart(req.session.cart ? req.session.cart : {});

    Item.findItemByName(itemName, function (err, item) {
        if (err) {
            return res.redirect('/');
        }

        cart.remove(item, item.id);
        req.session.cart = cart;

        let newCart = new Cart(cart);
        res.render('cart', {
            totalPrice: newCart.totalPrice,
            totalQty: newCart.totalQty,
            items: newCart.items
        });
    });
});

router.get('/cart', ensureAuthenticated, (req, res, next) => {
    if (!req.session.cart) {
        res.render('cart', {items: null});
    }
    else {
        let cart = new Cart(req.session.cart);
        res.render('cart', {
            totalPrice: cart.totalPrice,
            totalQty: cart.totalQty,
            items: cart.items
        });
    }
});

router.get('/checkout', ensureAuthenticated, (req, res, next) => {
    if (!req.session.cart) {
        return res.redirect('/cart');
    }

    let cart = new Cart(req.session.cart);
    res.render('checkout', {
        totalPrice: cart.totalPrice,
        totalQty: cart.totalQty,
        items: cart.items
    });
});

router.post('/checkout', [
        check('name').isLength({min: 1}).withMessage('Name must not be empty'),
        check('id').isIdentityCard('any').withMessage('Please enter a valid id'),
        check('cardNum').isInt().withMessage("Please enter a valid card number"),
        check('month').isInt({ min: 1, max: 12 }).withMessage('Please enter a valid month'),
        check('year').isInt().isLength({min: 2, max: 2}).withMessage('Please enter a valid year'),
        check('cvc').isInt().isLength({min: 3, max: 3}).withMessage('Please enter a valid cvc'),
    ],
    (req, res) => {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            let cart = new Cart(req.session.cart);
            res.render('checkout', {
                errors: errors.array(),
                totalPrice: cart.totalPrice,
                totalQty: cart.totalQty,
                items: cart.items,
            });
        } else {
            let cart = new Cart(req.session.cart);
            User.addPurchase(req.user.username, cart.generateArray(), req.user.purchaseHistory, (err) => {
                if(err) res.send(500, { error: err });
                res.redirect('/confirmation');
            });
        }
    }
);

router.get('/confirmation', ensureAuthenticated, (req, res, next) => {
    let cart = new Cart(req.session.cart);

    cart.totalPrice = 0;
    cart.totalQty = 0;
    cart.items = {};
    req.session.cart = cart;

    res.render('confirmation', {title: "Confirmation"});
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('users/login');
}

function ensureAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (req.user.role == 'admin') {
            return next();
        }
    }
    res.redirect('/error')
}

function parseCookies(request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function setSelectedItem(selectedItem) {
    switch (selectedItem) {
        case "iphonexr":
            selectedItem = "iPhone";
            break;
        case "iphonexs":
            selectedItem = "iPhone";
            break;
        case "galaxy10":
            selectedItem = "Galaxy";
            break;
        case "galaxynote":
            selectedItem = "Galaxy";
            break;
        case "xiaomimi9":
            selectedItem = "Xiaomi";
            break;
    }

    return selectedItem;
}


module.exports = router;