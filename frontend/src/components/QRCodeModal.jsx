import React, { useState, useEffect } from "react";
import { X, Copy, Check, ExternalLink, QrCode, Download, ShieldCheck, Smartphone, Terminal } from "lucide-react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";

export const QRCodeModal = ({ product, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrMode, setQrMode] = useState("url"); // "url" | "json"
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!product || !isOpen) return;

    const generateRealQRCode = async () => {
      setGenerating(true);
      try {
        const verifyUrl = `${window.location.origin}/verify/${product.productId}`;
        const jsonPayload = JSON.stringify({
          productId: product.productId,
          serialNumber: product.serialNumber || "",
          productHash: product.productHash || "",
          name: product.name,
          manufacturer: product.manufacturer,
          anchorTx: product.txHash || "",
        });

        const targetData = qrMode === "url" ? verifyUrl : jsonPayload;

        const dataUrl = await QRCode.toDataURL(targetData, {
          errorCorrectionLevel: "H",
          margin: 2,
          width: 360,
          color: {
            dark: "#0f172a", // Dark navy contrast
            light: "#ffffff",
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("QR Code generation error:", err);
      } finally {
        setGenerating(false);
      }
    };

    generateRealQRCode();
  }, [product, isOpen, qrMode]);

  if (!isOpen || !product) return null;

  const verifyUrl = `${window.location.origin}/verify/${product.productId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `ReturnChain-QR-${product.productId}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Unique Product QR Passport</h3>
              <p className="text-[11px] text-slate-500 font-mono">{product.productId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Mode Selector */}
        <div className="mt-3 flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setQrMode("url")}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              qrMode === "url" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Camera URL</span>
          </button>
          <button
            onClick={() => setQrMode("json")}
            className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              qrMode === "json" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Scanner Terminal JSON</span>
          </button>
        </div>

        {/* Real QR Code Presentation */}
        <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 relative">
            {generating ? (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                Generating standard QR...
              </div>
            ) : qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ${product.productId}`}
                className="w-52 h-52 object-contain rounded-md"
              />
            ) : null}
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-900 text-white opacity-85">
              ISO 18004
            </div>
          </div>

          <div className="mt-3 text-center">
            <h4 className="text-xs font-bold text-slate-900">{product.name}</h4>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Serial: <span className="font-semibold text-slate-800">{product.serialNumber || "N/A"}</span>
            </p>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Standard High-Density QR: Scannable by any smartphone camera</span>
          </div>
        </div>

        {/* Public Link Box */}
        <div className="mt-4">
          <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            Verification Destination
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={qrMode === "url" ? verifyUrl : `[Serialized Payload for ${product.productId}]`}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono focus:outline-none"
            />
            <button
              onClick={copyUrl}
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={downloadQR}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PNG</span>
          </button>

          <Link
            to={`/verify/${product.productId}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Simulate Delivery Scan</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
