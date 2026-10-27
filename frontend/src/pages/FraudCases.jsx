import React, { useState, useEffect } from "react";
import { fraudApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
  RefreshCw,
  X,
  Search,
  Filter,
} from "lucide-react";

export const FraudCases = () => {
  const { role, user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");

  // Resolve Modal State
  const [activeCase, setActiveCase] = useState(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveStatus, setResolveStatus] = useState("RESOLVED_REJECTED");
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState("");

  const loadCases = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.riskLevel = riskFilter;
      const res = await fraudApi.getAll(params);
      if (res.data.success) {
        setCases(res.data.cases);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter, riskFilter]);

  const handleAssignSelf = async (caseId) => {
    try {
      await fraudApi.assign(caseId, { investigatorId: user.id });
      loadCases();
    } catch (err) {
      alert("Error assigning investigator: " + (err.response?.data?.message || err.message));
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setResolveError("");
    setResolveLoading(true);
    try {
      const res = await fraudApi.resolve(activeCase.caseId, {
        resolutionNotes: resolveNotes,
        resolutionStatus: resolveStatus,
      });
      if (res.data.success) {
        setActiveCase(null);
        setResolveNotes("");
        loadCases();
      }
    } catch (err) {
      setResolveError(err.response?.data?.message || err.message);
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Fraud Investigations Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent rule-based anomaly cases, evidence review, and audited administrative resolutions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_INVESTIGATION">UNDER_INVESTIGATION</option>
            <option value="RESOLVED_REJECTED">RESOLVED_REJECTED</option>
            <option value="RESOLVED_APPROVED_EXCEPTION">RESOLVED_APPROVED_EXCEPTION</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>

          <button
            onClick={loadCases}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Case ID</th>
                <th className="px-4 py-3">Linked Return & Product</th>
                <th className="px-4 py-3">Triggered Fraud Rules</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Status & Reviewer</th>
                <th className="px-4 py-3">Blockchain Tx</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No fraud investigation cases match criteria.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-rose-700">
                      {c.caseId}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{c.product?.name || "Product"}</div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {c.productId} • {c.returnId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.triggeredRules?.map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.riskLevel} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {c.assignedInvestigator?.name || "Unassigned"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <BlockchainBadge txHash={c.txHash} blockNumber={c.blockNumber} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {!c.assignedInvestigator && (
                          <button
                            onClick={() => handleAssignSelf(c.caseId)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          >
                            Assign Me
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveCase(c);
                            setResolveNotes(c.resolutionNotes || "");
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Review & Resolution Modal */}
      {activeCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Fraud Case Investigation: <span className="font-mono text-rose-600">{activeCase.caseId}</span>
                  </h3>
                  <p className="text-xs text-slate-500">Return: {activeCase.returnId} • Product: {activeCase.productId}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveCase(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="font-bold text-rose-900">Triggered Anomaly Explanation:</span>
                <p className="mt-1 text-rose-800 leading-relaxed whitespace-pre-line">{activeCase.explanation}</p>
              </div>

              {activeCase.evidenceReferences?.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">Recorded Evidence & Findings:</span>
                  <ul className="mt-1 list-disc list-inside text-slate-600 space-y-0.5">
                    {activeCase.evidenceReferences.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resolution Form for Admins */}
              <form onSubmit={handleResolveSubmit} className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="font-bold text-slate-900">Audited Resolution Decision</h4>

                <div>
                  <label className="block font-medium text-slate-700">Resolution Decision</label>
                  <select
                    value={resolveStatus}
                    onChange={(e) => setResolveStatus(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="RESOLVED_REJECTED">RESOLVED_REJECTED (Confirm Fraud, Deny Customer Refund)</option>
                    <option value="RESOLVED_APPROVED_EXCEPTION">
                      RESOLVED_APPROVED_EXCEPTION (Approve Refund Exception)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700">Resolution Findings & Legal Notes</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Document formal investigation findings and grounds for decision..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {resolveError && (
                  <p className="text-rose-600 text-[11px] font-medium">{resolveError}</p>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCase(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={resolveLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold shadow-sm disabled:opacity-50"
                  >
                    {resolveLoading ? "Anchoring Resolution..." : "Save & Anchor Resolution"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
