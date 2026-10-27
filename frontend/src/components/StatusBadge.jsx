import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, ShieldAlert } from "lucide-react";

export const StatusBadge = ({ status, className = "" }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const configs = {
    // Verification outcomes
    VERIFIED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck, label: "VERIFIED GENUINE" },
    VERIFIED_GENUINE: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Verified Genuine" },
    SUSPICIOUS: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: ShieldAlert, label: "SUSPICIOUS / FRAUD" },
    FLAGGED_SUSPICIOUS: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, label: "Flagged Suspicious" },
    MANUAL_REVIEW: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle, label: "MANUAL REVIEW" },
    PENDING: { bg: "bg-slate-50 text-slate-600 border-slate-200", icon: Clock, label: "Pending Verification" },
    PENDING_VERIFICATION: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending Verification" },

    // Lifecycle
    DELIVERED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Delivered" },
    DISPATCHED: { bg: "bg-sky-50 text-sky-700 border-sky-200", icon: Clock, label: "Dispatched" },
    IN_TRANSIT: { bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock, label: "In Transit" },
    RETURN_REQUESTED: { bg: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: AlertTriangle, label: "Return Requested" },
    RETURN_IN_TRANSIT: { bg: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock, label: "Return In Transit" },
    RETURN_RECEIVED: { bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Clock, label: "Received at Hub" },
    RECEIVED_AT_CENTER: { bg: "bg-purple-50 text-purple-700 border-purple-200", icon: Clock, label: "Received at Hub" },
    RETURN_VERIFIED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Return Verified" },
    RETURN_FLAGGED: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, label: "Return Flagged" },
    REFUNDED: { bg: "bg-teal-50 text-teal-700 border-teal-200", icon: CheckCircle2, label: "Refund Processed" },
    REFUND_APPROVED: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Refund Approved" },
    REFUND_REJECTED: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle, label: "Refund Rejected" },
    FLAGGED_INVESTIGATION: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: ShieldAlert, label: "Under Investigation" },

    // Product status
    REGISTERED: { bg: "bg-slate-100 text-slate-700 border-slate-300", icon: CheckCircle2, label: "Registered" },
    ASSIGNED_WAREHOUSE: { bg: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Clock, label: "Warehouse Staged" },

    // Risk levels
    CRITICAL: { bg: "bg-rose-100 text-rose-800 border-rose-300", icon: AlertTriangle, label: "CRITICAL RISK" },
    HIGH: { bg: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertTriangle, label: "HIGH RISK" },
    MEDIUM: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertTriangle, label: "MEDIUM RISK" },
    LOW: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck, label: "LOW RISK" },

    // Investigation status
    OPEN: { bg: "bg-rose-50 text-rose-700 border-rose-200", icon: AlertTriangle, label: "Open Investigation" },
    UNDER_INVESTIGATION: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Under Review" },
    RESOLVED_REJECTED: { bg: "bg-slate-100 text-slate-700 border-slate-300", icon: XCircle, label: "Resolved (Claim Denied)" },
    RESOLVED_APPROVED_EXCEPTION: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, label: "Resolved (Exception Approved)" },
  };

  const config = configs[normalized] || {
    bg: "bg-slate-50 text-slate-700 border-slate-200",
    icon: Clock,
    label: status.replace(/_/g, " "),
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
