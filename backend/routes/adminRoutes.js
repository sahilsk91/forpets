const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const store = require("../store");

async function isAdmin(userId) {
  if (!userId) return false;
  const User = require("../models/User");
  const user = User.findById(userId);
  return user && user.role === "admin";
}

// item.productId may be a raw id OR an already-hydrated product object
function productFromItem(item) {
  const pid =
    item.productId && typeof item.productId === "object"
      ? item.productId._id
      : item.productId;
  return pid ? store.products.findById(pid) : null;
}

// 📊 GET /api/admin/stats?userId=<adminId>
router.get("/stats", async (req, res) => {
  try {
    await store.ensureUsers();

    if (!(await isAdmin(req.query.userId))) {
      return res.status(403).json({ message: "Admin access only" });
    }

    const orders = await Order.find();

    // ---- top selling products ----
    const productSales = {};

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const product = productFromItem(item);
        if (!product) return;
        const id = product._id;
        if (!productSales[id]) {
          productSales[id] = {
            name: product.name,
            category: product.category,
            quantitySold: 0,
            revenue: 0,
          };
        }
        productSales[id].quantitySold += item.quantity || 0;
        productSales[id].revenue += item.subtotal || 0;
      });
    });

    const topProducts = Object.values(productSales).sort(
      (a, b) => b.quantitySold - a.quantitySold
    );
    const hotSelling = topProducts.filter((p) => p.quantitySold >= 10);

    // ---- summary ----
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );
    const totalCustomers = new Set(orders.map((o) => o.userId)).size;

    const statusCounts = {};
    ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].forEach(
      (s) => (statusCounts[s] = 0)
    );
    orders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) statusCounts[o.status]++;
    });

    // ---- last 7 days revenue ----
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);

      const dayOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= day && d < next;
      });
      dailyRevenue.push({
        date: day.toLocaleDateString("en-IN", { weekday: "short" }),
        revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      });
    }

    // ---- recent orders (hydrated like populate) ----
    const recentOrders = orders
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 10)
      .map((o) =>
        Order.hydrateUser({
          ...o,
          items: (o.items || []).map((i) => {
            const p = productFromItem(i);
            return { ...i, productId: p ? { ...p } : i.productId };
          }),
        })
      );

    res.json({
      totalOrders: orders.length,
      totalRevenue,
      totalCustomers,
      statusCounts,
      topProducts,
      hotSelling,
      dailyRevenue,
      recentOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// 📦 GET /api/admin/orders?userId=<adminId>
router.get("/orders", async (req, res) => {
  try {
    await store.ensureUsers();

    if (!(await isAdmin(req.query.userId))) {
      return res.status(403).json({ message: "Admin access only" });
    }

    const orders = await Order.find();
    const hydrated = orders
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((o) =>
        Order.hydrateUser({
          ...o,
          items: (o.items || []).map((i) => {
            const p = productFromItem(i);
            return { ...i, productId: p ? { ...p } : i.productId };
          }),
        })
      );

    res.json(hydrated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
