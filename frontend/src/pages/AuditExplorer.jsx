import React, { useState, useEffect } from "react";
import { auditApi } from "../services/api";
import { BlockchainBadge } from "../components/BlockchainBadge";
import { StatusBadge } from "../components/StatusBadge";
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Layers,
  ShieldCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const AuditExplorer = () => {
  const [logs, setLogs] = useState([]);
  const [explorerData, setExplorerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetTypeFilter, setTargetTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (targetTypeFilter) params.targetType = targetTypeFilter;
      if (statusFilter) params.status = statusFilter;

      const [logsRes, explorerRes] = await Promise.all([
        auditApi.getLogs(params),
        auditApi.getBlockchainExplorer(),
      ]);

      if (logsRes.data.success) setLogs(logsRes.data.logs);
      if (explorerRes.data.success) setExplorerData(explorerRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, [targetTypeFilter, statusFilter]);

  const [activeTab, setActiveTab] = useState("events"); // "events" or "audit"

  const network = explorerData?.network || {};
  const contractEvents = explorerData?.contractEvents || [];
  const custodyTxs = explorerData?.custodyTransactions || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit & Blockchain Explorer</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-proof system ledger tracking smart contract emissions, transaction proofs, and administrative actions
          </p>
        </div>
        <button
          onClick={loadAuditData}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Live Blockchain Network Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">EVM Network</span>
          <p className="text-base font-bold text-slate-900 mt-1">Hardhat Localhost</p>
          {network.connected ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Chain ID: {network.chainId || 31337} (Online)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Node Offline (:8545)
            </span>
          )}
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Current Block Height</span>
          <p className="text-base font-mono font-bold text-slate-900 mt-1">
            {network.connected ? `#${network.blockNumber}` : "N/A"}
          </p>
          <span className="text-xs text-slate-500 font-medium">
            {network.connected ? "Auto-mined on event" : "Awaiting node"}
          </span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Contract Registry</span>
          <p className="text-base font-bold text-blue-600 font-mono mt-1 truncate" title={network.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}>
            {network.contractAddress ? `${network.contractAddress.slice(0, 7)}...${network.contractAddress.slice(-4)}` : "0x5FbDB...aa3"}
          </p>
          <span className="text-xs text-slate-500">ReturnChain.sol</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">On-Chain Proof Status</span>
          {network.connected ? (
            <>
              <p className="text-base font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> 100% Synced
              </p>
              <span className="text-xs text-slate-500">Active EVM Consensus</span>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-amber-600 mt-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Disconnected
              </p>
              <span className="text-xs text-slate-500">Run `npm run node`</span>
            </>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "events"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Live On-Chain Smart Contract Events</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "events" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}>
            {contractEvents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "audit"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Application Audit Trail</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === "audit" ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}>
            {logs.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Live On-Chain Contract Events */}
      {activeTab === "events" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Decoded Smart Contract Event Logs</h3>
              <p className="text-xs text-slate-500">Queried directly from EVM JSON-RPC provider (latest 20 transactions)</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Hardhat Node
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Block #</th>
                  <th className="px-4 py-3">Event Name</th>
                  <th className="px-4 py-3">Decoded Arguments / Payload</th>
                  <th className="px-4 py-3">Transaction Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contractEvents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                      No on-chain contract events found yet.
                    </td>
                  </tr>
                ) : (
                  contractEvents.slice().reverse().map((ev, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        #{ev.blockNumber}
                      </td>
                      <td className="px-4 py-3 font-bold">
                        <span className="px-2 py-1 rounded-md text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          {ev.eventName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-[11px] max-w-md truncate">
                        {JSON.stringify(ev.args)}
                      </td>
                      <td className="px-4 py-3">
                        <BlockchainBadge txHash={ev.txHash} blockNumber={ev.blockNumber} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: System Audit Trail */}
      {activeTab === "audit" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Target ID, Action, Actor Name, or Transaction Hash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={targetTypeFilter}
                onChange={(e) => setTargetTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="">All Entity Types</option>
                <option value="PRODUCT">PRODUCT</option>
                <option value="CUSTODY">CUSTODY</option>
                <option value="RETURN">RETURN</option>
                <option value="FRAUD_CASE">FRAUD_CASE</option>
                <option value="USER">USER</option>
                <option value="ORDER">ORDER</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARNING">WARNING</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>
          </div>

          {/* Audit Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Immutable Audit Ledger Entries</h3>
              <span className="text-xs text-slate-400 font-mono">Showing {logs.length} logged events</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Actor & Role</th>
                    <th className="px-4 py-3">Target Entity</th>
                    <th className="px-4 py-3">Blockchain Anchor</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                        No audit records match the criteria.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{log.actorName || "System"}</div>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {log.actorRole}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          <span className="font-semibold text-blue-600">{log.targetType}</span>: {log.targetId}
                        </td>
                        <td className="px-4 py-3">
                          <BlockchainBadge txHash={log.txHash} blockNumber={log.blockNumber} />
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              log.status === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700"
                                : log.status === "WARNING"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
