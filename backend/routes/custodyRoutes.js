const express = require("express");
const router = express.Router();
const { getProductCustody, recordCustodyEvent } = require("../controllers/custodyController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/:productId", authenticate, getProductCustody);
router.post(
  "/record",
  authenticate,
  authorize("SELLER", "COURIER", "RETURN_CENTER", "ADMIN"),
  recordCustodyEvent
);

module.exports = router;
