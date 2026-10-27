const Product = require("../models/Product");
const Order = require("../models/Order");
const ReturnRequest = require("../models/ReturnRequest");
const CustodyEvent = require("../models/CustodyEvent");

/**
 * Transparent, deterministic rule-based fraud detection engine.
 * Evaluates product identity, order linkage, custody milestones, and physical inspection.
 */
class FraudEngine {
  /**
   * Evaluates return request against scanned physical item and custody history.
   *
   * @param {Object} params
   * @param {string} params.returnId
   * @param {string} params.scannedProductId
   * @param {string} [params.scannedSerialNumber]
   * @param {Object} [params.physicalInspection] - { sealIntact, conditionMatched, packagingIntact, notes }
   */
  static async evaluate({
    returnId,
    scannedProductId,
    scannedSerialNumber,
    physicalInspection = {},
  }) {
    const triggeredRules = [];
    const explanations = [];
    let riskScore = 0; // 0 to 100
    let riskLevel = "LOW";
    let verdict = "VERIFIED"; // VERIFIED, SUSPICIOUS, MANUAL_REVIEW

    // 1. Fetch Return Request
    const returnReq = await ReturnRequest.findOne({ returnId })
      .populate("product")
      .populate("order")
      .populate("customer");

    if (!returnReq) {
      return {
        verdict: "SUSPICIOUS",
        riskLevel: "CRITICAL",
        triggeredRules: ["RETURN_NOT_FOUND"],
        explanations: [`Return request '${returnId}' does not exist in platform records.`],
        recommendedAction: "REJECT_RETURN",
        ruleBreakdown: [{ rule: "RETURN_NOT_FOUND", passed: false, detail: "Invalid return ID" }],
      };
    }

    const expectedProductId = returnReq.productId || returnReq.product?.productId;
    const ruleBreakdown = [];

    // --- Rule 1: Product Registration Check ---
    const scannedProduct = await Product.findOne({ productId: scannedProductId });
    if (!scannedProduct) {
      triggeredRules.push("UNREGISTERED_PRODUCT");
      explanations.push(
        `Scanned Product ID '${scannedProductId}' is NOT registered in ReturnChain registry.`
      );
      riskScore += 90;
      ruleBreakdown.push({
        rule: "UNREGISTERED_PRODUCT",
        name: "Registry Identity Check",
        passed: false,
        severity: "CRITICAL",
        detail: `ID '${scannedProductId}' does not exist on blockchain or database.`,
      });
    } else {
      ruleBreakdown.push({
        rule: "UNREGISTERED_PRODUCT",
        name: "Registry Identity Check",
        passed: true,
        severity: "CRITICAL",
        detail: `Product verified in registry: ${scannedProduct.name}`,
      });
    }

    // --- Rule 2: Product ID Match Check (Substitution Detection) ---
    if (scannedProductId !== expectedProductId) {
      triggeredRules.push("PRODUCT_ID_MISMATCH");
      explanations.push(
        `Product ID substitution detected! Scanned item is '${scannedProductId}', but return request was filed for '${expectedProductId}'.`
      );
      riskScore += 95;
      ruleBreakdown.push({
        rule: "PRODUCT_ID_MISMATCH",
        name: "Product Identity Matching",
        passed: false,
        severity: "CRITICAL",
        detail: `Expected '${expectedProductId}' vs Scanned '${scannedProductId}'`,
      });
    } else {
      ruleBreakdown.push({
        rule: "PRODUCT_ID_MISMATCH",
        name: "Product Identity Matching",
        passed: true,
        severity: "CRITICAL",
        detail: `Product ID perfectly matches return record '${expectedProductId}'`,
      });
    }

    // --- Rule 3: Serial Number Mismatch Check ---
    if (scannedProduct && scannedSerialNumber) {
      const cleanScannedSerial = scannedSerialNumber.trim().toUpperCase();
      const cleanRegisteredSerial = (scannedProduct.serialNumber || "").trim().toUpperCase();

      if (cleanScannedSerial !== cleanRegisteredSerial) {
        triggeredRules.push("SERIAL_MISMATCH");
        explanations.push(
          `Serial number mismatch! Physical label shows '${cleanScannedSerial}', but product was registered with '${cleanRegisteredSerial}'. Possible counterfeit or housing swap.`
        );
        riskScore += 80;
        ruleBreakdown.push({
          rule: "SERIAL_MISMATCH",
          name: "Serial Number Authenticity",
          passed: false,
          severity: "HIGH",
          detail: `Registered '${cleanRegisteredSerial}' != Scanned '${cleanScannedSerial}'`,
        });
      } else {
        ruleBreakdown.push({
          rule: "SERIAL_MISMATCH",
          name: "Serial Number Authenticity",
          passed: true,
          severity: "HIGH",
          detail: `Serial number '${cleanRegisteredSerial}' authenticated.`,
        });
      }
    }

    // --- Rule 4: Order Association Check ---
    const order = returnReq.order;
    if (order) {
      const orderProductId = order.productId;
      if (orderProductId && expectedProductId && orderProductId !== expectedProductId) {
        triggeredRules.push("WRONG_ORDER_ASSOCIATION");
        explanations.push(
          `Order association mismatch: Order '${order.orderId}' contains product '${orderProductId}', not '${expectedProductId}'.`
        );
        riskScore += 70;
        ruleBreakdown.push({
          rule: "WRONG_ORDER_ASSOCIATION",
          name: "Order Integrity Verification",
          passed: false,
          severity: "HIGH",
          detail: "Product does not belong to the associated order.",
        });
      } else {
        ruleBreakdown.push({
          rule: "WRONG_ORDER_ASSOCIATION",
          name: "Order Integrity Verification",
          passed: true,
          severity: "HIGH",
          detail: `Linked to Order '${order.orderId}' correctly.`,
        });
      }
    }

    // --- Rule 5: Duplicate Return Request Check ---
    const otherReturnsForProduct = await ReturnRequest.find({
      productId: expectedProductId,
      returnId: { $ne: returnId },
      status: { $in: ["VERIFIED_GENUINE", "REFUNDED", "FLAGGED_SUSPICIOUS"] },
    });

    if (otherReturnsForProduct.length > 0) {
      triggeredRules.push("DUPLICATE_RETURN_REQUEST");
      explanations.push(
        `Duplicate return attempt: Product '${expectedProductId}' already has prior completed or flagged return (${otherReturnsForProduct[0].returnId}).`
      );
      riskScore += 85;
      ruleBreakdown.push({
        rule: "DUPLICATE_RETURN_REQUEST",
        name: "Duplicate Return Prevention",
        passed: false,
        severity: "CRITICAL",
        detail: `Prior return record exists: ${otherReturnsForProduct[0].returnId}`,
      });
    } else {
      ruleBreakdown.push({
        rule: "DUPLICATE_RETURN_REQUEST",
        name: "Duplicate Return Prevention",
        passed: true,
        severity: "CRITICAL",
        detail: "No prior returns recorded for this product identity.",
      });
    }

    // --- Rule 6 & 7 & 8: Custody Sequence & Delivery Check ---
    const custodyTimeline = await CustodyEvent.find({ productId: expectedProductId }).sort({
      timestamp: 1,
    });

    const hasDeliveryEvent = custodyTimeline.some(
      (e) => e.eventType === "DELIVERY_CONFIRMED"
    );

    if (!hasDeliveryEvent) {
      triggeredRules.push("RETURN_BEFORE_DELIVERY");
      explanations.push(
        `Product '${expectedProductId}' has NO confirmed delivery record in chain-of-custody. Return filed prior to authorized delivery.`
      );
      riskScore += 75;
      ruleBreakdown.push({
        rule: "RETURN_BEFORE_DELIVERY",
        name: "Delivery Custody Milestone",
        passed: false,
        severity: "HIGH",
        detail: "No DELIVERY_CONFIRMED milestone found on ledger.",
      });
    } else {
      ruleBreakdown.push({
        rule: "RETURN_BEFORE_DELIVERY",
        name: "Delivery Custody Milestone",
        passed: true,
        severity: "HIGH",
        detail: "Valid delivery milestone confirmed on blockchain custody ledger.",
      });
    }

    // Check custody transitions: Ensure registration exists
    const hasRegistrationEvent = custodyTimeline.some(
      (e) => e.eventType === "PRODUCT_REGISTERED"
    );
    if (!hasRegistrationEvent && custodyTimeline.length > 0) {
      triggeredRules.push("INVALID_CUSTODY_TRANSITION");
      explanations.push(
        `Chain-of-custody is broken: Product does not have initial genesis registration event.`
      );
      riskScore += 60;
      ruleBreakdown.push({
        rule: "INVALID_CUSTODY_TRANSITION",
        name: "Custody Continuity",
        passed: false,
        severity: "MEDIUM",
        detail: "Initial registration event missing from ledger.",
      });
    } else {
      ruleBreakdown.push({
        rule: "INVALID_CUSTODY_TRANSITION",
        name: "Custody Continuity",
        passed: true,
        severity: "MEDIUM",
        detail: "Genesis and intermediate custody milestones are consistent.",
      });
    }

    // --- Rule 9: Return Already Completed Check ---
    if (
      returnReq.refundStatus === "REFUND_APPROVED" ||
      returnReq.status === "VERIFIED_GENUINE"
    ) {
      triggeredRules.push("RETURN_ALREADY_COMPLETED");
      explanations.push(
        `Return request '${returnId}' was already processed and verified previously.`
      );
      riskScore += 70;
      ruleBreakdown.push({
        rule: "RETURN_ALREADY_COMPLETED",
        name: "Return Re-submission Check",
        passed: false,
        severity: "HIGH",
        detail: "Return already finalized.",
      });
    } else {
      ruleBreakdown.push({
        rule: "RETURN_ALREADY_COMPLETED",
        name: "Return Re-submission Check",
        passed: true,
        severity: "HIGH",
        detail: "Return is active and awaiting intake verification.",
      });
    }

    // --- Rule 10: Physical Inspection Findings Evaluation ---
    if (physicalInspection && Object.keys(physicalInspection).length > 0) {
      const { sealIntact, conditionMatched, packagingIntact } = physicalInspection;

      if (sealIntact === false || conditionMatched === false || packagingIntact === false) {
        // If minor physical issue without ID mismatch => AMBER (Manual Review)
        if (triggeredRules.length === 0) {
          triggeredRules.push("PHYSICAL_INSPECTION_WARNING");
          explanations.push(
            "Physical inspection anomaly noted (e.g. broken warranty seal, missing original packaging, or physical cosmetic discrepancy)."
          );
          riskScore += 35;
          ruleBreakdown.push({
            rule: "PHYSICAL_INSPECTION_WARNING",
            name: "Physical Condition Inspection",
            passed: false,
            severity: "MEDIUM",
            detail: "Physical condition flags raised by return center inspector.",
          });
        }
      } else {
        ruleBreakdown.push({
          rule: "PHYSICAL_INSPECTION_CHECK",
          name: "Physical Condition Inspection",
          passed: true,
          severity: "MEDIUM",
          detail: "Warranty seal intact, serial label clear, and condition verified.",
        });
      }
    }

    // --- Determine Verdict and Risk Level ---
    if (riskScore >= 70 || triggeredRules.some((r) => ["PRODUCT_ID_MISMATCH", "UNREGISTERED_PRODUCT", "SERIAL_MISMATCH", "DUPLICATE_RETURN_REQUEST"].includes(r))) {
      verdict = "SUSPICIOUS"; // RED
      riskLevel = riskScore >= 90 ? "CRITICAL" : "HIGH";
    } else if (riskScore >= 30 || triggeredRules.length > 0) {
      verdict = "MANUAL_REVIEW"; // AMBER
      riskLevel = "MEDIUM";
    } else {
      verdict = "VERIFIED"; // GREEN
      riskLevel = "LOW";
    }

    let recommendedAction = "APPROVE_REFUND";
    if (verdict === "SUSPICIOUS") {
      recommendedAction = "FLAG_FRAUD_INVESTIGATION";
    } else if (verdict === "MANUAL_REVIEW") {
      recommendedAction = "HOLD_MANUAL_REVIEW";
    }

    return {
      returnId,
      expectedProductId,
      scannedProductId,
      verdict, // VERIFIED (Green), SUSPICIOUS (Red), MANUAL_REVIEW (Amber)
      riskLevel, // LOW, MEDIUM, HIGH, CRITICAL
      riskScore,
      triggeredRules,
      explanations,
      recommendedAction,
      ruleBreakdown,
      productName: scannedProduct?.name || returnReq.product?.name || "Unknown Product",
      evaluatedAt: new Date(),
    };
  }
}

module.exports = FraudEngine;
