const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const store = require("../store");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    await store.ensureUsers(); // avoid cold-start race

    const { name, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password: await bcrypt.hash(password, 10),
    });
    await user.save();

    res.json({ message: "Registered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// LOGIN
router.post("/login", async (req, res) =>
{
  try {
    await store.ensureUsers(); // avoid cold-start race

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "forpets-demo-secret",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
