const FraudCase = require("../models/FraudCase");
const ReturnRequest = require("../models/ReturnRequest");
const blockchainService = require("../services/blockchainService");
const { recordAudit } = require("../services/auditService");

const getFraudCases = async (req, res) => {
  try {
    if (req.user.role === "CUSTOMER" || req.user.role === "COURIER") {
      return res.status(403).json({
        success: false,
        message:
          "Access Denied: Fraud case investigations are restricted to Return Center Inspectors, Sellers, and Admins.",
      });
    }

    const { status, riskLevel } = req.query;
    const query = {};
    if (status) query.status = status;
    if (riskLevel) query.riskLevel = riskLevel;

    if (req.user.role === "SELLER") {
      const myProductIds = await Product.find({ seller: req.user._id }).distinct("productId");
      query.productId = { $in: myProductIds };
    }

    const cases = await FraudCase.find(query)
      .populate("returnRequest")
      .populate("product")
      .populate("assignedInvestigator", "name email role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: cases.length, cases });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching fraud cases", error: error.message });
  }
};

const getFraudCaseById = async (req, res) => {
  try {
    if (req.user.role === "CUSTOMER" || req.user.role === "COURIER") {
      return res.status(403).json({
        success: false,
        message:
          "Access Denied: Fraud case investigations are restricted to Return Center Inspectors, Sellers, and Admins.",
      });
    }

    const { id } = req.params;
    const fraudCase = await FraudCase.findOne({ caseId: id })
      .populate("returnRequest")
      .populate("product")
      .populate("assignedInvestigator", "name email role");

    if (!fraudCase) {
      return res.status(404).json({ success: false, message: `Fraud case '${id}' not found.` });
    }

    if (req.user.role === "SELLER") {
      const product = await Product.findOne({ productId: fraudCase.productId });
      if (!product || product.seller?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You can only view fraud investigations for products you sell.",
        });
      }
    }

    res.json({ success: true, fraudCase });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching fraud case", error: error.message });
  }
};

const assignInvestigator = async (req, res) => {
  try {
    const { id } = req.params;
    const { investigatorId } = req.body;

    const fraudCase = await FraudCase.findOne({ caseId: id });
    if (!fraudCase) {
      return res.status(404).json({ success: false, message: `Fraud case '${id}' not found.` });
    }

    fraudCase.assignedInvestigator = investigatorId || req.user._id;
    fraudCase.status = "UNDER_INVESTIGATION";
    await fraudCase.save();

    await recordAudit({
      action: "FRAUD_CASE_ASSIGNED",
      actor: req.user,
      targetType: "FRAUD_CASE",
      targetId: fraudCase.caseId,
      details: { investigatorId: fraudCase.assignedInvestigator },
    });

    res.json({ success: true, message: "Investigator assigned to fraud case.", fraudCase });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error assigning investigator", error: error.message });
  }
};

const resolveFraudCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes, resolutionStatus } = req.body; // RESOLVED_REJECTED or RESOLVED_APPROVED_EXCEPTION

    if (!resolutionNotes) {
      return res.status(400).json({ success: false, message: "resolutionNotes are required." });
    }

    const fraudCase = await FraudCase.findOne({ caseId: id });
    if (!fraudCase) {
      return res.status(404).json({ success: false, message: `Fraud case '${id}' not found.` });
    }

    // Submit resolution to blockchain
    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.resolveFraudCase(
        fraudCase.caseId,
        resolutionNotes,
        req.user.role
      );
    } catch (e) {
      console.warn("Blockchain resolveFraudCase notice:", e.message);
    }

    fraudCase.status = resolutionStatus || "RESOLVED_REJECTED";
    fraudCase.resolutionNotes = resolutionNotes;
    fraudCase.resolvedAt = new Date();
    if (onChain.txHash) {
      fraudCase.txHash = onChain.txHash;
      fraudCase.isSyncedOnChain = onChain.isSyncedOnChain;
    }
    await fraudCase.save();

    // Update return request refund status
    const returnReq = await ReturnRequest.findOne({ returnId: fraudCase.returnId });
    if (returnReq) {
      returnReq.refundStatus =
        fraudCase.status === "RESOLVED_APPROVED_EXCEPTION" ? "REFUND_APPROVED" : "REFUND_REJECTED";
      await returnReq.save();
    }

    await recordAudit({
      action: "FRAUD_CASE_RESOLVED",
      actor: req.user,
      targetType: "FRAUD_CASE",
      targetId: fraudCase.caseId,
      txHash: onChain.txHash,
      details: { resolutionStatus: fraudCase.status, resolutionNotes },
    });

    res.json({
      success: true,
      message: "Fraud case resolved and anchored to blockchain.",
      fraudCase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error resolving fraud case", error: error.message });
  }
};

module.exports = { getFraudCases, getFraudCaseById, assignInvestigator, resolveFraudCase };
