const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { recordAudit } = require("../services/auditService");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET || "returnchain_jwt_secret_secure_key_2026_production",
    { expiresIn: "7d" }
  );
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated. Contact administrator." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const token = generateToken(user);
    await recordAudit({
      action: "USER_LOGIN",
      actor: user,
      targetType: "USER",
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        organization: user.organization,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Login error", error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, role, organization, walletAddress } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "A user with this email already exists." });
    }

    const validRole = ["ADMIN", "SELLER", "COURIER", "CUSTOMER", "RETURN_CENTER"].includes(role)
      ? role
      : "CUSTOMER";

    const user = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: validRole,
      organization: organization || "",
      walletAddress: walletAddress || "",
    });

    await user.save();
    const token = generateToken(user);

    await recordAudit({
      action: "USER_REGISTERED",
      actor: user,
      targetType: "USER",
      targetId: user._id.toString(),
      details: { email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        organization: user.organization,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Registration error", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching profile", error: error.message });
  }
};

const getDemoAccounts = async (req, res) => {
  // Pre-configured demo accounts for fast evaluation
  const demoAccounts = [
    { role: "ADMIN", email: "admin@returnchain.io", name: "Security Administrator", description: "Full system oversight, fraud case resolution, user management" },
    { role: "SELLER", email: "seller@apple.com", name: "Apex Electronics (Seller)", description: "Product registration, warehouse dispatch, seller order monitoring" },
    { role: "COURIER", email: "courier@fedex.com", name: "SwiftLogistics Express", description: "Pickup, in-transit custody logging, delivery confirmation" },
    { role: "CUSTOMER", email: "customer@gmail.com", name: "Sarah Jenkins (Buyer)", description: "Order viewing, return request filing, return status tracking" },
    { role: "RETURN_CENTER", email: "inspector@returncenter.com", name: "Chicago Return Processing Center", description: "Intake scanning, physical inspection, fraud rule evaluation, verification verdict" },
  ];
  res.json({ success: true, demoAccounts, defaultPassword: "password123" });
};

module.exports = { login, register, getProfile, getDemoAccounts };
