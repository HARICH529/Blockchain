import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { productApi } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { BlockchainBadge } from "../components/BlockchainBadge";
import { QRCodeModal } from "../components/QRCodeModal";
import {
  Package,
  QrCode,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  Building,
  Hash,
  ExternalLink,
  Clock,
  MapPin,
  CheckCircle,
} from "lucide-react";

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [custodyEvents, setCustodyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await productApi.getById(id);
        if (res.data.success) {
          setProduct(res.data.product);
          setCustodyEvents(res.data.custodyEvents || []);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
        Loading product passport & custody records...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <h3 className="text-sm font-bold text-slate-800">Product Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">Product '{id}' does not exist in registry.</p>
        <Link to="/products" className="mt-4 inline-block px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link to="/products" className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-mono font-semibold">{product.productId}</span>
      </div>

      {/* Main Passport Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{product.name}</h1>
                <StatusBadge status={product.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Internal ID: <span className="font-semibold text-blue-600">{product.productId}</span> • Serial:{" "}
                <span className="font-semibold text-slate-800">{product.serialNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Digital QR Passport</span>
            </button>
            <Link
              to={`/verify/${product.productId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Verification</span>
            </Link>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium">Category</span>
            <p className="font-semibold text-slate-800 mt-0.5">{product.category}</p>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium">Manufacturer / Model</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {product.manufacturer} • {product.model || "Standard"}
            </p>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium">Selling Price</span>
            <p className="font-semibold text-slate-800 mt-0.5">${product.price}</p>
          </div>
          <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
            <span className="text-slate-400 font-medium">Seller Organization</span>
            <p className="font-semibold text-slate-800 mt-0.5 truncate">
              {product.seller?.organization || product.seller?.name || "Apex Electronics"}
            </p>
          </div>
        </div>

        {/* Blockchain Proof Bar */}
        <div className="mt-5 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-700">Anchored Transaction:</span>
            <BlockchainBadge txHash={product.txHash} blockNumber={product.blockNumber} />
          </div>
          <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
            Spec Hash: {product.productHash || "0x..."}
          </div>
        </div>
      </div>

      {/* Chain-of-Custody Timeline */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="pb-3 border-b border-slate-100 mb-6">
          <h2 className="text-sm font-bold text-slate-900">Cryptographic Chain-of-Custody Milestones</h2>
          <p className="text-xs text-slate-500">
            Verifiable journey checkpoints recorded by authorized sellers, couriers, and return inspectors
          </p>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {custodyEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No custody events recorded for this product.</p>
          ) : (
            custodyEvents.map((event, idx) => (
              <div key={idx} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 hover:border-blue-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={event.eventType} />
                      <span className="text-xs font-bold text-slate-800">
                        {event.actor?.name || event.actorRole}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{event.location || "Logistics Hub"}</span>
                  </div>

                  {event.notes && (
                    <p className="mt-1.5 text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                      "{event.notes}"
                    </p>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono">
                      Role Actor: <strong className="text-slate-700">{event.actorRole}</strong>
                    </span>
                    <BlockchainBadge txHash={event.txHash} blockNumber={event.blockNumber} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <QRCodeModal product={product} isOpen={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
};
