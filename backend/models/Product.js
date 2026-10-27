const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "REGISTERED",
        "ASSIGNED_WAREHOUSE",
        "DISPATCHED",
        "IN_TRANSIT",
        "DELIVERED",
        "RETURN_REQUESTED",
        "RETURN_IN_TRANSIT",
        "RETURN_RECEIVED",
        "RETURN_VERIFIED",
        "RETURN_FLAGGED",
        "REFUNDED",
      ],
      default: "REGISTERED",
    },
    productHash: {
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
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
