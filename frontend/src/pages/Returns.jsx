import React, { useState, useEffect } from "react";
import { returnApi, orderApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  Plus,
  SearchCheck,
  CheckCircle,
  Package,
  Calendar,
  AlertTriangle,
  RefreshCw,
  X,
  AlertCircle,
  Inbox,
} from "lucide-react";

export const Returns = () => {
  const { role } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Return Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [returnForm, setReturnForm] = useState({
    returnId: `RC-RET-${Math.floor(8000 + Math.random() * 2000)}`,
    orderId: "",
    reason: "Defective audio / hardware malfunction",
    conditionReported: "Gently used - defective",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const loadReturns = async () => {
    try {
      setLoading(true);
      const res = await returnApi.getAll();
      if (res.data.success) {
        setReturns(res.data.returns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  const openRequestModal = async () => {
    try {
      const oRes = await orderApi.getAll();
      if (oRes.data.success) {
        // Only orders in DELIVERED status are eligible
        const delivered = oRes.data.orders.filter((o) => o.status === "DELIVERED");
        setEligibleOrders(delivered);
        if (delivered.length > 0) {
          setReturnForm((prev) => ({ ...prev, orderId: delivered[0].orderId }));
        }
      }
      setIsRequestOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReturn = async (e) => {
    e.preventDefault();
    setActionError("");
    setActionLoading(true);
    try {
      const res = await returnApi.request(returnForm);
      if (res.data.success) {
        setIsRequestOpen(false);
        setReturnForm({
          returnId: `RC-RET-${Math.floor(8000 + Math.random() * 2000)}`,
          orderId: "",
          reason: "Defective audio / hardware malfunction",
          conditionReported: "Gently used - defective",
        });
        loadReturns();
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveReturn = async (returnId) => {
    try {
      await returnApi.receive(returnId, {
        location: "Chicago Return Processing Hub Bay #1",
        intakeNotes: "Outer shipping carton received. Physical condition verified.",
      });
      loadReturns();
    } catch (err) {
      console.error("Error checking in package:", err);
      alert("Error checking in package: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Return Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer return requests, intake tracking, and authorized refund workflow governance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openRequestModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>File Return Request</span>
          </button>
          <Link
            to="/verify-center"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-colors"
          >
            <SearchCheck className="w-4 h-4" />
            <span>Open Verification Center</span>
          </Link>
          <button
            onClick={loadReturns}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Return ID</th>
                <th className="px-4 py-3">Associated Product & Order</th>
                <th className="px-4 py-3">Customer Reason</th>
                <th className="px-4 py-3">Intake Status</th>
                <th className="px-4 py-3">Verification Outcome</th>
                <th className="px-4 py-3">Refund Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No return requests filed yet.
                  </td>
                </tr>
              ) : (
                returns.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {r.returnId}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{r.product?.name || "Product"}</div>
                      <div className="font-mono text-[11px] text-blue-600">
                        {r.productId} • {r.orderId}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">
                      <p className="line-clamp-1">{r.reason}</p>
                      <span className="text-[10px] text-slate-400">{r.customer?.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.verificationOutcome} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.refundStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {r.status === "REQUESTED" && (role === "RETURN_CENTER" || role === "ADMIN") && (
                          <button
                            onClick={() => handleReceiveReturn(r.returnId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs shadow-xs"
                          >
                            <Inbox className="w-3 h-3" />
                            <span>Check-in</span>
                          </button>
                        )}
                        <Link
                          to={`/verify-center?returnId=${r.returnId}`}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                        >
                          Inspect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Return Modal */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">File Customer Return Request</h3>
              <button
                onClick={() => setIsRequestOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReturn} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700">Return ID</label>
                <input
                  type="text"
                  required
                  value={returnForm.returnId}
                  onChange={(e) => setReturnForm({ ...returnForm, returnId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Select Delivered Order</label>
                {eligibleOrders.length === 0 ? (
                  <p className="mt-1 text-slate-500 italic">No delivered orders found to return.</p>
                ) : (
                  <select
                    value={returnForm.orderId}
                    onChange={(e) => setReturnForm({ ...returnForm, orderId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {eligibleOrders.map((o) => (
                      <option key={o.orderId} value={o.orderId}>
                        {o.orderId} — {o.productId} ({o.product?.name})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700">Reason for Return</label>
                <textarea
                  required
                  rows="2"
                  value={returnForm.reason}
                  onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700">Reported Condition</label>
                <input
                  type="text"
                  value={returnForm.conditionReported}
                  onChange={(e) => setReturnForm({ ...returnForm, conditionReported: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || eligibleOrders.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
                >
                  {actionLoading ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
