const AuditLog = require("../models/AuditLog");
const CustodyEvent = require("../models/CustodyEvent");
const blockchainService = require("../services/blockchainService");

const getAuditLogs = async (req, res) => {
  try {
    const { targetType, targetId, action, actorRole, status, search } = req.query;
    const query = {};

    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = { $regex: targetId, $options: "i" };
    if (action) query.action = action;
    if (actorRole) query.actorRole = actorRole;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { targetId: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { actorName: { $regex: search, $options: "i" } },
        { txHash: { $regex: search, $options: "i" } },
      ];
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching audit logs", error: error.message });
  }
};

const getBlockchainExplorer = async (req, res) => {
  try {
    const connectionStatus = await blockchainService.checkConnection();
    const contractEvents = await blockchainService.getContractEvents(0);

    // Also gather recent custody events with transaction hashes
    const custodyTransactions = await CustodyEvent.find({ txHash: { $ne: "" } })
      .populate("actor", "name role")
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({
      success: true,
      network: connectionStatus,
      contractAddress: blockchainService.contractAddress,
      eventsCount: contractEvents.length,
      contractEvents: contractEvents.slice(-20),
      custodyTransactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching blockchain explorer data", error: error.message });
  }
};

module.exports = { getAuditLogs, getBlockchainExplorer };
