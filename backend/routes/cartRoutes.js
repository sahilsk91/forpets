const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const store = require("../store");

// hydrate cart items with product objects (like the old populate)
function hydrate(items) {
  return items.map((item) => {
    const product = store.products.findById(item.productId);
    return { ...item, productId: product ? { ...product } : item.productId };
  });
}

// POST /api/cart/add
router.post("/add", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    let cart = Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [{ productId, quantity: 1 }] });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId === productId
      );
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ productId, quantity: 1 });
      }
    }

    await cart.save();
    res.json({ message: "Product added to cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

// GET /api/cart/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = Cart.findOne({ userId });
    if (!cart) return res.json([]);

    res.json(hydrate(cart.items));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cart/remove
router.delete("/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = Cart.findOne({ userId });
    if (!cart) return res.json([]);

    cart.items = cart.items.filter((item) => item.productId !== productId);
    await cart.save();

    res.json(hydrate(cart.items));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/cart/update
router.put("/update", async (req, res) => {
  try {
    const { userId, productId, action } = req.body;

    const cart = Cart.findOne({ userId });
    if (!cart) return res.json([]);

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId
    );
    if (itemIndex === -1) return res.json(cart.items);

    if (action === "increase") {
      cart.items[itemIndex].quantity += 1;
    }
    if (action === "decrease") {
      cart.items[itemIndex].quantity -= 1;
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      }
    }

    await cart.save();

    res.json(hydrate(cart.items));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
