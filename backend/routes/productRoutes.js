const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  registerProduct,
  verifyProductPublic,
  getProductQrCode,
} = require("../controllers/productController");
const { authenticate, authorize } = require("../middleware/auth");

// Public endpoint for QR-code scanning verification (NO authentication required, NO PII exposed)
router.get("/public-verify/:id", verifyProductPublic);
router.get("/qr/:id", getProductQrCode);
router.get("/:id/qr", getProductQrCode);

// Authenticated endpoints
router.get("/", authenticate, getProducts);
router.get("/:id", authenticate, getProductById);
router.post("/register", authenticate, authorize("SELLER", "ADMIN"), registerProduct);

module.exports = router;
