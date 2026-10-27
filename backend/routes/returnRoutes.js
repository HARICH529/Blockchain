const express = require("express");
const router = express.Router();
const {
  getReturns,
  getReturnById,
  createReturn,
  pickupReturn,
  receiveReturn,
  updateRefundStatus,
} = require("../controllers/returnController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, getReturns);
router.get("/:id", authenticate, getReturnById);
router.post("/request", authenticate, authorize("CUSTOMER", "ADMIN"), createReturn);
router.post("/:id/pickup", authenticate, authorize("COURIER", "ADMIN"), pickupReturn);
router.post("/:id/receive", authenticate, authorize("RETURN_CENTER", "ADMIN"), receiveReturn);
router.post("/:id/refund-status", authenticate, authorize("ADMIN", "RETURN_CENTER"), updateRefundStatus);

module.exports = router;
