const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/cellShop', {useNewUrlParser: true});

let db = mongoose.connection;

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    qty: {
        type: Number,
    },
    price: {
        type: Number,
    },
});

let Item = module.exports = mongoose.model('Item', itemSchema);

module.exports.getItemById = function (id) {
    let query = {id: id};
    return Item.findOne(query)
};

module.exports.findItemByName = function (name, callback) {
    let query = {name: name};
    Item.findOne(query, callback);
};
