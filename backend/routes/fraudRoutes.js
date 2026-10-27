const express = require("express");
const router = express.Router();
const {
  getFraudCases,
  getFraudCaseById,
  assignInvestigator,
  resolveFraudCase,
} = require("../controllers/fraudController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, authorize("ADMIN", "RETURN_CENTER", "SELLER"), getFraudCases);
router.get("/:id", authenticate, authorize("ADMIN", "RETURN_CENTER", "SELLER"), getFraudCaseById);
router.post("/:id/assign", authenticate, authorize("ADMIN", "RETURN_CENTER"), assignInvestigator);
router.post("/:id/resolve", authenticate, authorize("ADMIN"), resolveFraudCase);

module.exports = router;
