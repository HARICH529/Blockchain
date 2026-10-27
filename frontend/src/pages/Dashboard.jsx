import React, { useState, useEffect } from "react";
import { statsApi } from "../services/api";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SearchCheck,
  Activity,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  QrCode,
  DollarSign,
  UserCheck,
  FileCheck2,
  AlertTriangle,
  Send,
  Boxes,
  Lock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export const Dashboard = () => {
  const { role, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await statsApi.getDashboard();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const stats = data?.stats || {};
  const trends = data?.verificationTrends || [];
  const recentCustody = data?.recentCustody || [];
  const recentFraud = data?.recentFraudCases || [];
  const activeRole = data?.role || role;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Dynamic Role-Based Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeRole === "CUSTOMER" && "Customer Portal — Orders & Returns"}
              {activeRole === "SELLER" && `Merchant Dashboard — ${user?.organization || "Brand Partner"}`}
              {activeRole === "COURIER" && "Logistics Carrier Operations Console"}
              {activeRole === "RETURN_CENTER" && "Return Center Intake & Verification Console"}
              {activeRole === "ADMIN" && "Security & Return Analytics Dashboard"}
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {activeRole} SCOPE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeRole === "CUSTOMER" &&
              "View your verified product purchases, track active deliveries, and monitor return refund progress."}
            {activeRole === "SELLER" &&
              "Monitor your registered brand products, customer orders, return intake, and brand anomaly alerts."}
            {activeRole === "COURIER" &&
              "Manage assigned outbound deliveries, customer doorstep return pickups, and chain-of-custody milestones."}
            {activeRole === "RETURN_CENTER" &&
              "Perform physical item intake, run the 10-rule verification wizard, and anchor fraud findings to blockchain."}
            {activeRole === "ADMIN" &&
              "Real-time blockchain product passport verification, chain-of-custody milestones & platform fraud detection."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeRole === "RETURN_CENTER" && (
            <Link
              to="/verify-center"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <SearchCheck className="w-4 h-4" />
              <span>Inspection Center</span>
            </Link>
          )}

          {activeRole === "CUSTOMER" && (
            <Link
              to="/returns"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>My Returns</span>
            </Link>
          )}

          {activeRole === "COURIER" && (
            <Link
              to="/returns"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
            >
              <Truck className="w-4 h-4" />
              <span>Doorstep Pickups</span>
            </Link>
          )}

          {activeRole === "SELLER" && (
            <Link
              to="/products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>Manage Products</span>
            </Link>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ROLE 1: CUSTOMER SPECIFIC METRICS */}
      {activeRole === "CUSTOMER" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="My Orders"
              value={stats.totalOrders}
              subtitle="All purchased products"
              icon={Package}
              color="blue"
            />
            <MetricCard
              title="In-Flight Deliveries"
              value={stats.activeDeliveries}
              subtitle="Currently on vehicle"
              icon={Truck}
              color="purple"
            />
            <MetricCard
              title="Delivered Items"
              value={stats.deliveredOrders}
              subtitle="Successfully received"
              icon={CheckCircle}
              color="emerald"
            />
            <MetricCard
              title="My Return Requests"
              value={stats.activeReturns}
              subtitle="Under review or in transit"
              icon={RotateCcw}
              color="amber"
            />
            <MetricCard
              title="Approved Refunds"
              value={stats.refundsApproved}
              subtitle="Processed to bank"
              icon={ShieldCheck}
              color="emerald"
            />
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 block font-semibold">Protected by ReturnChain Blockchain Identity:</strong>
              <p className="mt-0.5 text-slate-600">
                Every product you purchase has a cryptographically anchored digital passport. When returning an item, only return the original physical device with the matching serial number to ensure instant verification and refund release.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ROLE 2: SELLER SPECIFIC METRICS */}
      {activeRole === "SELLER" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Brand Products"
              value={stats.totalProducts}
              subtitle="Registered & anchored on-chain"
              icon={Package}
              color="blue"
            />
            <MetricCard
              title="Customer Orders"
              value={stats.totalOrders}
              subtitle="Orders for your products"
              icon={Truck}
              color="purple"
            />
            <MetricCard
              title="In-Transit Shipments"
              value={stats.inTransitProducts}
              subtitle="Active logistics tracking"
              icon={Boxes}
              color="sky"
            />
            <MetricCard
              title="Returns on My Brand"
              value={stats.activeReturns}
              subtitle="Customer return requests"
              icon={RotateCcw}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Verified Genuine Returns"
              value={stats.verifiedReturns}
              subtitle="Passed physical verification"
              icon={ShieldCheck}
              color="emerald"
            />
            <MetricCard
              title="Flagged Return Anomalies"
              value={stats.suspiciousReturns}
              subtitle="Blocked fraudulent returns"
              icon={ShieldAlert}
              color="rose"
            />
            <MetricCard
              title="Open Fraud Inquiries"
              value={stats.openInvestigations}
              subtitle="Active investigation cases"
              icon={Activity}
              color="amber"
            />
          </div>
        </>
      )}

      {/* ROLE 3: COURIER SPECIFIC METRICS */}
      {activeRole === "COURIER" && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Outbound Deliveries"
            value={stats.pendingDeliveries}
            subtitle="Pending delivery handover"
            icon={Truck}
            color="purple"
          />
          <MetricCard
            title="Completed Deliveries"
            value={stats.completedDeliveries}
            subtitle="Customer signed proof"
            icon={CheckCircle}
            color="emerald"
          />
          <MetricCard
            title="Doorstep Return Pickups"
            value={stats.pendingPickups}
            subtitle="Ready for pickup at customer"
            icon={RotateCcw}
            color="amber"
          />
          <MetricCard
            title="In-Transit Return Parcels"
            value={stats.inTransitReturns}
            subtitle="In transit to Return Center"
            icon={Boxes}
            color="sky"
          />
        </div>
      )}

      {/* ROLE 4: RETURN CENTER SPECIFIC METRICS */}
      {activeRole === "RETURN_CENTER" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Inbound Returns"
              value={stats.pendingIntake}
              subtitle="Parcels in-transit to hub"
              icon={Truck}
              color="sky"
            />
            <MetricCard
              title="Awaiting Inspection"
              value={stats.awaitingInspection}
              subtitle="Received in intake bay"
              icon={RotateCcw}
              color="amber"
            />
            <MetricCard
              title="Verified Genuine"
              value={stats.verifiedGenuine}
              subtitle="Serial & hash confirmed"
              icon={ShieldCheck}
              color="emerald"
            />
            <MetricCard
              title="Flagged Suspicious"
              value={stats.suspiciousReturns}
              subtitle="Anomalies & substitutions"
              icon={ShieldAlert}
              color="rose"
            />
            <MetricCard
              title="Fraud Investigations"
              value={stats.openInvestigations}
              subtitle="Escalated for analysis"
              icon={Activity}
              color="amber"
            />
          </div>
        </>
      )}

      {/* ROLE 5: ADMIN SPECIFIC METRICS */}
      {activeRole === "ADMIN" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Registered Products"
              value={stats.totalProducts}
              subtitle="Anchored on blockchain ledger"
              icon={Package}
              color="blue"
            />
            <MetricCard
              title="Products in Transit"
              value={stats.inTransitProducts}
              subtitle="Live logistics custody"
              icon={Truck}
              color="purple"
            />
            <MetricCard
              title="Delivered Units"
              value={stats.deliveredProducts}
              subtitle="Signed electronic proof"
              icon={CheckCircle}
              color="emerald"
            />
            <MetricCard
              title="Active Return Requests"
              value={stats.activeReturns}
              subtitle="Awaiting intake inspection"
              icon={RotateCcw}
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Verified Genuine Returns"
              value={stats.verifiedReturns}
              subtitle="Passed all 10 cryptographic fraud rules"
              icon={ShieldCheck}
              color="emerald"
            />
            <MetricCard
              title="Suspicious / Flagged Returns"
              value={stats.suspiciousReturns}
              subtitle="Substitutions & counterfeits blocked"
              icon={ShieldAlert}
              color="rose"
            />
            <MetricCard
              title="Open Fraud Investigations"
              value={stats.openInvestigations}
              subtitle="Audited evidence review"
              icon={Activity}
              color="amber"
            />
          </div>
        </>
      )}

      {/* Analytics Charts Section (Only for Admin, Return Center, and Seller) */}
      {(activeRole === "ADMIN" || activeRole === "RETURN_CENTER" || activeRole === "SELLER") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Return Verification Trends</h3>
                <p className="text-xs text-slate-500">Weekly inspection outcomes: Genuine vs Flagged Suspicious</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Genuine
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Flagged
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="verified"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVerified)"
                    name="Verified Genuine"
                  />
                  <Area
                    type="monotone"
                    dataKey="suspicious"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSuspicious)"
                    name="Flagged Suspicious"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blockchain Node Telemetry */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Blockchain Network</h3>
                {data?.blockchain?.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Node Offline
                  </span>
                )}
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Target Network</span>
                  <span className="font-semibold text-slate-800">Hardhat Localhost EVM</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Chain ID</span>
                  <span className="font-mono font-semibold text-slate-800">{data?.blockchain?.chainId || 31337}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Live Block Height</span>
                  <span className="font-mono font-bold text-slate-800">
                    {data?.blockchain?.connected ? `#${data?.blockchain?.blockNumber}` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500">Smart Contract</span>
                  <span className="font-mono text-blue-600 font-semibold truncate max-w-[140px]" title={data?.blockchain?.contractAddress || "0x5FbDB2315678afecb367f032d93F642f64180aa3"}>
                    {data?.blockchain?.contractAddress ? `${data.blockchain.contractAddress.slice(0, 10)}...` : "0x5FbDB231..."}
                  </span>
                </div>
              </div>
            </div>

            {activeRole === "ADMIN" && (
              <div className="mt-6 pt-3 border-t border-slate-100">
                <Link
                  to="/audit"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                >
                  <span>Explore Tamper-Proof Ledger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Two Column Feeds: Recent Custody Events & Role-Allowed Alerts */}
      <div className={`grid grid-cols-1 ${recentFraud.length > 0 ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-6`}>
        {/* Recent Custody Events */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {activeRole === "CUSTOMER" ? "My Order Tracking Milestones" : "Recent Custody Milestones"}
            </h3>
            <Link to="/custody" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentCustody.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No custody milestones recorded yet.</p>
            ) : (
              recentCustody.slice(0, 5).map((c, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{c.productId}</span>
                      <StatusBadge status={c.eventType} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                      {c.location || "Facility"} • {c.actor?.name || c.actorRole}
                    </p>
                  </div>
                  <BlockchainBadge txHash={c.txHash} blockNumber={c.blockNumber} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Fraud Cases (Only rendered if authorized and present) */}
        {recentFraud.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900">Active Fraud & Anomaly Alerts</h3>
              <Link to="/fraud" className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentFraud.slice(0, 5).map((f, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-rose-700">{f.caseId}</span>
                      <StatusBadge status={f.riskLevel} />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{f.explanation}</p>
                  </div>
                  <Link
                    to="/fraud"
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold shrink-0"
                  >
                    Investigate
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
