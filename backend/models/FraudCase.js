const mongoose = require("mongoose");

const fraudCaseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReturnRequest",
    },
    returnId: {
      type: String,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    productId: {
      type: String,
      required: true,
    },
    triggeredRules: [
      {
        type: String,
        required: true,
      },
    ],
    riskLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },
    explanation: {
      type: String,
      required: true,
    },
    evidenceReferences: [String],
    status: {
      type: String,
      enum: ["OPEN", "UNDER_INVESTIGATION", "RESOLVED_REJECTED", "RESOLVED_APPROVED_EXCEPTION"],
      default: "OPEN",
    },
    assignedInvestigator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
    resolvedAt: Date,
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

module.exports = mongoose.model("FraudCase", fraudCaseSchema);
