const AuditLog = require("../models/AuditLog");

const recordAudit = async ({
  action,
  actor,
  actorName = "System",
  actorRole = "SYSTEM",
  actorAddress = "",
  targetType,
  targetId,
  txHash = "",
  blockNumber = 0,
  details = {},
  status = "SUCCESS",
}) => {
  try {
    const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const log = new AuditLog({
      auditId,
      action,
      actor: actor ? actor._id || actor : null,
      actorName: actor?.name || actorName,
      actorRole: actor?.role || actorRole,
      actorAddress,
      targetType,
      targetId,
      txHash,
      blockNumber,
      details,
      status,
    });
    await log.save();
    return log;
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
};

module.exports = { recordAudit };
