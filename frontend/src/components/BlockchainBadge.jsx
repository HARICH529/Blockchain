import React, { useState } from "react";
import { Link2, Check, ExternalLink, ShieldCheck } from "lucide-react";

export const BlockchainBadge = ({ txHash, blockNumber, isSynced = true, size = "md" }) => {
  const [copied, setCopied] = useState(false);

  if (!txHash) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
        <span>No On-Chain Tx</span>
      </span>
    );
  }

  const shortHash = `${txHash.slice(0, 8)}...${txHash.slice(-6)}`;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div
        onClick={handleCopy}
        title={`Click to copy transaction hash: ${txHash}`}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer group"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>{shortHash}</span>
        {copied ? (
          <Check className="w-3 h-3 text-emerald-600" />
        ) : (
          <Link2 className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        )}
      </div>
      {blockNumber > 0 && (
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline" title="Block Number">
          blk #{blockNumber}
        </span>
      )}
    </div>
  );
};
