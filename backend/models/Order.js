const store = require("../store");

class Order {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (this._id) {
      // persist updates (e.g. status change) back into the store
      store.orders.docs.set(this._id, { ...this });
      return this;
    }
    const doc = store.orders.insert({
      userId: this.userId,
      items: this.items || [],
      totalAmount: this.totalAmount,
      paymentMethod: this.paymentMethod || "COD",
      status: this.status || "Placed",
      shippingAddress: this.shippingAddress || null,
      createdAt: new Date().toISOString(),
    });
    Object.assign(this, doc);
    return this;
  }

  // Awaitable builder supporting: Order.find({...}).populate("items.productId").sort({createdAt:-1})
  static find(match = {}) {
    let docs = store.orders
      .find(match)
      .map((o) => ({
        ...o,
        items: (o.items || []).map((i) => ({ ...i })),
      }));

    const builder = {
      populate() {
        return builder;
      },
      sort(spec = {}) {
        const [key, dir] = Object.entries(spec)[0] || ["createdAt", -1];
        docs.sort((a, b) => {
          const av = a[key], bv = b[key];
          const cmp = av > bv ? 1 : av < bv ? -1 : 0;
          return dir === -1 ? -cmp : cmp;
        });
        return builder;
      },
      then(onFulfilled, onRejected) {
        // expand productId refs (like mongoose populate)
        docs.forEach((o) =>
          o.items.forEach((i) => {
            const p = i.productId ? store.products.findById(i.productId) : null;
            if (p) i.productId = { ...p };
          })
        );
        return Promise.resolve(docs).then(onFulfilled, onRejected);
      },
    };
    return builder;
  }

  // Returns a hydrated copy (items.productId expanded) — like mongoose populate
  static findById(id) {
    const o = store.orders.findById(id);
    if (!o) return Promise.resolve(null);
    const copy = {
      ...o,
      items: (o.items || []).map((i) => {
        const p = i.productId ? store.products.findById(i.productId) : null;
        return { ...i, productId: p ? { ...p } : i.productId };
      }),
    };
    return Promise.resolve(copy);
  }

  // replace a string userId with a small user object (for admin views)
  static hydrateUser(order) {
    if (typeof order.userId === "string") {
      const u = store.users.findById(order.userId);
      order.userId = u
        ? { _id: u._id, name: u.name, email: u.email }
        : order.userId;
    }
    return order;
  }
}

module.exports = Order;
