const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const store = require("./store");

dotenv.config();

// seed demo accounts (in-memory demo mode)
store.ensureUsers();

const app = express();

app.use(cors());
app.use(express.json());

// login
app.use("/api/auth", require("./routes/authRoutes"));

// app.use("/api/payment", require("./routes/paymentRoutes"));

// products
app.use("/api/products", require("./routes/productRoutes"));

// cart
app.use("/api/cart", require("./routes/cartRoutes"));

// order
app.use("/api/order", require("./routes/orderRoutes"));

// admin dashboard & stats
app.use("/api/admin", require("./routes/adminRoutes"));


app.get("/", (req, res) => {
  res.send("FORPETS Backend is Running Successfully 🚀");
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
