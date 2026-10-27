import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { productApi, returnApi } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Package,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ArrowLeft,
  QrCode,
  Truck,
  Check,
  RotateCcw,
  Sparkles,
  Barcode,
} from "lucide-react";

export const PublicVerify = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delivery agent pickup action state
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupSuccess, setPickupSuccess] = useState(false);
  const [pickupError, setPickupError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await productApi.verifyPublic(id);
      if (res.data.success) {
        setData(res.data.product);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Product '${id}' is not registered in ReturnChain registry.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCourierPickup = async (returnId) => {
    setPickupLoading(true);
    setPickupError("");
    try {
      const res = await returnApi.pickup(returnId, {
        location: "Customer Residence Doorstep (Courier Handover)",
        notes: "Delivery agent scanned physical QR tag, verified serial number matches whitelist, and accepted return parcel.",
      });
      if (res.data.success) {
        setPickupSuccess(true);
        loadData();
      }
    } catch (err) {
      setPickupError(err.response?.data?.message || err.message);
    } finally {
      setPickupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Reading blockchain product identity & return state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
        {/* Brand Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900">
                Return<span className="text-blue-600">Chain</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">DELIVERY AGENT & BUYER VERIFICATION PORTAL</p>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
          >
            Dashboard <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        {error ? (
          /* Red Error / Unregistered Product Warning */
          <div className="bg-white rounded-2xl p-8 border border-rose-200 shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Product Not Registered</h2>
            <p className="text-xs text-rose-600 mt-2 max-w-md mx-auto font-medium">{error}</p>
            <div className="mt-6 p-4 rounded-xl bg-rose-50/50 border border-rose-100 text-left text-xs text-slate-600 max-w-lg mx-auto">
              <strong className="block text-rose-800 mb-1">Notice for Delivery Agents & Customers:</strong>
              This item does NOT exist on the ReturnChain blockchain registry. If a customer is attempting to hand you this parcel as an authorized return, do NOT accept it. It may be a substituted knockoff or counterfeit.
            </div>
          </div>
        ) : (
          /* Verified Product Passport Details */
          <>
            {/* 1. DELIVERY AGENT RETURN INTAKE ACTION CARD (If return request is active) */}
            {data.activeReturn && (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg border border-blue-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-sky-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
                        Delivery Agent Return Intake Action
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                      Return Active: {data.activeReturn.returnId}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      Customer Return Pickup Verification
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Verify the physical item before accepting handover into courier custody.
                    </p>
                  </div>

                  {/* Return Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                      <span className="text-[11px] text-slate-300 font-medium">Stated Return Reason</span>
                      <p className="font-semibold text-white mt-0.5 text-xs line-clamp-2">
                        {data.activeReturn.reason}
                      </p>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                      <span className="text-[11px] text-slate-300 font-medium">Reported Condition</span>
                      <p className="font-semibold text-white mt-0.5 text-xs">
                        {data.activeReturn.conditionReported || "Normal return"}
                      </p>
                    </div>

                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs border border-white/10">
                      <span className="text-[11px] text-slate-300 font-medium">Current Return Status</span>
                      <p className="font-semibold text-sky-300 mt-0.5 text-xs uppercase">
                        {data.activeReturn.status}
                      </p>
                    </div>
                  </div>

                  {/* Physical Checklist for Delivery Agent */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1.5">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Barcode className="w-4 h-4" />
                      Physical Label Verification (Check Physical Item):
                    </span>
                    <p className="text-slate-200 text-[11px]">
                      • Whitelisted Serial Number: <strong className="font-mono text-emerald-300 bg-white/10 px-1.5 py-0.5 rounded">{data.serialNumber}</strong>
                    </p>
                    <p className="text-slate-200 text-[11px]">
                      • Expected Model: <strong>{data.name} ({data.model || "Standard"})</strong>
                    </p>
                  </div>

                  {/* Courier Action Button */}
                  {data.activeReturn.status === "REQUESTED" ? (
                    <div className="pt-2">
                      {pickupSuccess ? (
                        <div className="p-3 bg-emerald-500/20 border border-emerald-400 rounded-xl text-xs text-emerald-200 flex items-center gap-2 font-semibold">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Return package collected! Custody milestone logged on blockchain ledger.</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCourierPickup(data.activeReturn.returnId)}
                          disabled={pickupLoading}
                          className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Truck className="w-4 h-4" />
                          <span>
                            {pickupLoading
                              ? "Logging Courier Pickup to Blockchain..."
                              : "Confirm Return Package Pickup & Log Custody Milestone"}
                          </span>
                        </button>
                      )}
                      {pickupError && (
                        <p className="text-rose-300 text-[11px] mt-1.5">{pickupError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white/10 rounded-xl text-xs text-slate-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>This return has already been picked up or received at the processing hub.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. MAIN DIGITAL PASSPORT CARD */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                    <Package className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                        Verified Blockchain Passport
                      </span>
                      <StatusBadge status={data.status} />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">{data.name}</h1>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Product ID: <strong className="text-blue-600 font-bold">{data.productId}</strong> • Price:{" "}
                      <strong className="text-slate-800">${data.price}</strong>
                    </p>
                  </div>
                </div>

                {data.qrDataUrl && (
                  <div className="flex flex-col items-center shrink-0 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={data.qrDataUrl} alt="Product QR Code" className="w-20 h-20 object-contain" />
                    <span className="text-[9px] font-mono font-semibold text-slate-500 mt-1">
                      Scanned Tag
                    </span>
                  </div>
                )}
              </div>

              {/* Verified Product Identity Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Category</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{data.category}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Manufacturer</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{data.manufacturer}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Model</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{data.model || "Standard"}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 font-bold">Whitelisted Serial</span>
                  <p className="font-mono font-bold text-emerald-900 mt-0.5 truncate">{data.serialNumber}</p>
                </div>
              </div>

              {/* Delivery Window & Eligibility Confirmation */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Original Delivery Status:{" "}
                    <strong>{data.deliveryConfirmed ? "Confirmed Delivered" : "In Fulfillment"}</strong>
                  </span>
                </div>
                {data.deliveredAt && (
                  <span className="text-slate-500 text-[11px]">
                    Delivered on: {new Date(data.deliveredAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Security Warning Notice */}
              <div className="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Logistics Security Notice:</strong>
                  <p className="mt-0.5 leading-relaxed text-[11px] text-amber-800">
                    A matching digital identity on this page proves that this product was registered and tracked on the ReturnChain blockchain. When picking up returns, verify that the physical serial number label matches <code className="font-mono font-bold">{data.serialNumber}</code>.
                  </p>
                </div>
              </div>

              {/* Blockchain Anchor */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Genesis Blockchain Anchor:</span>
                <BlockchainBadge txHash={data.txHash} />
              </div>
            </div>

            {/* 3. CHAIN-OF-CUSTODY MILESTONES (NO PII) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Cryptographic Chain-of-Custody Milestones
              </h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Sequential tracking recorded on smart contract (Customer private names and personal addresses are redacted).
              </p>

              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {data.lifecycleMilestones?.map((m, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={m.eventType} />
                        <span className="text-[11px] text-slate-400">
                          {new Date(m.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-slate-600 flex items-center gap-1.5 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{m.location}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700">Verified by {m.actorRole}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
