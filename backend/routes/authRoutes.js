const express = require("express");
const router = express.Router();
const { login, register, getProfile, getDemoAccounts } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/login", login);
router.post("/register", register);
router.get("/profile", authenticate, getProfile);
router.get("/demo-accounts", getDemoAccounts);

module.exports = router;
