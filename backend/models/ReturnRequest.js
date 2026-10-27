const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    conditionReported: {
      type: String,
      default: "Used - Defective",
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "PICKED_UP",
        "IN_TRANSIT",
        "RECEIVED_AT_CENTER",
        "INSPECTED",
        "VERIFIED_GENUINE",
        "FLAGGED_SUSPICIOUS",
        "MANUAL_REVIEW",
      ],
      default: "REQUESTED",
    },
    verificationOutcome: {
      type: String,
      enum: ["PENDING", "VERIFIED", "SUSPICIOUS", "MANUAL_REVIEW"],
      default: "PENDING",
    },
    refundStatus: {
      type: String,
      enum: [
        "PENDING_VERIFICATION",
        "REFUND_APPROVED",
        "REFUND_REJECTED",
        "FLAGGED_INVESTIGATION",
        "MANUAL_AUDIT_REQUIRED",
      ],
      default: "PENDING_VERIFICATION",
    },
    physicalInspection: {
      serialNumberScanned: { type: String, default: "" },
      sealIntact: { type: Boolean, default: false },
      conditionMatched: { type: Boolean, default: false },
      packagingIntact: { type: Boolean, default: false },
      inspectorNotes: { type: String, default: "" },
      inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      inspectedAt: Date,
    },
    txHash: {
      type: String,
      default: "",
    },
    blockNumber: {
      type: Number,
      default: 0,
    },
    isSyncedOnChain: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
