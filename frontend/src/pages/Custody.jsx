import React, { useState, useEffect } from "react";
import { custodyApi, productApi } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import {
  Link2,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  User,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";

export const Custody = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [custodyData, setCustodyData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await productApi.getAll();
        if (res.data.success && res.data.products.length > 0) {
          setProducts(res.data.products);
          setSelectedProductId(res.data.products[0].productId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadTimeline(selectedProductId);
    }
  }, [selectedProductId]);

  const loadTimeline = async (pId) => {
    try {
      setLoading(true);
      const res = await custodyApi.getByProductId(pId);
      if (res.data.success) {
        setCustodyData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const events = custodyData?.events || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chain of Custody Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-resistant chronological timeline tracing lifecycle milestones from factory genesis to return intake
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-800 focus:outline-none"
          >
            {products.map((p) => (
              <option key={p.productId} value={p.productId}>
                {p.productId} — {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadTimeline(selectedProductId)}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selected Product Banner */}
      {custodyData && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{custodyData.productName}</h3>
                <StatusBadge status={custodyData.currentStatus} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Passport ID: <span className="font-semibold text-blue-600">{custodyData.productId}</span> • Total Recorded Milestones:{" "}
                <span className="font-bold text-slate-800">{custodyData.totalMilestones}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Card */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="pb-4 border-b border-slate-100 mb-6">
          <h2 className="text-sm font-bold text-slate-900">Chronological Event Timeline</h2>
          <p className="text-xs text-slate-500">
            Each event is cryptographically hashed and verified against the smart contract state
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Querying custody history from blockchain...
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">No custody events recorded for this item.</p>
        ) : (
          <div className="relative pl-8 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {events.map((event, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-8 top-1 w-7 h-7 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-bold text-blue-600">{idx + 1}</span>
                </div>

                <div className="bg-slate-50/90 hover:bg-slate-50 p-4 rounded-xl border border-slate-200 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.eventType} />
                      <span className="text-xs font-bold text-slate-800">
                        {event.actor?.name || event.actorRole}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                        {event.actorRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Location: <strong>{event.location}</strong></span>
                  </div>

                  {event.notes && (
                    <p className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80">
                      "{event.notes}"
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="text-slate-400 font-mono truncate max-w-sm">
                      Data Hash: {event.dataHash || "0x000..."}
                    </div>
                    <BlockchainBadge txHash={event.txHash} blockNumber={event.blockNumber} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
