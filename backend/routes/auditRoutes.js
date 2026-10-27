const express = require("express");
const router = express.Router();
const { getAuditLogs, getBlockchainExplorer } = require("../controllers/auditController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/logs", authenticate, authorize("ADMIN"), getAuditLogs);
router.get("/blockchain-explorer", authenticate, authorize("ADMIN", "RETURN_CENTER"), getBlockchainExplorer);

module.exports = router;
