"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Sparkles, ArrowRight } from "lucide-react";
import { SignalsResponse, SignalItem } from "@/lib/types";
import { formatPct, formatZScore } from "@/lib/utils";
import { Card, Label } from "@/components/ui";

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
  const gaugeData = [
    { name: "Confidence", value: Math.round(avgConf * 100), color: "#A8741A" },
    { name: "Remaining", value: Math.max(0, 100 - Math.round(avgConf * 100)), color: "#DDE1E7" },
  ];

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">Signal Discipline Engine</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Calibrated probability of mean reversion within 5 days.
            </p>
          </div>
          <span className="font-mono text-xs text-muted">Hurdle: 62%</span>
        </div>

        {/* Donut confidence gauge */}
        <div className="mt-4 flex items-center justify-between p-3.5 bg-ground/60 rounded border border-line">
          <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
            {/* SVG Donut Ring that never collapses */}
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
                ? `${activeSignals.length} pair(s) cleared hurdle and liquidity threshold.`
                : "Spreads in equilibrium band. System preserves edge by staying flat."}
            </p>
          </div>
        </div>

        {/* Signals list */}
        <div className="mt-3.5 space-y-2">
          {activeSignals.length > 0 ? (
            activeSignals.map((sig) => (
              <div
                key={`${sig.symbol}-${sig.expiry_date}`}
                className="p-3.5 rounded border border-pos/30 bg-pos/5 text-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-medium text-ink">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pos text-white">
                      {sig.signal_type}
                    </span>
                    <span className="font-semibold">{sig.symbol} vs GOLDM</span>
                    <span className="font-mono text-ink font-semibold tabular-nums">
                      {formatZScore(sig.z_score)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-pos font-semibold">
                    Conf: {(sig.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                {/* 4 Quantitative Operational Metric Rows */}
                <div className="mt-2.5 pt-2 border-t border-pos/20 grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="flex justify-between pr-2">
                    <span className="text-muted">Basis:</span>
                    <span className="text-ink font-medium">{formatPct(sig.spread_pct)}</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l border-pos/20">
                    <span className="text-muted">Liquidity:</span>
                    <span className="text-ink font-medium">₹100k+ Vol</span>
                  </div>
                  <div className="flex justify-between pr-2">
                    <span className="text-muted">Roll Window:</span>
                    <span className="text-ink font-medium">{sig.days_to_expiry}d exp</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l border-pos/20">
                    <span className="text-muted">Invalidation:</span>
                    <span className="text-neg font-medium">&gt; 1.5&times; ATR</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-pos/20 flex justify-end">
                  <button
                    onClick={() => onSelectSignal(sig)}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gold hover:text-ink cursor-pointer transition-colors"
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
              <div className="font-medium text-ink mb-2 flex items-center justify-between">
                <span>Filter Rationales</span>
                <span className="text-[11px] text-muted font-mono font-normal">3 pairs scanned</span>
              </div>
              <div className="text-muted space-y-2 text-[11.5px]">
                {stayQuietSignals.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span className="leading-tight">
                      <strong className="text-ink font-medium">{s.symbol}:</strong> {s.stay_quiet_reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
        <span>Model: Out-of-Sample XGBoost</span>
        <span className="font-mono">Liquidity: Strict</span>
      </div>
    </Card>
  );
};
