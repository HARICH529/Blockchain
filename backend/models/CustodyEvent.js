const mongoose = require("mongoose");

const custodyEventSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      default: "",
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "PRODUCT_REGISTERED",
        "ASSIGNED_TO_WAREHOUSE",
        "PRODUCT_DISPATCHED",
        "COURIER_PICKUP",
        "IN_TRANSIT",
        "DELIVERY_CONFIRMED",
        "RETURN_REQUESTED",
        "RETURN_COURIER_PICKUP",
        "RETURN_RECEIVED_AT_CENTER",
        "PHYSICAL_INSPECTION",
        "RETURN_VERIFIED_GENUINE",
        "RETURN_FLAGGED_SUSPICIOUS",
        "RETURN_HELD_FOR_MANUAL_REVIEW",
        "FRAUD_CASE_FLAGGED",
        "FRAUD_CASE_RESOLVED",
      ],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actorRole: {
      type: String,
      enum: ["SELLER", "COURIER", "RETURN_CENTER", "ADMIN", "CUSTOMER", "SYSTEM"],
      required: true,
    },
    actorAddress: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "HQ",
    },
    dataHash: {
      type: String,
      default: "",
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
    notes: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustodyEvent", custodyEventSchema);
