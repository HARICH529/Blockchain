const ReturnRequest = require("../models/ReturnRequest");
const Product = require("../models/Product");
const FraudCase = require("../models/FraudCase");
const CustodyEvent = require("../models/CustodyEvent");
const FraudEngine = require("../services/fraudEngine");
const blockchainService = require("../services/blockchainService");
const { recordAudit } = require("../services/auditService");
const { ethers } = require("ethers");

/**
 * Executes Return Verification Workflow
 * Evaluates scanned identity, order association, custody integrity, and physical condition.
 */
const verifyReturnItem = async (req, res) => {
  try {
    const {
      returnId,
      scannedProductId,
      scannedSerialNumber,
      physicalInspection = {},
    } = req.body;

    if (!returnId || !scannedProductId) {
      return res.status(400).json({
        success: false,
        message: "returnId and scannedProductId are required for verification.",
      });
    }

    const returnReq = await ReturnRequest.findOne({ returnId })
      .populate("product")
      .populate("order");

    if (!returnReq) {
      return res.status(404).json({ success: false, message: `Return request '${returnId}' not found.` });
    }

    // 1. Run deterministic rule-based evaluation engine
    const evaluation = await FraudEngine.evaluate({
      returnId,
      scannedProductId: scannedProductId.trim(),
      scannedSerialNumber: scannedSerialNumber ? scannedSerialNumber.trim() : "",
      physicalInspection,
    });

    const inspectionNotesHash = ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({
          scannedProductId,
          scannedSerialNumber,
          verdict: evaluation.verdict,
          rules: evaluation.triggeredRules,
          inspection: physicalInspection,
        })
      )
    );

    // 2. Map evaluation verdict to smart contract outcome code
    // 0 = PENDING, 1 = VERIFIED, 2 = SUSPICIOUS, 3 = MANUAL_REVIEW
    let outcomeCode = 1;
    if (evaluation.verdict === "SUSPICIOUS") outcomeCode = 2;
    if (evaluation.verdict === "MANUAL_REVIEW") outcomeCode = 3;

    // 3. Record verification outcome on blockchain
    let onChainVerify = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChainVerify = await blockchainService.verifyReturn(
        returnId,
        outcomeCode,
        inspectionNotesHash,
        req.user.role
      );
    } catch (bcErr) {
      console.warn("Blockchain verifyReturn notice:", bcErr.message);
    }

    // 4. Update Return Request record
    returnReq.verificationOutcome = evaluation.verdict;
    returnReq.status =
      evaluation.verdict === "VERIFIED"
        ? "VERIFIED_GENUINE"
        : evaluation.verdict === "SUSPICIOUS"
        ? "FLAGGED_SUSPICIOUS"
        : "MANUAL_REVIEW";

    returnReq.refundStatus =
      evaluation.verdict === "VERIFIED"
        ? "REFUND_APPROVED"
        : evaluation.verdict === "SUSPICIOUS"
        ? "FLAGGED_INVESTIGATION"
        : "MANUAL_AUDIT_REQUIRED";

    returnReq.physicalInspection = {
      serialNumberScanned: scannedSerialNumber || "",
      sealIntact: Boolean(physicalInspection.sealIntact),
      conditionMatched: Boolean(physicalInspection.conditionMatched),
      packagingIntact: Boolean(physicalInspection.packagingIntact),
      inspectorNotes: physicalInspection.notes || "",
      inspectedBy: req.user._id,
      inspectedAt: new Date(),
    };

    returnReq.txHash = onChainVerify.txHash;
    returnReq.blockNumber = onChainVerify.blockNumber;
    returnReq.isSyncedOnChain = onChainVerify.isSyncedOnChain;
    await returnReq.save();

    // 5. Update Product status
    const product = await Product.findOne({ productId: returnReq.productId });
    if (product) {
      product.status =
        evaluation.verdict === "VERIFIED"
          ? "RETURN_VERIFIED"
          : evaluation.verdict === "SUSPICIOUS"
          ? "RETURN_FLAGGED"
          : product.status;
      await product.save();
    }

    // 6. Record custody event
    const eventType =
      evaluation.verdict === "VERIFIED"
        ? "RETURN_VERIFIED_GENUINE"
        : evaluation.verdict === "SUSPICIOUS"
        ? "RETURN_FLAGGED_SUSPICIOUS"
        : "RETURN_HELD_FOR_MANUAL_REVIEW";

    const custodyEvent = new CustodyEvent({
      productId: returnReq.productId,
      orderId: returnReq.orderId,
      eventType,
      actor: req.user._id,
      actorRole: req.user.role,
      location: "Return Center Inspection Bay #3",
      dataHash: inspectionNotesHash,
      txHash: onChainVerify.txHash,
      blockNumber: onChainVerify.blockNumber,
      isSyncedOnChain: onChainVerify.isSyncedOnChain,
      notes: `Verdict: ${evaluation.verdict}. ${evaluation.explanations.join(" ")}`,
    });
    await custodyEvent.save();

    // 7. If SUSPICIOUS, automatically create FraudCase and flag on blockchain!
    let fraudCase = null;
    if (evaluation.verdict === "SUSPICIOUS") {
      const caseId = `RC-CASE-${Date.now().toString().slice(-4)}`;
      const triggeredRuleStr = evaluation.triggeredRules.join(", ");
      const riskLevelCode = evaluation.riskLevel === "CRITICAL" ? 3 : 2;

      let onChainFraud = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
      try {
        onChainFraud = await blockchainService.flagFraud(
          caseId,
          returnId,
          returnReq.productId,
          triggeredRuleStr,
          riskLevelCode,
          evaluation.explanations.join("; "),
          req.user.role
        );
      } catch (bcFraudErr) {
        console.warn("Blockchain flagFraud notice:", bcFraudErr.message);
      }

      fraudCase = new FraudCase({
        caseId,
        returnRequest: returnReq._id,
        returnId,
        product: product?._id,
        productId: returnReq.productId,
        triggeredRules: evaluation.triggeredRules,
        riskLevel: evaluation.riskLevel,
        explanation: evaluation.explanations.join("\n"),
        evidenceReferences: [
          `Scanned Product: ${scannedProductId}`,
          `Expected Product: ${returnReq.productId}`,
          `Scanned Serial: ${scannedSerialNumber || "N/A"}`,
          `Inspector: ${req.user.name} (${req.user.role})`,
        ],
        status: "OPEN",
        txHash: onChainFraud.txHash || onChainVerify.txHash,
        blockNumber: onChainFraud.blockNumber || onChainVerify.blockNumber,
        isSyncedOnChain: onChainFraud.isSyncedOnChain || onChainVerify.isSyncedOnChain,
      });

      await fraudCase.save();

      await recordAudit({
        action: "FRAUD_CASE_FLAGGED",
        actor: req.user,
        targetType: "FRAUD_CASE",
        targetId: caseId,
        txHash: fraudCase.txHash,
        details: { rules: evaluation.triggeredRules, riskLevel: evaluation.riskLevel },
      });
    }

    await recordAudit({
      action: "RETURN_VERIFIED",
      actor: req.user,
      targetType: "RETURN",
      targetId: returnId,
      txHash: onChainVerify.txHash,
      details: { verdict: evaluation.verdict, riskLevel: evaluation.riskLevel },
    });

    res.json({
      success: true,
      message: `Inspection complete. Verdict: ${evaluation.verdict}`,
      verdict: evaluation.verdict, // VERIFIED (GREEN), SUSPICIOUS (RED), MANUAL_REVIEW (AMBER)
      riskLevel: evaluation.riskLevel,
      riskScore: evaluation.riskScore,
      triggeredRules: evaluation.triggeredRules,
      explanations: evaluation.explanations,
      ruleBreakdown: evaluation.ruleBreakdown,
      recommendedAction: evaluation.recommendedAction,
      txHash: onChainVerify.txHash,
      blockNumber: onChainVerify.blockNumber,
      isSyncedOnChain: onChainVerify.isSyncedOnChain,
      returnRequest: returnReq,
      fraudCase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error executing return verification", error: error.message });
  }
};

module.exports = { verifyReturnItem };
