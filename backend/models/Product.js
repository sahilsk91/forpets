const store = require("../store");

module.exports = {
  // matches old mongoose usage: Product.find()
  find: (match = {}) => store.products.find(match),
  findById: (id) => store.products.findById(id),
};
