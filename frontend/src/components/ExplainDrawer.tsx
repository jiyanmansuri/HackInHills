"use client";

import React, { useEffect, useState } from "react";
import { X, Sparkles, AlertCircle, ShieldAlert, Cpu, CheckCircle } from "lucide-react";
import { SignalItem, ExplainResponse } from "@/lib/types";
import { requestExplanation } from "@/lib/api";
import { formatZScore, formatPct } from "@/lib/utils";

interface ExplainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  signal: Partial<SignalItem> | null;
}

export const ExplainDrawer: React.FC<ExplainDrawerProps> = ({
  isOpen,
  onClose,
  signal,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanationData, setExplanationData] = useState<ExplainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !signal) {
      setExplanationData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    requestExplanation(signal)
      .then((data) => {
        if (isMounted) {
          setExplanationData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load explanation");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, signal]);

  if (!isOpen || !signal) return null;

  // Format explanation markdown into clean, structured UI cards without stray hashes
  const renderFormattedExplanation = (rawText: string) => {
    let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    
    // Strip redundant title header and expiry line if present at top
    text = text.replace(/^#+\s*(Relative Value|Quantitative|Market Intelligence)[^\n]*\n+/i, "");
    text = text.replace(/^\*\*Expiry:\*\*[^\n]*\n+/i, "");

    // Split into sections by markdown headings (#### or ### or ##)
    const sections = text.split(/(?=^#{2,4}\s+)/m);

    return sections.map((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return null;

      const headerMatch = trimmed.match(/^#{2,4}\s+(.*?)(?:\n|$)/);
      const heading = headerMatch ? headerMatch[1].replace(/^#+\s*/, "").trim() : null;
      const body = headerMatch ? trimmed.slice(headerMatch[0].length).trim() : trimmed;

      const isInvalidation = heading?.toLowerCase().includes("invalidation");
      const isRisk = heading?.toLowerCase().includes("risk");

      const lines = body.split("\n");

      return (
        <div
          key={idx}
          className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
            isInvalidation
              ? "bg-rose-50/70 border-rose-200/80 text-rose-950"
              : isRisk
              ? "bg-amber-50/60 border-amber-200/80 text-amber-950"
              : "bg-slate-50 border-slate-200/80 text-slate-800"
          }`}
        >
          {heading && (
            <h4
              className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center space-x-1.5 ${
                isInvalidation
                  ? "text-rose-900"
                  : isRisk
                  ? "text-amber-900"
                  : "text-[#0B192C]"
              }`}
            >
              <span>{heading}</span>
            </h4>
          )}
          <div className="space-y-2">
            {lines.map((line, lIdx) => {
              const lineTrimmed = line.trim();
              if (!lineTrimmed || lineTrimmed.startsWith("---") || lineTrimmed.startsWith("*Notice:")) {
                return null;
              }

              const isBullet = lineTrimmed.startsWith("- ") || lineTrimmed.startsWith("* ");
              let cleanContent = isBullet ? lineTrimmed.replace(/^[-*]\s+/, "") : lineTrimmed;
              
              // Remove any leftover hash characters
              cleanContent = cleanContent.replace(/#+/g, "");

              // Convert bold markdown
              cleanContent = cleanContent.replace(
                /\*\*(.*?)\*\*/g,
                '<strong class="font-semibold text-slate-900">$1</strong>'
              );

              if (isBullet) {
                return (
                  <div key={lIdx} className="flex items-start space-x-2 pl-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        isInvalidation
                          ? "bg-rose-500"
                          : isRisk
                          ? "bg-amber-500"
                          : "bg-[#C8963E]"
                      }`}
                    />
                    <span
                      className="flex-1"
                      dangerouslySetInnerHTML={{ __html: cleanContent }}
                    />
                  </div>
                );
              }

              return (
                <p
                  key={lIdx}
                  dangerouslySetInnerHTML={{ __html: cleanContent }}
                />
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300 max-h-screen">
        {/* Drawer Header (Fixed) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B192C] text-[#C8963E] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-[#0B192C]">
                  Quantitative Market Intelligence
                </h3>
                {explanationData && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      explanationData.is_fallback
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-purple-50 text-purple-700 border-purple-200"
                    }`}
                  >
                    {explanationData.is_fallback ? "Deterministic Engine" : "Claude 3.5 Sonnet"}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {signal.symbol} vs GOLDM &bull; Matched Expiry Arbitrage Surveillance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Signal Snapshot Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-[#FEF9F0] border border-[#E8D3AE] rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-[#8A5816] block uppercase font-medium">30d Z-Score</span>
              <span className="font-bold text-[#0B192C] text-sm">
                {formatZScore(signal.z_score)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A5816] block uppercase font-medium">Basis %</span>
              <span className="font-bold text-[#0B192C] text-sm">
                {formatPct(signal.spread_pct || 0)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8A5816] block uppercase font-medium">Reversion Prob</span>
              <span className="font-bold text-emerald-700 text-sm">
                {((signal.confidence || 0.65) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 py-8">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Cpu className="w-4 h-4 text-[#C8963E] animate-spin" />
                <span>Synthesizing quant commentary &amp; execution risk thesis...</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-4 bg-slate-200/70 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-200/70 rounded w-full animate-pulse" />
                <div className="h-4 bg-slate-200/70 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-slate-200/70 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Failed to retrieve commentary</strong>
                <span>{error}</span>
              </div>
            </div>
          ) : explanationData ? (
            <div className="space-y-3">
              {renderFormattedExplanation(explanationData.explanation)}
            </div>
          ) : null}
        </div>

        {/* Drawer Footer Disclaimer (Fixed) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Decision-support analytics. Not investment advice.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
