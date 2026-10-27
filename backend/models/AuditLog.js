const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    auditId: {
      type: String,
      required: true,
      unique: true,
    },
    action: {
      type: String,
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actorName: {
      type: String,
      default: "System",
    },
    actorRole: {
      type: String,
      default: "SYSTEM",
    },
    actorAddress: {
      type: String,
      default: "",
    },
    targetType: {
      type: String,
      enum: ["PRODUCT", "CUSTODY", "RETURN", "FRAUD_CASE", "USER", "ROLE", "ORDER", "SYSTEM"],
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      default: "",
    },
    blockNumber: {
      type: Number,
      default: 0,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "WARNING"],
      default: "SUCCESS",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
