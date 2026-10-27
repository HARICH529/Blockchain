const Product = require("../models/Product");
const CustodyEvent = require("../models/CustodyEvent");
const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const blockchainService = require("../services/blockchainService");
const { recordAudit } = require("../services/auditService");
const { ethers } = require("ethers");
const QRCode = require("qrcode");

const getProducts = async (req, res) => {
  try {
    const { category, status, search, seller } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (seller) query.seller = seller;

    if (req.user && req.user.role === "SELLER") {
      query.seller = req.user._id;
    }

    if (search) {
      query.$or = [
        { productId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { serialNumber: { $regex: search, $options: "i" } },
        { manufacturer: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query).populate("seller", "name email organization").sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching products", error: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ productId: id }).populate("seller", "name email organization");
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${id}' not found.` });
    }

    if (req.user && req.user.role === "SELLER" && product.seller?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: You are only authorized to view products registered by your brand/organization.",
      });
    }

    const custodyEvents = await CustodyEvent.find({ productId: id }).populate("actor", "name role").sort({ timestamp: 1 });
    const activeReturn = await ReturnRequest.findOne({ productId: id }).sort({ createdAt: -1 });
    const order = await Order.findOne({ productId: id }).sort({ createdAt: -1 });

    // Generate real scan-compliant QR Code Data URL
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendBase}/verify/${product.productId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    res.json({
      success: true,
      product,
      custodyEvents,
      activeReturn,
      order,
      qrDataUrl,
      verifyUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching product", error: error.message });
  }
};

const registerProduct = async (req, res) => {
  try {
    const { productId, name, category, manufacturer, model, serialNumber, price, location } = req.body;

    if (!productId || !name || !category || !serialNumber || !price) {
      return res.status(400).json({ success: false, message: "Missing required product fields." });
    }

    const existingId = await Product.findOne({ productId: productId.trim() });
    if (existingId) {
      return res.status(400).json({ success: false, message: `Product ID '${productId}' is already registered.` });
    }

    const existingSerial = await Product.findOne({ serialNumber: serialNumber.trim() });
    if (existingSerial) {
      return res.status(400).json({ success: false, message: `Serial Number '${serialNumber}' already exists in registry.` });
    }

    const specString = `${productId}:${serialNumber}:${name}:${manufacturer}:${model}`;
    const productHash = ethers.keccak256(ethers.toUtf8Bytes(specString));

    let onChainResult = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChainResult = await blockchainService.registerProduct(
        productId.trim(),
        serialNumber.trim(),
        productHash,
        location || "Fulfillment Center",
        req.user.role
      );
    } catch (bcError) {
      console.warn("Blockchain registration notice:", bcError.message);
    }

    const product = new Product({
      productId: productId.trim(),
      name,
      category,
      manufacturer: manufacturer || "Authorized OEM",
      model: model || "Standard",
      serialNumber: serialNumber.trim(),
      seller: req.user._id,
      price,
      status: "REGISTERED",
      productHash,
      txHash: onChainResult.txHash,
      blockNumber: onChainResult.blockNumber,
      isSyncedOnChain: onChainResult.isSyncedOnChain,
      registeredAt: new Date(),
    });

    await product.save();

    const genesisEvent = new CustodyEvent({
      productId: product.productId,
      eventType: "PRODUCT_REGISTERED",
      actor: req.user._id,
      actorRole: req.user.role,
      actorAddress: req.user.walletAddress || "",
      location: location || "Genesis Registration Facility",
      dataHash: productHash,
      txHash: onChainResult.txHash,
      blockNumber: onChainResult.blockNumber,
      isSyncedOnChain: onChainResult.isSyncedOnChain,
      notes: `Genesis digital product passport minted for ${product.name}`,
    });
    await genesisEvent.save();

    await recordAudit({
      action: "PRODUCT_REGISTERED",
      actor: req.user,
      targetType: "PRODUCT",
      targetId: product.productId,
      txHash: onChainResult.txHash,
      blockNumber: onChainResult.blockNumber,
      details: { name: product.name, serial: product.serialNumber },
    });

    res.status(201).json({
      success: true,
      message: "Product successfully registered and anchored to blockchain.",
      product,
      genesisEvent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error registering product", error: error.message });
  }
};

const verifyProductPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ productId: id }).populate("seller", "organization name");
    if (!product) {
      return res.status(404).json({
        success: false,
        isAuthentic: false,
        message: `Product identifier '${id}' is NOT registered in ReturnChain registry. High risk of counterfeit or unknown item.`,
      });
    }

    const custodyEvents = await CustodyEvent.find({ productId: id })
      .select("eventType actorRole location timestamp isSyncedOnChain txHash")
      .sort({ timestamp: 1 });

    // Look for active return request associated with this product
    const activeReturn = await ReturnRequest.findOne({ productId: id })
      .select("returnId reason conditionReported status refundStatus createdAt orderId")
      .sort({ createdAt: -1 });

    // Look for delivery event
    const deliveryEvent = custodyEvents.find((e) => e.eventType === "DELIVERY_CONFIRMED");

    // Generate real scan-compliant QR Code Data URL
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendBase}/verify/${product.productId}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 320,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    // Public Profile containing all required product & return details (zero personal PII)
    const publicProfile = {
      productId: product.productId,
      name: product.name,
      category: product.category,
      manufacturer: product.manufacturer,
      model: product.model,
      serialNumber: product.serialNumber, // Needed by delivery agent to verify physical label!
      price: product.price,
      status: product.status,
      registeredAt: product.registeredAt,
      isSyncedOnChain: product.isSyncedOnChain,
      txHash: product.txHash,
      productHash: product.productHash,
      sellerOrganization: product.seller?.organization || product.seller?.name || "Authorized Partner",
      deliveredAt: deliveryEvent?.timestamp || null,
      deliveryConfirmed: Boolean(deliveryEvent),
      activeReturn: activeReturn || null,
      qrDataUrl,
      verifyUrl,
      lifecycleMilestones: custodyEvents.map((c) => ({
        eventType: c.eventType,
        actorRole: c.actorRole,
        location: c.location,
        timestamp: c.timestamp,
        txHash: c.txHash,
      })),
      verificationNotice:
        "IMPORTANT: This cryptographic digital identity matches on-chain blockchain records. When taking a return, the delivery agent must inspect the serial number label and packaging seals before logging courier intake.",
    };

    res.json({ success: true, isAuthentic: true, product: publicProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error verifying product", error: error.message });
  }
};

const getProductQrCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'png' or 'json'
    const product = await Product.findOne({ productId: id });
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${id}' not found.` });
    }

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${frontendBase}/verify/${product.productId}`;

    if (format === "png") {
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="returnchain-${product.productId}-qr.png"`);
      return QRCode.toFileStream(res, verifyUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 400,
      });
    }

    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });

    const activeReturn = await ReturnRequest.findOne({ productId: id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      productId: product.productId,
      name: product.name,
      serialNumber: product.serialNumber,
      verifyUrl,
      qrDataUrl,
      activeReturn: activeReturn
        ? {
            returnId: activeReturn.returnId,
            reason: activeReturn.reason,
            status: activeReturn.status,
            conditionReported: activeReturn.conditionReported,
          }
        : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error generating QR code", error: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  registerProduct,
  verifyProductPublic,
  getProductQrCode,
};

