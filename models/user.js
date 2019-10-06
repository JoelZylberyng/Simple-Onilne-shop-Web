const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost/cellShop', {useNewUrlParser : true});

let db = mongoose.connection;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
    },
    purchaseHistory:{
        type: Array,
    },
});

let User = module.exports = mongoose.model('User', userSchema);

module.exports.getUser = function(username){
    let query = {username: username};
    return User.findOne(query)
};

module.exports.getUserByEmail = function(email){
    let query = {email: email};
    return User.findOne(query)
};

module.exports.findUserById = function(id, callback){
    User.findById(id, callback);
};

module.exports.findUserByUsername = function(username, callback){
    let query = {username: username};
    User.findOne(query, callback);
};

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        callback(null, isMatch)
    });
};

module.exports.addPurchase = function(username, newItems, oldItems, callback){
    let query = {username: username};
    let items = oldItems.concat(newItems);
    User.findOneAndUpdate(query, {purchaseHistory:items}, {useFindAndModify: false, new: true}, callback);
};

module.exports.createUser = function(newUser, callback){
    bcrypt.genSalt(10, function (err, salt) {
        if(err) throw err;
        bcrypt.hash(newUser.password, salt, function(err, hash){
            newUser.password = hash;
            newUser.save(callback)
        });
    });
};