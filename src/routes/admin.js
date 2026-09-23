const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/auth");
const { getAllUsers, deleteUser, getStats } = require("../controllers/adminController");

router.use(protect, adminOnly); // admin only

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/stats", getStats);

module.exports = router;
