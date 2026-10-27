const express = require("express");
const router = express.Router();
const { verifyReturnItem } = require("../controllers/verificationController");
const { authenticate, authorize } = require("../middleware/auth");

// Core Return Center verification endpoint
router.post(
  "/verify",
  authenticate,
  authorize("RETURN_CENTER", "ADMIN"),
  verifyReturnItem
);

module.exports = router;
