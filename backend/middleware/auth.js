const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required. Missing token." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "returnchain_jwt_secret_secure_key_2026_production");

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found or session expired." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "User account is deactivated. Contact admin." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token.", error: error.message });
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    // ADMIN always has platform-wide access
    if (req.user.role === "ADMIN" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
    });
  };
};

module.exports = { authenticate, authorize };
