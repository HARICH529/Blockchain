const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "DISPATCHED", "IN_TRANSIT", "DELIVERED", "RETURNED"],
      default: "PENDING",
    },
    dispatchedAt: Date,
    deliveredAt: Date,
    txHash: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
