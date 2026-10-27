const CustodyEvent = require("../models/CustodyEvent");
const Product = require("../models/Product");
const blockchainService = require("../services/blockchainService");
const { recordAudit } = require("../services/auditService");
const { ethers } = require("ethers");

const getProductCustody = async (req, res) => {
  try {
    const { productId } = req.params;
    const events = await CustodyEvent.find({ productId })
      .populate("actor", "name email role")
      .sort({ timestamp: 1 });

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${productId}' not found.` });
    }

    if (req.user && req.user.role === "SELLER" && product.seller?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are only authorized to view custody events for products you sell.",
      });
    }

    res.json({
      success: true,
      productId,
      productName: product?.name || "Product",
      currentStatus: product?.status || "UNKNOWN",
      totalMilestones: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching custody events", error: error.message });
  }
};

const recordCustodyEvent = async (req, res) => {
  try {
    const { productId, eventType, location, notes, newStatusCode } = req.body;

    if (!productId || !eventType) {
      return res.status(400).json({ success: false, message: "productId and eventType are required." });
    }

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${productId}' not found.` });
    }

    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(`${eventType}:${location}:${Date.now()}`));

    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.recordCustody(
        productId,
        eventType,
        req.user.role,
        location || "Regional Transit Facility",
        dataHash,
        typeof newStatusCode === "number" ? newStatusCode : 3 // e.g. IN_TRANSIT
      );
    } catch (bcErr) {
      console.warn("Custody on-chain record notice:", bcErr.message);
    }

    const custodyEvent = new CustodyEvent({
      productId,
      orderId: req.body.orderId || "",
      eventType,
      actor: req.user._id,
      actorRole: req.user.role,
      actorAddress: req.user.walletAddress || "",
      location: location || "Logistics Hub",
      dataHash,
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
      notes: notes || `Custody milestone recorded by ${req.user.role}`,
    });

    await custodyEvent.save();

    await recordAudit({
      action: "CUSTODY_UPDATED",
      actor: req.user,
      targetType: "CUSTODY",
      targetId: productId,
      txHash: onChain.txHash,
      details: { eventType, location },
    });

    res.status(201).json({
      success: true,
      message: "Custody event successfully recorded.",
      custodyEvent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error recording custody event", error: error.message });
  }
};

module.exports = { getProductCustody, recordCustodyEvent };
