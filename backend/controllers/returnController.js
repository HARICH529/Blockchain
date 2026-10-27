const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const Product = require("../models/Product");
const CustodyEvent = require("../models/CustodyEvent");
const blockchainService = require("../services/blockchainService");
const { recordAudit } = require("../services/auditService");
const { ethers } = require("ethers");

const getReturns = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "CUSTOMER") {
      query.customer = req.user._id;
    } else if (req.user.role === "SELLER") {
      const myProductIds = await Product.find({ seller: req.user._id }).distinct("productId");
      query.productId = { $in: myProductIds };
    } else if (req.user.role === "COURIER") {
      query.status = { $in: ["REQUESTED", "PICKED_UP", "RETURN_IN_TRANSIT"] };
    } else if (req.user.role === "RETURN_CENTER") {
      query.status = {
        $in: [
          "PICKED_UP",
          "RETURN_IN_TRANSIT",
          "RECEIVED_AT_CENTER",
          "INSPECTED",
          "VERIFIED_GENUINE",
          "FLAGGED_SUSPICIOUS",
          "RESTOCKED",
          "RETURNED_TO_CUSTOMER",
        ],
      };
    }

    const returns = await ReturnRequest.find(query)
      .populate("product")
      .populate("order")
      .populate("customer", "name email")
      .populate("physicalInspection.inspectedBy", "name role")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: returns.length, returns });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching returns", error: error.message });
  }
};

const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const returnReq = await ReturnRequest.findOne({ returnId: id })
      .populate("product")
      .populate("order")
      .populate("customer", "name email")
      .populate("physicalInspection.inspectedBy", "name role");

    if (!returnReq) {
      return res.status(404).json({ success: false, message: `Return request '${id}' not found.` });
    }

    // Role-based data access verification
    if (req.user.role === "CUSTOMER") {
      if (returnReq.customer?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You are only authorized to view your own return requests.",
        });
      }
    } else if (req.user.role === "SELLER") {
      const product = await Product.findOne({ productId: returnReq.productId });
      if (!product || product.seller?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You are only authorized to view returns for products you sell.",
        });
      }
    }

    res.json({ success: true, returnRequest: returnReq });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching return request", error: error.message });
  }
};

const createReturn = async (req, res) => {
  try {
    const { returnId, orderId, reason, conditionReported } = req.body;
    if (!returnId || !orderId || !reason) {
      return res.status(400).json({ success: false, message: "returnId, orderId, and reason are required." });
    }

    const order = await Order.findOne({ orderId }).populate("product");
    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${orderId}' not found.` });
    }

    const product = await Product.findOne({ productId: order.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Linked product not found." });
    }

    // Product MUST be DELIVERED to request a return
    if (product.status !== "DELIVERED") {
      return res.status(400).json({
        success: false,
        message: `Product is in '${product.status}' state. Items can only be returned after successful delivery.`,
      });
    }

    // Check duplicate return
    const existing = await ReturnRequest.findOne({ returnId });
    if (existing) {
      return res.status(400).json({ success: false, message: `Return ID '${returnId}' already exists.` });
    }

    // Check existing active return for this product
    const priorReturn = await ReturnRequest.findOne({
      productId: product.productId,
      status: { $in: ["REQUESTED", "PICKED_UP", "RECEIVED_AT_CENTER", "VERIFIED_GENUINE"] },
    });
    if (priorReturn) {
      return res.status(400).json({
        success: false,
        message: `An active or completed return (${priorReturn.returnId}) already exists for this product.`,
      });
    }

    // Record on blockchain
    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.createReturn(
        returnId,
        product.productId,
        order.orderId,
        reason,
        req.user.role
      );
    } catch (e) {
      console.warn("Blockchain return creation notice:", e.message);
    }

    const returnReq = new ReturnRequest({
      returnId,
      order: order._id,
      orderId: order.orderId,
      product: product._id,
      productId: product.productId,
      customer: req.user._id,
      reason,
      conditionReported: conditionReported || "Defective / Mismatch",
      status: "REQUESTED",
      verificationOutcome: "PENDING",
      refundStatus: "PENDING_VERIFICATION",
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
    });

    await returnReq.save();

    product.status = "RETURN_REQUESTED";
    await product.save();

    const custodyEvent = new CustodyEvent({
      productId: product.productId,
      orderId: order.orderId,
      eventType: "RETURN_REQUESTED",
      actor: req.user._id,
      actorRole: req.user.role,
      location: "Customer Residence",
      dataHash: ethers.keccak256(ethers.toUtf8Bytes(`${returnId}:${reason}`)),
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
      notes: `Customer return initiated: ${reason}`,
    });
    await custodyEvent.save();

    await recordAudit({
      action: "RETURN_REQUESTED",
      actor: req.user,
      targetType: "RETURN",
      targetId: returnId,
      txHash: onChain.txHash,
      details: { productId: product.productId, orderId: order.orderId, reason },
    });

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully.",
      returnRequest: returnReq,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating return request", error: error.message });
  }
};

/**
 * Delivery Agent / Courier records physical pickup of return parcel from customer
 */
const pickupReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, notes } = req.body;

    const returnReq = await ReturnRequest.findOne({ returnId: id }).populate("product");
    if (!returnReq) {
      return res.status(404).json({ success: false, message: `Return '${id}' not found.` });
    }

    const product = await Product.findOne({ productId: returnReq.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Linked product not found." });
    }

    const pickupHash = ethers.keccak256(
      ethers.toUtf8Bytes(`pickup_${returnReq.returnId}_${Date.now()}`)
    );

    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.recordCustody(
        returnReq.productId,
        "RETURN_COURIER_PICKUP",
        "COURIER",
        location || "Customer Doorstep Pickup Hub",
        pickupHash,
        6 // RETURN_IN_TRANSIT
      );
    } catch (e) {
      console.warn("Blockchain return pickup notice:", e.message);
    }

    returnReq.status = "PICKED_UP";
    await returnReq.save();

    product.status = "RETURN_IN_TRANSIT";
    await product.save();

    const custodyEvent = new CustodyEvent({
      productId: product.productId,
      orderId: returnReq.orderId,
      eventType: "RETURN_COURIER_PICKUP",
      actor: req.user._id,
      actorRole: req.user.role,
      location: location || "Customer Doorstep Pickup",
      dataHash: pickupHash,
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
      notes: notes || "Courier scanned QR code and collected physical return package.",
    });
    await custodyEvent.save();

    await recordAudit({
      action: "RETURN_PICKUP_RECORDED",
      actor: req.user,
      targetType: "RETURN",
      targetId: returnReq.returnId,
      txHash: onChain.txHash,
      details: { productId: product.productId, location },
    });

    res.json({
      success: true,
      message: "Return package pickup recorded by delivery agent.",
      returnRequest: returnReq,
      product,
      custodyEvent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error recording return pickup", error: error.message });
  }
};

const receiveReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, intakeNotes } = req.body;

    const returnReq = await ReturnRequest.findOne({ returnId: id }).populate("product");
    if (!returnReq) {
      return res.status(404).json({ success: false, message: `Return '${id}' not found.` });
    }

    const product = await Product.findOne({ productId: returnReq.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Linked product not found." });
    }

    const receiptHash = ethers.keccak256(
      ethers.toUtf8Bytes(`intake_${returnReq.returnId}_${Date.now()}`)
    );

    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.recordReturnReceipt(
        returnReq.returnId,
        location || "Return Processing Center",
        receiptHash,
        req.user.role
      );
    } catch (e) {
      console.warn("Blockchain return receipt notice:", e.message);
    }

    returnReq.status = "RECEIVED_AT_CENTER";
    await returnReq.save();

    product.status = "RETURN_RECEIVED";
    await product.save();

    const custodyEvent = new CustodyEvent({
      productId: product.productId,
      orderId: returnReq.orderId,
      eventType: "RETURN_RECEIVED_AT_CENTER",
      actor: req.user._id,
      actorRole: req.user.role,
      location: location || "Return Processing Hub Intake Bay",
      dataHash: receiptHash,
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
      notes: intakeNotes || "Return parcel received and checked in at processing center.",
    });
    await custodyEvent.save();

    await recordAudit({
      action: "RETURN_RECEIVED",
      actor: req.user,
      targetType: "RETURN",
      targetId: returnReq.returnId,
      txHash: onChain.txHash,
      details: { productId: product.productId },
    });

    res.json({
      success: true,
      message: "Return package checked in at Return Center.",
      returnRequest: returnReq,
      product,
      custodyEvent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error recording return intake", error: error.message });
  }
};

const updateRefundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundStatus, notes } = req.body;

    const returnReq = await ReturnRequest.findOne({ returnId: id }).populate("product");
    if (!returnReq) {
      return res.status(404).json({ success: false, message: `Return '${id}' not found.` });
    }

    returnReq.refundStatus = refundStatus;
    if (refundStatus === "REFUND_APPROVED") {
      const product = await Product.findOne({ productId: returnReq.productId });
      if (product) {
        product.status = "REFUNDED";
        await product.save();
      }
    }
    await returnReq.save();

    await recordAudit({
      action: "REFUND_STATUS_UPDATED",
      actor: req.user,
      targetType: "RETURN",
      targetId: returnReq.returnId,
      details: { refundStatus, notes },
    });

    res.json({ success: true, message: `Refund workflow updated to ${refundStatus}`, returnRequest: returnReq });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating refund status", error: error.message });
  }
};

module.exports = { getReturns, getReturnById, createReturn, pickupReturn, receiveReturn, updateRefundStatus };
