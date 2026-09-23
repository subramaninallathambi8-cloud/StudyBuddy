const router = require("express").Router();
const { register, login, refresh, logout } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

module.exports = router;
