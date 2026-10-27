const User = require("../models/User");
const { recordAudit } = require("../services/auditService");

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["ADMIN", "SELLER", "COURIER", "CUSTOMER", "RETURN_CENTER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await recordAudit({
      action: "USER_ROLE_UPDATED",
      actor: req.user,
      targetType: "USER",
      targetId: user._id.toString(),
      details: { previousRole: oldRole, newRole: role, targetEmail: user.email },
    });

    res.json({ success: true, message: `User role updated to ${role}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating user role", error: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.isActive = !user.isActive;
    await user.save();

    await recordAudit({
      action: "USER_STATUS_TOGGLED",
      actor: req.user,
      targetType: "USER",
      targetId: user._id.toString(),
      details: { isActive: user.isActive, targetEmail: user.email },
    });

    res.json({
      success: true,
      message: `User account ${user.isActive ? "activated" : "deactivated"}.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error toggling user status", error: error.message });
  }
};

module.exports = { getUsers, updateUserRole, toggleUserStatus };
