/**
 * In-memory demo data store (Vercel-friendly).
 *
 * ⚠️ DEMO MODE: data lives in serverless-function memory and resets on
 * cold starts. Perfect for demos/submissions; NOT for production data.
 *
 * The store mimics a tiny document DB: every collection is a Map of id → doc,
 * and ids are simple strings. Model files wrap this so route code stays clean.
 */

const crypto = require("crypto");

const newId = () => crypto.randomBytes(12).toString("hex");

// ---- seed products (matches original product.json + real-looking names) ----
const SEED_PRODUCTS = [
  { category: "dog", name: "Royal Canin Dog Food 3kg", characteristic: "dog food", price: "₹1250", img: "images/dogFilter.jpg" },
  { category: "dog", name: "Pedigree Adult Chicken 1.2kg", characteristic: "dog food", price: "₹549", img: "images/dogFilter.jpg" },
  { category: "dog", name: "Drools Puppy Chicken 3kg", characteristic: "dog food", price: "₹899", img: "images/dogFilter.jpg" },
  { category: "cat", name: "Whiskas Tuna 1.1kg", characteristic: "cat food", price: "₹649", img: "images/catFilter.jpg" },
  { category: "cat", name: "Me-O Ocean Fish 1.2kg", characteristic: "cat food", price: "₹525", img: "images/catFilter.jpg" },
  { category: "bird", name: "Boltz Bird Food 1kg", characteristic: "bird food", price: "₹399", img: "images/birdFilter.jpg" },
  { category: "fish", name: "TetraBits Fish Flakes 100g", characteristic: "fish food", price: "₹299", img: "images/fishFilter.jpg" },
  { category: "fish", name: "Optimum Fish Pellets 200g", characteristic: "fish food", price: "₹349", img: "images/fishFilter.jpg" },
];

const SEED_USERS = [
  { name: "Admin", email: "admin@gmail.com", password: "admin123", role: "admin" },
  { name: "Test User", email: "user@gmail.com", password: "user123", role: "user" },
];

// ---- collection class ----
class Collection {
  constructor(name, seed = []) {
    this.name = name;
    this.docs = new Map();
    seed.forEach((d) => this.insert(d));
  }

  insert(data) {
    const doc = {
      _id: data._id || newId(),
      ...data,
    };
    this.docs.set(doc._id, doc);
    return doc;
  }

  findOne(match = {}) {
    for (const doc of this.docs.values()) {
      if (Object.entries(match).every(([k, v]) => doc[k] === v)) return doc;
    }
    return null;
  }

  find(match = {}) {
    const out = [];
    for (const doc of this.docs.values()) {
      if (Object.entries(match).every(([k, v]) => doc[k] === v)) out.push(doc);
    }
    return out;
  }

  findById(id) {
    return this.docs.get(id) || null;
  }

  get size() {
    return this.docs.size;
  }
}

// ---- global store (survives across module re-imports in the same instance) ----
const g = globalThis;

if (!g.__FORPETS_STORE__) {
  g.__FORPETS_STORE__ = {
    users: new Collection("users"),
    products: new Collection("products", SEED_PRODUCTS),
    carts: new Collection("carts"),
    orders: new Collection("orders"),

    // seed the two demo accounts (plain-text in demo mode; bcrypt in real deploy)
    async ensureUsers() {
      if (this.users.size === 0) {
        const bcrypt = require("bcryptjs");
        for (const u of SEED_USERS) {
          this.users.insert({
            name: u.name,
            email: u.email,
            password: await bcrypt.hash(u.password, 10),
            role: u.role,
          });
        }
        console.log("✅ Seeded demo users (admin@gmail.com / user@gmail.com)");
      }
    },
  };
}

module.exports = g.__FORPETS_STORE__;
