const store = require("../store");

class Cart {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (this._id) {
      // findOne returns the live stored doc, so mutations are already persisted
      store.carts.docs.set(this._id, { ...this });
      return this;
    }
    const doc = store.carts.insert({
      userId: this.userId,
      items: this.items || [],
    });
    Object.assign(this, doc);
    return this;
  }

  static findOne(match = {}) {
    const doc = store.carts.findOne(match);
    // return an instance so callers can mutate + .save()
    return doc ? new Cart(doc) : null;
  }
}

module.exports = Cart;
