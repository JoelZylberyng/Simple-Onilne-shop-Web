module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function (item, id) {
        let storedItem = this.items[id];
        if (!storedItem) {
            storedItem = this.items[id] = {item: item, name: item.name, qty: 0, price: 0};
        }

        storedItem.qty++;
        storedItem.price = storedItem.item.price * storedItem.qty;
        this.totalQty++;
        this.totalPrice += storedItem.item.price;
    };

    this.remove = function (item, id) {
        let storedItem = this.items[id];
        if (!storedItem) {
            storedItem = this.items[id] = undefined;
        }

        storedItem.qty--;
        if (storedItem.qty == 0) {
            delete this.items[id];
        }
        storedItem.price = storedItem.item.price;
        this.totalQty--;
        this.totalPrice -= storedItem.item.price;
    };

    this.generateArray = function () {
        let arr = [];
        for (let id in this.items) {
            arr.push(this.items[id].qty + " " + this.items[id].name);
        }

        return arr;
    };
};