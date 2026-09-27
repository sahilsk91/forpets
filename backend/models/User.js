const store = require("../store");

class User {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (this._id) {
      store.users.docs.set(this._id, { ...this });
      return this;
    }
    const doc = store.users.insert({
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role || "user",
    });
    Object.assign(this, doc);
    return this;
  }

  static findOne(match = {}) {
    return store.users.findOne(match);
  }

  static findById(id) {
    return store.users.findById(id);
  }
}

module.exports = User;
