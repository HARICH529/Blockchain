const express = require("express");
const router = express.Router();
const { getUsers, updateUserRole, toggleUserStatus } = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, authorize("ADMIN"), getUsers);
router.patch("/:id/role", authenticate, authorize("ADMIN"), updateUserRole);
router.patch("/:id/status", authenticate, authorize("ADMIN"), toggleUserStatus);

module.exports = router;
