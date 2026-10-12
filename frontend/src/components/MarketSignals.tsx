"use client";

import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
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
            activeSignals.map((sig) => (
              <div
                key={`${sig.symbol}-${sig.expiry_date}`}
                className="p-3.5 rounded border border-[#067647]/30 bg-[#067647]/5 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-medium text-ink">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#067647] text-white">
                      {sig.signal_type}
                    </span>
                    <span className="font-semibold">{sig.symbol} vs GOLDM</span>
                    <span className="font-mono text-ink font-semibold tabular-nums">
                      {formatZScore(sig.z_score)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#067647] font-bold">
                    Conf: {(sig.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {/* 4 Quantitative Operational Metric Rows */}
                <div className="mt-2.5 pt-2 border-t border-[#067647]/20 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex justify-between pr-2">
                    <span className="text-muted">Basis:</span>
                    <span className="text-ink font-medium tabular-nums">{formatPct(sig.spread_pct)}</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l border-[#067647]/20">
                    <span className="text-muted">Liquidity:</span>
                    <span className="text-ink font-medium">Institutional</span>
                  </div>
                  <div className="flex justify-between pr-2">
                    <span className="text-muted">Roll Window:</span>
                    <span className="text-ink font-medium tabular-nums">{sig.days_to_expiry}d exp</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l border-[#067647]/20">
                    <span className="text-muted">Invalidation:</span>
                    <span className="text-[#B42318] font-medium">&gt; 1.5&times; ATR</span>
                  </div>
                </div>

                {/* Prominent Explain Thesis Action */}
                <div className="mt-3 pt-2 border-t border-[#067647]/20 flex justify-end">
                  <button
                    onClick={() => onSelectSignal(sig)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#A8741A] hover:text-ink cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain Thesis with Claude</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
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
                        <strong className="text-ink font-semibold">{s.symbol} vs GOLDM:</strong>
                        <span className="font-mono text-muted tabular-nums">{formatZScore(s.z_score)}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border shrink-0 ${pillClass}`}>
                        {pillText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 4 Quantitative Operational Metric Rows for Equilibrium Baseline */}
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
                    <span className="text-muted font-medium">&gt; 1.5&times; ATR</span>
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
