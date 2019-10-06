const path = require('path');
const express = require('express');
const {check, validationResult} = require('express-validator');
const router = express.Router();
let User = require('../models/user');
let Item = require('../models/item');
let Cart = require('../models/cart');

router.get('/DanielLavi', (req, res) => {
    res.render('readme/DanielLavi', {title: 'Readme'})
});

router.get('/JoelZylberyng', (req, res) => {
    res.render('readme/JoelZylberyng', {title: 'Readme'})
});


module.exports = router;