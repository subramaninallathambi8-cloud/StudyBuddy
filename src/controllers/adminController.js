const User = require("../models/User");
const Material = require("../models/Material");

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").sort("-createdAt");
  res.json(users);
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  // Also delete their materials
  await Material.deleteMany({ user: req.params.id });
  res.json({ message: "User and their materials deleted" });
};

// GET /api/admin/stats
const getStats = async (req, res) => {
  const totalUsers = await User.countDocuments({ role: "student" });
  const totalMaterials = await Material.countDocuments();
  res.json({ totalUsers, totalMaterials });
};

module.exports = { getAllUsers, deleteUser, getStats };
