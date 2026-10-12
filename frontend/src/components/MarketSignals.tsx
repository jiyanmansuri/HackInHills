"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { SignalsResponse, SignalItem } from "@/lib/types";
import { formatPct, formatZScore } from "@/lib/utils";
import { Card } from "@/components/ui";

interface MarketSignalsProps {
  signalsData: SignalsResponse | null;
  onSelectSignal: (signal: SignalItem) => void;
}

export const MarketSignals: React.FC<MarketSignalsProps> = ({
  signalsData,
  onSelectSignal,
}) => {
  const activeSignals = signalsData?.signals.filter((s) => s.is_active) || [];
  const stayQuietSignals = signalsData?.signals.filter((s) => !s.is_active) || [];

  const avgConf = signalsData?.avg_confidence || 0.65;
  const bestOpportunity = signalsData?.best_opportunity;
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(null);

  // Top signal is the primary expanded card
  const topSignal = activeSignals[0];
  const secondarySignals = activeSignals.slice(1);

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Signal Discipline Engine</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Calibrated probability of mean reversion within 5 days.
            </p>
          </div>
          <span className="font-mono text-xs text-muted">Hurdle: 62%</span>
        </div>

        {/* Circular Confidence Donut Gauge */}
        <div className="mt-4 flex items-center justify-between p-3.5 bg-ground/60 rounded border border-line">
          <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 -rotate-90 transform" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="25"
                stroke="#DDE1E7"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="25"
                stroke={avgConf >= 0.62 ? "#067647" : "#A8741A"}
                strokeWidth="6"
                strokeDasharray={157}
                strokeDashoffset={157 - (157 * Math.min(100, Math.max(0, avgConf * 100))) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <span className="font-mono text-[13px] font-bold text-ink tabular-nums leading-none">
                {(avgConf * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="ml-3 flex-1 text-xs">
            <span className="font-medium text-ink block">
              {activeSignals.length > 0 ? "Actionable Dislocation" : "Disciplined Flat"}
            </span>
            <p className="text-muted mt-0.5 leading-snug">
              {activeSignals.length > 0
                ? `${activeSignals.length} front-month pair(s) cleared the 62% statistical hurdle.`
                : "Spreads in equilibrium band. System preserves capital by staying flat."}
            </p>
          </div>
        </div>

        {/* Active Signals or Compressed Filter Rationales */}
        <div className="mt-3.5 space-y-2.5">
          {activeSignals.length > 0 ? (
            <div className="space-y-2">
              {/* Primary Top Signal (Fully Expanded) */}
              {topSignal && (
                <div className="p-3.5 rounded border border-[#067647]/30 bg-[#067647]/5 text-xs flex flex-col justify-between">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#067647] text-white">
                          {topSignal.signal_type}
                        </span>
                        <span className="font-semibold text-ink text-sm">
                          {topSignal.symbol}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#067647] font-bold">
                        Conf: {(topSignal.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted">Relative Spread Z-Score</span>
                      <span className="font-mono text-ink font-bold text-sm tabular-nums">
                        {formatZScore(topSignal.z_score)}
                      </span>
                    </div>
                  </div>

                  {/* 4 Quantitative Operational Metric Rows */}
                  <div className="mt-2.5 pt-2 border-t border-[#067647]/20 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex justify-between pr-2">
                      <span className="text-muted">Basis:</span>
                      <span className="text-ink font-medium tabular-nums">{formatPct(topSignal.spread_pct)}</span>
                    </div>
                    <div className="flex justify-between pl-2 border-l border-[#067647]/20">
                      <span className="text-muted">Liquidity:</span>
                      <span className="text-ink font-medium">Institutional</span>
                    </div>
                    <div className="flex justify-between pr-2">
                      <span className="text-muted">Roll Window:</span>
                      <span className="text-ink font-medium tabular-nums">{topSignal.days_to_expiry}d exp</span>
                    </div>
                    <div className="flex justify-between pl-2 border-l border-[#067647]/20">
                      <span className="text-muted">Invalidation:</span>
                      <span className="text-[#B42318] font-medium">1.5× ATR adverse move</span>
                    </div>
                  </div>

                  {/* Prominent Explain Thesis Action */}
                  <div className="mt-3 pt-2 border-t border-[#067647]/20 flex justify-end">
                    <button
                      onClick={() => onSelectSignal(topSignal)}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#A8741A] hover:text-ink cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Explain Thesis with Claude</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Secondary Signals: Compact 1-line rows that expand on click */}
              {secondarySignals.map((sig) => {
                const isExpanded = expandedSignalId === `${sig.symbol}-${sig.expiry_date}`;
                return (
                  <div
                    key={`${sig.symbol}-${sig.expiry_date}`}
                    className="p-2.5 rounded border border-line bg-white text-xs hover:border-[#CBD5E1] transition-colors"
                  >
                    <div
                      onClick={() => setExpandedSignalId(isExpanded ? null : `${sig.symbol}-${sig.expiry_date}`)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#067647]/80 text-white">
                          {sig.signal_type}
                        </span>
                        <span className="font-medium text-ink">{sig.symbol}</span>
                      </div>
                      <div className="flex items-center space-x-3 font-mono text-[11px]">
                        <span className="text-ink font-semibold tabular-nums">{formatZScore(sig.z_score)}</span>
                        <span className="text-[#067647] font-semibold">{(sig.confidence * 100).toFixed(1)}%</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2.5 pt-2 border-t border-line text-[11px] font-mono space-y-2 animate-in fade-in duration-200">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between pr-2">
                            <span className="text-muted">Basis:</span>
                            <span className="text-ink font-medium tabular-nums">{formatPct(sig.spread_pct)}</span>
                          </div>
                          <div className="flex justify-between pl-2 border-l border-line">
                            <span className="text-muted">Liquidity:</span>
                            <span className="text-ink font-medium">Institutional</span>
                          </div>
                          <div className="flex justify-between pr-2">
                            <span className="text-muted">Roll Window:</span>
                            <span className="text-ink font-medium tabular-nums">{sig.days_to_expiry}d exp</span>
                          </div>
                          <div className="flex justify-between pl-2 border-l border-line">
                            <span className="text-muted">Invalidation:</span>
                            <span className="text-[#B42318] font-medium">1.5× ATR adverse move</span>
                          </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onSelectSignal(sig)}
                            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#A8741A] hover:underline cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Explain Thesis</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3.5 rounded border border-line bg-white text-xs">
              <div className="font-medium text-ink mb-2.5 flex items-center justify-between">
                <span>Filter Rationales</span>
                <span className="text-[11px] text-muted font-mono font-normal">3 pairs scanned</span>
              </div>

              {/* Compressed 1-line rationales with colored pill labels */}
              <div className="space-y-2">
                {stayQuietSignals.slice(0, 3).map((s, idx) => {
                  let pillText = "Inside Band";
                  let pillClass = "bg-ground text-muted border-line";

                  if (s.is_thin_liquidity || s.regime === "THIN_LIQUIDITY") {
                    pillText = "Thin Liquidity";
                    pillClass = "bg-amber-50 text-amber-800 border-amber-200";
                  } else if (s.days_to_expiry <= 5 || s.regime === "ROLL_WINDOW") {
                    pillText = "Roll Window";
                    pillClass = "bg-blue-50 text-blue-800 border-blue-200";
                  } else if (s.confidence < 0.62) {
                    pillText = "Low Conf";
                    pillClass = "bg-slate-100 text-slate-700 border-slate-200";
                  }

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-1.5 rounded bg-ground/40 border border-line/60 text-[11px]"
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <strong className="text-ink font-semibold">{s.symbol}:</strong>
                        <span className="font-mono text-muted tabular-nums">{formatZScore(s.z_score)}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border shrink-0 ${pillClass}`}>
                        {pillText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 4 Quantitative Operational Metric Rows for Baseline */}
              {bestOpportunity && (
                <div className="mt-3 pt-2.5 border-t border-line grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex justify-between pr-2">
                    <span className="text-muted">Basis:</span>
                    <span className="text-ink font-medium tabular-nums">{formatPct(bestOpportunity.spread_pct)}</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l border-line">
                    <span className="text-muted">Liquidity:</span>
                    <span className="text-ink font-medium">Institutional</span>
                  </div>
                  <div className="flex justify-between pr-2">
                    <span className="text-muted">Roll Window:</span>
                    <span className="text-ink font-medium tabular-nums">{bestOpportunity.days_to_expiry}d exp</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l border-line">
                    <span className="text-muted">Invalidation:</span>
                    <span className="text-muted font-medium">1.5× ATR adverse move</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
        <span>Model: Out-of-Sample XGBoost</span>
        <span className="font-mono">Liquidity: Strict (₹100k+ Vol)</span>
      </div>
    </Card>
  );
};
