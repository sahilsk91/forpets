const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const User = require("../models/User");
const store = require("../store");
const { sendMail, orderPlacedTemplate, statusUpdateTemplate } = require("../services/emailService");

// place order
router.post("/place", async (req, res) => {
  try {
    await store.ensureUsers();

    const { userId, shippingAddress } = req.body;

    // validate user (protects against stale/cold-start sessions)
    const user = User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "Invalid user — please log in again" });
    }

    const cart = Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let total = 0;
    const items = cart.items.map((item) => {
      const product = store.products.findById(item.productId);
      const price = Number(
        (product ? product.price : "0").replace("₹", "").replace("$", "")
      );
      const subtotal = price * item.quantity;
      total += subtotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        price,
        subtotal,
      };
    });

    const order = new Order({
      userId,
      items,
      totalAmount: total,
      paymentMethod: "COD",
      status: "Placed",
      shippingAddress,
    });
    await order.save();

    // clear cart
    cart.items = [];
    await cart.save();

    // 📧 order confirmation email (awaited: serverless freezes after response)
    if (user.email) {
      await sendMail(
        user.email,
        `🐾 Order Confirmed — FORPETS #${order._id}`,
        orderPlacedTemplate(user, order)
      );
    }

    res.json({ message: "Order placed successfully (COD)", orderId: order._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// GET user order history
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single order (tracking)
router.get("/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADMIN — update status + email customer
router.put("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const allowed = ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    const stored = store.orders.findById(orderId);
    if (stored) {
      stored.status = status;
      store.orders.docs.set(orderId, stored);
    }

    // 📧 status email (awaited: serverless freezes after response)
    const user = User.findById(order.userId);
    if (user && user.email) {
      await sendMail(
        user.email,
        `📦 Order ${status} — FORPETS #${order._id}`,
        statusUpdateTemplate(user, order, status)
      );
    }

    res.json({ message: `Status updated to ${status} & email sent`, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
