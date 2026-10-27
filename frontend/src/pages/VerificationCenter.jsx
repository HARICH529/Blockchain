import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { returnApi, productApi, verificationApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import {
  SearchCheck,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  Package,
  Layers,
  FileText,
  RefreshCw,
  Camera,
} from "lucide-react";

export const VerificationCenter = () => {
  const { role, user } = useAuth();
  const [searchParams] = useSearchParams();
  const prefillReturnId = searchParams.get("returnId");

  const [returns, setReturns] = useState([]);
  const [selectedReturnId, setSelectedReturnId] = useState(prefillReturnId || "");
  const [activeReturn, setActiveReturn] = useState(null);

  // Inspection inputs
  const [scannedProductId, setScannedProductId] = useState("");
  const [scannedSerialNumber, setScannedSerialNumber] = useState("");
  const [sealIntact, setSealIntact] = useState(true);
  const [conditionMatched, setConditionMatched] = useState(true);
  const [packagingIntact, setPackagingIntact] = useState(true);
  const [inspectorNotes, setInspectorNotes] = useState("Standard physical return inspection");

  // Inspection outcome state
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReturns = async () => {
      try {
        const res = await returnApi.getAll();
        if (res.data.success) {
          setReturns(res.data.returns);
          if (!selectedReturnId && res.data.returns.length > 0) {
            setSelectedReturnId(res.data.returns[0].returnId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadReturns();
  }, []);

  useEffect(() => {
    if (selectedReturnId && returns.length > 0) {
      const match = returns.find((r) => r.returnId === selectedReturnId);
      if (match) {
        setActiveReturn(match);
        // Default prefill: Expected Product ID
        setScannedProductId(match.productId);
        setScannedSerialNumber(match.product?.serialNumber || "");
        setResult(null);
        setError("");
      }
    }
  }, [selectedReturnId, returns]);

  // Demo Fast Prefills
  const fillScenarioA = () => {
    const match = returns.find((r) => r.returnId === "RC-RET-8001") || returns[0];
    if (match) {
      setSelectedReturnId(match.returnId);
      setScannedProductId(match.productId); // Genuine item matching
      setScannedSerialNumber(match.product?.serialNumber || "SN-IP15-99881");
      setSealIntact(true);
      setConditionMatched(true);
      setPackagingIntact(true);
      setInspectorNotes("Serial number barcode on physical tray matched genuine iPhone 15 Pro passport.");
      setResult(null);
    }
  };

  const fillScenarioB = () => {
    const match = returns.find((r) => r.returnId === "RC-RET-8002") || returns[0];
    if (match) {
      setSelectedReturnId(match.returnId);
      // Product substitution! Returning generic earbuds RC-PROD-2002 instead of Sony headphones RC-PROD-2001
      setScannedProductId("RC-PROD-2002");
      setScannedSerialNumber("SN-CHEAP-0012");
      setSealIntact(false);
      setConditionMatched(false);
      setPackagingIntact(false);
      setInspectorNotes("Customer returned cheap generic earbuds inside the premium Sony headphones packaging.");
      setResult(null);
    }
  };

  const handleRunVerification = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setVerifying(true);

    try {
      const payload = {
        returnId: selectedReturnId,
        scannedProductId: scannedProductId.trim(),
        scannedSerialNumber: scannedSerialNumber ? scannedSerialNumber.trim() : "",
        physicalInspection: {
          sealIntact,
          conditionMatched,
          packagingIntact,
          notes: inspectorNotes,
        },
      };

      const res = await verificationApi.verifyItem(payload);
      if (res.data.success) {
        setResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Return Verification Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical inspection intake wizard: Rule-based fraud evaluation & blockchain verdict recording
          </p>
        </div>

        {/* Demo Fast Preset Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fillScenarioA}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors flex items-center gap-1.5"
            title="Load Genuine Return Demo"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Scenario A (Genuine)</span>
          </button>
          <button
            type="button"
            onClick={fillScenarioB}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5"
            title="Load Product Substitution Demo"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Scenario B (Substitution)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Select Return & Scanned Item (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Intake Inspection Parameters</span>
            </h2>

            <form onSubmit={handleRunVerification} className="mt-4 space-y-4 text-xs">
              {/* Return Selection */}
              <div>
                <label className="block font-semibold text-slate-700">Select Incoming Return Request</label>
                <select
                  value={selectedReturnId}
                  onChange={(e) => setSelectedReturnId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs focus:ring-2 focus:ring-blue-500"
                >
                  {returns.map((r) => (
                    <option key={r.returnId} value={r.returnId}>
                      {r.returnId} — Expected: {r.productId} ({r.product?.name}) [Status: {r.status}]
                    </option>
                  ))}
                </select>
              </div>

              {activeReturn && (
                <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Expected Registered Record:</span>
                    <StatusBadge status={activeReturn.status} />
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Product: <strong>{activeReturn.product?.name}</strong> • Order: {activeReturn.orderId}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Expected Serial: <span className="font-mono">{activeReturn.product?.serialNumber}</span>
                  </div>
                </div>
              )}

              {/* Physical Scanned Identification */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>Physical Identification Scanned / Entered</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600">Scanned Product ID (QR Tag)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RC-PROD-1001"
                      value={scannedProductId}
                      onChange={(e) => setScannedProductId(e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600">Scanned Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-IP15-99881"
                      value={scannedSerialNumber}
                      onChange={(e) => setScannedSerialNumber(e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Checklist */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-semibold text-slate-800 mb-2">Physical Condition Verification Checklist</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sealIntact}
                      onChange={(e) => setSealIntact(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-slate-700">Warranty Seal Intact</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={conditionMatched}
                      onChange={(e) => setConditionMatched(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-slate-700">Reported Condition Matches</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={packagingIntact}
                      onChange={(e) => setPackagingIntact(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-slate-700">OEM Box & Barcode Intact</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600">Inspector Observations</label>
                <textarea
                  rows="2"
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <SearchCheck className="w-4 h-4" />
                <span>{verifying ? "Executing 10 Fraud Rules & Smart Contract Anchor..." : "Execute Verification & Fraud Check"}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Result Card: VERDICT (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>Verification Verdict & Engine Output</span>
              </h2>

              {!result ? (
                <div className="py-16 text-center text-slate-400">
                  <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium">No inspection run yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Select a return request and click "Execute Verification & Fraud Check" or use a Preset above.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 animate-in zoom-in-95">
                  {/* Verdict Banner */}
                  <div
                    className={`p-5 rounded-2xl border text-center ${
                      result.verdict === "VERIFIED"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : result.verdict === "SUSPICIOUS"
                        ? "bg-rose-50 border-rose-300 text-rose-900"
                        : "bg-amber-50 border-amber-300 text-amber-900"
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {result.verdict === "VERIFIED" ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle className="w-7 h-7" />
                        </div>
                      ) : result.verdict === "SUSPICIOUS" ? (
                        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center animate-bounce">
                          <ShieldAlert className="w-7 h-7" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                          <AlertTriangle className="w-7 h-7" />
                        </div>
                      )}
                    </div>

                    <span className="text-xs uppercase tracking-widest font-extrabold opacity-75">
                      Inspection Outcome
                    </span>
                    <h3 className="text-xl font-extrabold tracking-tight mt-0.5">
                      {result.verdict === "VERIFIED"
                        ? "GREEN — VERIFIED GENUINE"
                        : result.verdict === "SUSPICIOUS"
                        ? "RED — SUSPICIOUS / FRAUD MISMATCH"
                        : "AMBER — MANUAL REVIEW REQUIRED"}
                    </h3>

                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="text-[11px] font-semibold">Risk Level:</span>
                      <StatusBadge status={result.riskLevel} />
                      <span className="text-[11px] font-mono text-slate-500">
                        (Score: {result.riskScore}/100)
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-semibold">
                      Recommended Action:{" "}
                      <span className="underline">{result.recommendedAction}</span>
                    </div>
                  </div>

                  {/* Blockchain Anchor Confirmation */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500">Blockchain Record:</span>
                    <BlockchainBadge txHash={result.txHash} blockNumber={result.blockNumber} />
                  </div>

                  {/* Rule Breakdown Checklist */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Evaluated Rule Breakdown
                    </span>
                    <div className="space-y-1 text-xs max-h-56 overflow-y-auto">
                      {result.ruleBreakdown?.map((rb, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                            rb.passed
                              ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                              : "bg-rose-50 border-rose-200 text-rose-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {rb.passed ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span className="font-semibold truncate">{rb.name || rb.rule}</span>
                          </div>
                          <span className="text-[11px] shrink-0 font-medium">
                            {rb.passed ? "Passed" : "Triggered"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanations summary */}
                  {result.explanations?.length > 0 && (
                    <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                      <strong className="block font-semibold">Triggered Anomaly Explanations:</strong>
                      {result.explanations.map((exp, i) => (
                        <p key={i} className="text-[11px] leading-relaxed">
                          • {exp}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Fraud Case Link if Suspicious */}
                  {result.fraudCase && (
                    <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-rose-400">Fraud Case Logged</div>
                        <div className="font-mono text-[11px]">{result.fraudCase.caseId}</div>
                      </div>
                      <Link
                        to="/fraud"
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                      >
                        Investigate Case
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-center">
              <span className="text-[11px] text-slate-400">
                Authorized Return Center Station • Operator: {user?.name || "Inspector"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
