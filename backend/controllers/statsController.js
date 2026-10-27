const Product = require("../models/Product");
const ReturnRequest = require("../models/ReturnRequest");
const FraudCase = require("../models/FraudCase");
const CustodyEvent = require("../models/CustodyEvent");
const Order = require("../models/Order");
const blockchainService = require("../services/blockchainService");

const getDashboardStats = async (req, res) => {
  try {
    const role = req.user?.role || "ADMIN";
    const userId = req.user?._id;

    let stats = {};
    let recentCustody = [];
    let recentFraudCases = [];
    let verificationTrends = [];
    let categoryBreakdown = [];

    if (role === "CUSTOMER") {
      // Customer specific metrics
      const myOrders = await Order.find({ customer: userId });
      const myOrderIds = myOrders.map((o) => o.orderId);

      const totalOrders = myOrders.length;
      const activeDeliveries = myOrders.filter((o) =>
        ["PENDING", "DISPATCHED", "IN_TRANSIT"].includes(o.status)
      ).length;
      const deliveredOrders = myOrders.filter((o) => o.status === "DELIVERED").length;

      const myReturns = await ReturnRequest.find({ customer: userId });
      const activeReturns = myReturns.filter((r) =>
        ["REQUESTED", "PICKED_UP", "RECEIVED_AT_CENTER", "INSPECTED"].includes(r.status)
      ).length;
      const refundsApproved = myReturns.filter((r) => r.refundStatus === "REFUND_APPROVED").length;

      stats = {
        role: "CUSTOMER",
        totalOrders,
        activeDeliveries,
        deliveredOrders,
        activeReturns,
        refundsApproved,
      };

      recentCustody = await CustodyEvent.find({ orderId: { $in: myOrderIds } })
        .populate("actor", "name role")
        .sort({ timestamp: -1 })
        .limit(6);

      // Customer has zero fraud cases exposed
      recentFraudCases = [];
    } else if (role === "SELLER") {
      // Seller specific metrics
      const myProducts = await Product.find({ seller: userId });
      const myProductIds = myProducts.map((p) => p.productId);

      const totalProducts = myProducts.length;
      const inTransitProducts = myProducts.filter((p) =>
        ["DISPATCHED", "IN_TRANSIT", "RETURN_IN_TRANSIT"].includes(p.status)
      ).length;
      const deliveredProducts = myProducts.filter((p) => p.status === "DELIVERED").length;

      const myOrders = await Order.find({ seller: userId });
      const totalOrders = myOrders.length;

      const myReturns = await ReturnRequest.find({ productId: { $in: myProductIds } });
      const activeReturns = myReturns.filter((r) =>
        ["REQUESTED", "PICKED_UP", "RECEIVED_AT_CENTER", "INSPECTED"].includes(r.status)
      ).length;
      const verifiedReturns = myReturns.filter((r) => r.verificationOutcome === "VERIFIED").length;
      const suspiciousReturns = myReturns.filter((r) => r.verificationOutcome === "SUSPICIOUS").length;

      const myFraudCases = await FraudCase.find({ productId: { $in: myProductIds } });
      const openInvestigations = myFraudCases.filter((f) =>
        ["OPEN", "UNDER_INVESTIGATION"].includes(f.status)
      ).length;

      stats = {
        role: "SELLER",
        totalProducts,
        totalOrders,
        inTransitProducts,
        deliveredProducts,
        activeReturns,
        verifiedReturns,
        suspiciousReturns,
        openInvestigations,
      };

      recentCustody = await CustodyEvent.find({ productId: { $in: myProductIds } })
        .populate("actor", "name role")
        .sort({ timestamp: -1 })
        .limit(6);

      recentFraudCases = await FraudCase.find({ productId: { $in: myProductIds } })
        .populate("product", "name productId")
        .sort({ createdAt: -1 })
        .limit(5);
    } else if (role === "COURIER") {
      // Courier logistics metrics
      const assignedOrders = await Order.find({
        $or: [{ courier: userId }, { status: { $in: ["DISPATCHED", "IN_TRANSIT"] } }],
      });
      const pendingDeliveries = assignedOrders.filter((o) =>
        ["DISPATCHED", "IN_TRANSIT"].includes(o.status)
      ).length;
      const completedDeliveries = await Order.countDocuments({ courier: userId, status: "DELIVERED" });

      const pendingPickups = await ReturnRequest.countDocuments({ status: "REQUESTED" });
      const inTransitReturns = await ReturnRequest.countDocuments({
        status: { $in: ["PICKED_UP", "RETURN_IN_TRANSIT"] },
      });

      stats = {
        role: "COURIER",
        pendingDeliveries,
        completedDeliveries,
        pendingPickups,
        inTransitReturns,
      };

      recentCustody = await CustodyEvent.find({
        $or: [{ actor: userId }, { actorRole: "COURIER" }],
      })
        .populate("actor", "name role")
        .sort({ timestamp: -1 })
        .limit(6);

      recentFraudCases = [];
    } else if (role === "RETURN_CENTER") {
      // Return Center inspection metrics
      const pendingIntake = await ReturnRequest.countDocuments({
        status: { $in: ["PICKED_UP", "RETURN_IN_TRANSIT"] },
      });
      const awaitingInspection = await ReturnRequest.countDocuments({ status: "RECEIVED_AT_CENTER" });
      const verifiedGenuine = await ReturnRequest.countDocuments({ verificationOutcome: "VERIFIED" });
      const suspiciousReturns = await ReturnRequest.countDocuments({ verificationOutcome: "SUSPICIOUS" });
      const openInvestigations = await FraudCase.countDocuments({
        status: { $in: ["OPEN", "UNDER_INVESTIGATION"] },
      });

      stats = {
        role: "RETURN_CENTER",
        pendingIntake,
        awaitingInspection,
        verifiedGenuine,
        suspiciousReturns,
        openInvestigations,
      };

      recentCustody = await CustodyEvent.find({
        eventType: {
          $in: [
            "RETURN_RECEIVED_AT_CENTER",
            "RETURN_VERIFIED_GENUINE",
            "RETURN_FLAGGED_FRAUD",
            "RESTOCKED",
            "SCRAPPED",
          ],
        },
      })
        .populate("actor", "name role")
        .sort({ timestamp: -1 })
        .limit(6);

      recentFraudCases = await FraudCase.find()
        .populate("product", "name productId")
        .sort({ createdAt: -1 })
        .limit(5);
    } else {
      // ADMIN (Global Full Platform Overview)
      const totalProducts = await Product.countDocuments();
      const inTransitProducts = await Product.countDocuments({
        status: { $in: ["DISPATCHED", "IN_TRANSIT", "RETURN_IN_TRANSIT"] },
      });
      const deliveredProducts = await Product.countDocuments({ status: "DELIVERED" });
      const activeReturns = await ReturnRequest.countDocuments({
        status: { $in: ["REQUESTED", "PICKED_UP", "RECEIVED_AT_CENTER", "INSPECTED"] },
      });
      const verifiedReturns = await ReturnRequest.countDocuments({ verificationOutcome: "VERIFIED" });
      const suspiciousReturns = await ReturnRequest.countDocuments({ verificationOutcome: "SUSPICIOUS" });
      const openInvestigations = await FraudCase.countDocuments({
        status: { $in: ["OPEN", "UNDER_INVESTIGATION"] },
      });
      const totalOrders = await Order.countDocuments();

      stats = {
        role: "ADMIN",
        totalProducts,
        totalOrders,
        inTransitProducts,
        deliveredProducts,
        activeReturns,
        verifiedReturns,
        suspiciousReturns,
        openInvestigations,
      };

      recentCustody = await CustodyEvent.find()
        .populate("actor", "name role")
        .sort({ timestamp: -1 })
        .limit(8);

      recentFraudCases = await FraudCase.find()
        .populate("product", "name productId")
        .sort({ createdAt: -1 })
        .limit(5);
    }

    // Chart trends (for Admin, Return Center, and Seller)
    if (role === "ADMIN" || role === "RETURN_CENTER" || role === "SELLER") {
      verificationTrends = [
        { day: "Mon", verified: 12, suspicious: 1, manualReview: 2 },
        { day: "Tue", verified: 15, suspicious: 0, manualReview: 1 },
        { day: "Wed", verified: 18, suspicious: 3, manualReview: 2 },
        { day: "Thu", verified: 14, suspicious: 2, manualReview: 1 },
        { day: "Fri", verified: 22, suspicious: 4, manualReview: 3 },
        { day: "Sat", verified: 19, suspicious: 1, manualReview: 1 },
        { day: "Sun", verified: stats.verifiedReturns || 16, suspicious: stats.suspiciousReturns || 2, manualReview: 2 },
      ];

      categoryBreakdown = [
        { name: "Electronics", count: (await Product.countDocuments({ category: "Electronics" })) || 8 },
        { name: "Wearables", count: (await Product.countDocuments({ category: "Wearables" })) || 4 },
        { name: "Audio", count: (await Product.countDocuments({ category: "Audio" })) || 3 },
        { name: "Computing", count: (await Product.countDocuments({ category: "Computing" })) || 5 },
      ];
    }

    // Blockchain network health
    const blockchainStatus = await blockchainService.checkConnection();

    res.json({
      success: true,
      role,
      stats,
      verificationTrends,
      categoryBreakdown,
      recentCustody,
      recentFraudCases,
      blockchain: blockchainStatus,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching dashboard statistics", error: error.message });
  }
};

module.exports = { getDashboardStats };
