const express = require("express");
const router = express.Router();
const {
  getOrders,
  getOrderById,
  createOrder,
  dispatchOrder,
  confirmDelivery,
} = require("../controllers/orderController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.post("/create", authenticate, authorize("CUSTOMER", "ADMIN"), createOrder);
router.post("/:id/dispatch", authenticate, authorize("SELLER", "ADMIN"), dispatchOrder);
router.post("/:id/deliver", authenticate, authorize("COURIER", "ADMIN"), confirmDelivery);

module.exports = router;
