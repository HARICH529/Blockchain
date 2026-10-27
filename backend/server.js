const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const custodyRoutes = require("./routes/custodyRoutes");
const returnRoutes = require("./routes/returnRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const fraudRoutes = require("./routes/fraudRoutes");
const auditRoutes = require("./routes/auditRoutes");
const userRoutes = require("./routes/userRoutes");
const statsRoutes = require("./routes/statsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// Health & Status
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "ReturnChain Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/custody", custodyRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/fraud", fraudRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/users", userRoutes);
app.use("/api/stats", statsRoutes);

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Start server
if (process.env.NODE_ENV !== "test") {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`>>> ReturnChain API Server running on port ${PORT}`);
        console.log(`>>> Health check: http://localhost:${PORT}/api/health`);
        console.log(`====================================================`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to MongoDB. Server not started:", err.message);
    });
}

module.exports = app;
