const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateTokens } = require("../utils/tokens");

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const user = await User.create({ name, email, password, role });
  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  res.status(201).json({
    message: "Registered successfully",
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, role: user.role },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  res.json({
    message: "Logged in",
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, role: user.role },
  });
};

// POST /api/auth/refresh
// Client must send the refresh token in the x-refresh-token header
const refresh = async (req, res) => {
  const token = req.headers["x-refresh-token"];
  if (!token) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken } = generateTokens(decoded.userId, decoded.role);
    res.json({ message: "Tokens refreshed", accessToken, refreshToken });
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

// POST /api/auth/logout
// Stateless — client just discards the tokens
const logout = (req, res) => {
  res.json({ message: "Logged out" });
};

module.exports = { register, login, refresh, logout };
