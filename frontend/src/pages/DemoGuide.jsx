import React from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  QrCode,
  Package,
  Layers,
  SearchCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";

export const DemoGuide = () => {
  return (
    <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-slate-200">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Evaluation Showcase</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          ReturnChain Academic & Demonstration Scenarios
        </h1>
        <p className="text-xs text-slate-500 max-w-xl mx-auto">
          Explore the two end-to-end business workflows demonstrating blockchain digital product passports and rule-based fraud detection.
        </p>
      </div>

      {/* Two Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scenario A Card: Legitimate Return */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -z-0"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                SCENARIO A
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Genuine Match
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-4">
              Legitimate Product Return Workflow
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              End-to-end verified return where the physical item matches the digital identity passport and recorded custody history.
            </p>

            {/* Step-by-Step Flow */}
            <div className="mt-5 space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-800">Product Registered:</strong>
                  <p className="text-slate-500 text-[11px]">
                    iPhone 15 Pro (<code className="text-blue-600 font-bold">RC-PROD-1001</code>, SN: <code className="text-slate-700">SN-IP15-99881</code>).
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-800">Order Dispatched & Delivered:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Order <code className="text-slate-700">RC-ORD-5001</code> delivered to customer doorstep with electronic signature.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-800">Customer Files Return:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Return <code className="text-blue-600 font-bold">RC-RET-8001</code> created. Received at Return Center.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-800">Inspection & Verification:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Physical barcode scan matches <code className="text-emerald-700 font-bold">RC-PROD-1001</code>. Seal intact. All 10 fraud rules pass!
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 font-semibold flex items-center justify-between">
                <span>Verdict: GREEN — VERIFIED</span>
                <span className="text-[11px] underline">Refund Authorized</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <Link
              to="/verify-center?returnId=RC-RET-8001"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Scenario A in Inspection Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Scenario B Card: Product Substitution Fraud */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-rose-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-2xl -z-0"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                SCENARIO B
              </span>
              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Substitution Fraud
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mt-4">
              Product Substitution Fraud Detection
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Buyer attempts to return cheap generic earbuds in place of high-value Sony WH-1000XM5 wireless headphones ($399).
            </p>

            {/* Step-by-Step Flow */}
            <div className="mt-5 space-y-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-800">Order for High-Value Item:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Order <code className="text-slate-700">RC-ORD-5002</code> for Sony Headphones (<code className="text-blue-600 font-bold">RC-PROD-2001</code>).
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-800">Return Request Filed:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Return <code className="text-slate-700 font-bold">RC-RET-8002</code> filed claiming "defective bluetooth".
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-800">Substituted Item Received:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Physical box contains generic earbuds (<code className="text-rose-600 font-bold">RC-PROD-2002</code>, SN: <code className="text-slate-700">SN-CHEAP-0012</code>).
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-800">Rule-Based Detection Triggered:</strong>
                  <p className="text-slate-500 text-[11px]">
                    Flags <code className="text-rose-700 font-bold">PRODUCT_ID_MISMATCH</code> & <code className="text-rose-700 font-bold">SERIAL_MISMATCH</code>! Creates open Fraud Case.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 font-semibold flex items-center justify-between">
                <span>Verdict: RED — SUSPICIOUS</span>
                <span className="text-[11px] underline">Investigation Opened</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <Link
              to="/verify-center?returnId=RC-RET-8002"
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch Scenario B in Inspection Center</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Evaluation Highlights */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8">
        <h3 className="text-sm font-bold text-slate-100">Key Architectural Innovations Demonstrated</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <strong className="block text-blue-400 font-semibold mb-1">Product Digital Identity</strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Verifies the physical product against its cryptographic blockchain passport, not merely the centralized order number.
            </p>
          </div>
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <strong className="block text-emerald-400 font-semibold mb-1">Tamper-Proof Custody</strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Every handoff from seller factory to courier doorstep is anchored on-chain with legal state transitions.
            </p>
          </div>
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700">
            <strong className="block text-amber-400 font-semibold mb-1">Deterministic Fraud Rules</strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              10 transparent, deterministic fraud checks prevent product substitution, counterfeit swaps, and invalid return claims.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
