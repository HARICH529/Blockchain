const Order = require("../models/Order");
const Product = require("../models/Product");
const CustodyEvent = require("../models/CustodyEvent");
const blockchainService = require("../services/blockchainService");
const { recordAudit } = require("../services/auditService");
const { ethers } = require("ethers");

const getOrders = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "CUSTOMER") {
      query.customer = req.user._id;
    } else if (req.user.role === "SELLER") {
      query.seller = req.user._id;
    } else if (req.user.role === "COURIER") {
      query.$or = [{ courier: req.user._id }, { status: { $in: ["DISPATCHED", "IN_TRANSIT"] } }];
    } else if (req.user.role === "RETURN_CENTER") {
      const returnOrderIds = await ReturnRequest.find().distinct("orderId");
      query.orderId = { $in: returnOrderIds };
    }

    const orders = await Order.find(query)
      .populate("product")
      .populate("customer", "name email")
      .populate("seller", "name email organization")
      .populate("courier", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching orders", error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ orderId: id })
      .populate("product")
      .populate("customer", "name email")
      .populate("seller", "name email organization")
      .populate("courier", "name email");

    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${id}' not found.` });
    }

    // Role-based data access verification
    if (req.user.role === "CUSTOMER") {
      if (order.customer?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You are only authorized to view your own customer orders.",
        });
      }
    } else if (req.user.role === "SELLER") {
      if (order.seller?._id?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: You are only authorized to view orders for products you sell.",
        });
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching order", error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const { orderId, productId, shippingAddress, courierId } = req.body;
    if (!orderId || !productId) {
      return res.status(400).json({ success: false, message: "orderId and productId are required." });
    }

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ success: false, message: `Product '${productId}' not found.` });
    }

    if (product.status !== "REGISTERED" && product.status !== "ASSIGNED_WAREHOUSE") {
      return res.status(400).json({
        success: false,
        message: `Product is in status '${product.status}' and cannot be assigned to a new order.`,
      });
    }

    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(400).json({ success: false, message: `Order ID '${orderId}' already exists.` });
    }

    const order = new Order({
      orderId,
      product: product._id,
      productId: product.productId,
      customer: req.user._id,
      seller: product.seller,
      courier: courierId || null,
      shippingAddress: shippingAddress || {
        street: "742 Evergreen Terrace",
        city: "Springfield",
        state: "IL",
        postalCode: "62704",
        country: "USA",
      },
      totalAmount: product.price,
      status: "PENDING",
    });

    await order.save();
    product.status = "ASSIGNED_WAREHOUSE";
    await product.save();

    // Log custody transition
    const custodyEvent = new CustodyEvent({
      productId: product.productId,
      orderId: order.orderId,
      eventType: "ASSIGNED_TO_WAREHOUSE",
      actor: req.user._id,
      actorRole: req.user.role,
      location: "Fulfillment Staging Hub",
      notes: `Allocated to customer order ${order.orderId}`,
    });
    await custodyEvent.save();

    await recordAudit({
      action: "ORDER_CREATED",
      actor: req.user,
      targetType: "ORDER",
      targetId: order.orderId,
      details: { productId: product.productId, amount: product.price },
    });

    res.status(201).json({ success: true, message: "Order created successfully", order });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating order", error: error.message });
  }
};

const dispatchOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, courierId } = req.body;

    const order = await Order.findOne({ orderId: id }).populate("product");
    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${id}' not found.` });
    }

    const product = await Product.findOne({ productId: order.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Linked product not found." });
    }

    // Record custody on blockchain
    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.recordCustody(
        product.productId,
        "PRODUCT_DISPATCHED",
        "SELLER",
        location || "Regional Fulfillment Hub",
        ethers.ZeroHash,
        2 // DISPATCHED status code
      );
    } catch (e) {
      console.warn("Blockchain dispatch warning:", e.message);
    }

    order.status = "DISPATCHED";
    order.dispatchedAt = new Date();
    if (courierId) order.courier = courierId;
    await order.save();

    product.status = "DISPATCHED";
    product.txHash = onChain.txHash;
    await product.save();

    const custodyEvent = new CustodyEvent({
      productId: product.productId,
      orderId: order.orderId,
      eventType: "PRODUCT_DISPATCHED",
      actor: req.user._id,
      actorRole: req.user.role,
      location: location || "Fulfillment Hub Dock #4",
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
      notes: "Product dispatched for outbound customer delivery.",
    });
    await custodyEvent.save();

    await recordAudit({
      action: "ORDER_DISPATCHED",
      actor: req.user,
      targetType: "ORDER",
      targetId: order.orderId,
      txHash: onChain.txHash,
      details: { productId: product.productId },
    });

    res.json({ success: true, message: "Order dispatched successfully.", order, product, custodyEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error dispatching order", error: error.message });
  }
};

const confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const { location, signatureProof } = req.body;

    const order = await Order.findOne({ orderId: id }).populate("product");
    if (!order) {
      return res.status(404).json({ success: false, message: `Order '${id}' not found.` });
    }

    const product = await Product.findOne({ productId: order.productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Linked product not found." });
    }

    if (product.status !== "DISPATCHED" && product.status !== "IN_TRANSIT") {
      return res.status(400).json({
        success: false,
        message: `Product is in '${product.status}'. Must be DISPATCHED or IN_TRANSIT to confirm delivery.`,
      });
    }

    const proofHash = ethers.keccak256(
      ethers.toUtf8Bytes(signatureProof || `delivery_proof_${order.orderId}_${Date.now()}`)
    );

    let onChain = { txHash: "", blockNumber: 0, isSyncedOnChain: false };
    try {
      onChain = await blockchainService.recordDelivery(
        product.productId,
        order.orderId,
        location || "Customer Front Porch",
        proofHash,
        req.user.role
      );
    } catch (e) {
      console.warn("Blockchain delivery confirmation notice:", e.message);
    }

    order.status = "DELIVERED";
    order.deliveredAt = new Date();
    await order.save();

    product.status = "DELIVERED";
    product.txHash = onChain.txHash;
    await product.save();

    const custodyEvent = new CustodyEvent({
      productId: product.productId,
      orderId: order.orderId,
      eventType: "DELIVERY_CONFIRMED",
      actor: req.user._id,
      actorRole: req.user.role,
      location: location || "Customer Delivery Address",
      dataHash: proofHash,
      txHash: onChain.txHash,
      blockNumber: onChain.blockNumber,
      isSyncedOnChain: onChain.isSyncedOnChain,
      notes: "Customer signed for package upon delivery.",
    });
    await custodyEvent.save();

    await recordAudit({
      action: "ORDER_DELIVERED",
      actor: req.user,
      targetType: "ORDER",
      targetId: order.orderId,
      txHash: onChain.txHash,
      details: { productId: product.productId },
    });

    res.json({ success: true, message: "Delivery confirmed and recorded on blockchain.", order, product, custodyEvent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error confirming delivery", error: error.message });
  }
};

module.exports = { getOrders, getOrderById, createOrder, dispatchOrder, confirmDelivery };
