"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { SignalsResponse, SignalItem } from "@/lib/types";
import { formatPct, formatZScore } from "@/lib/utils";

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
    { name: "Confidence", value: Math.round(avgConf * 100), color: "#B8860B" },
    { name: "Remaining", value: Math.max(0, 100 - Math.round(avgConf * 100)), color: "#E2E8F0" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Signal Engine &amp; Discipline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Calibrated probability of mean reversion within 5 days.
            </p>
          </div>
          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
            Edge: 62%
          </span>
        </div>

        {/* Gauge + Status summary */}
        <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-50/70 rounded-xl border border-slate-100">
          <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={36}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-sm font-bold text-slate-900 tabular-nums block leading-tight">
                {(avgConf * 100).toFixed(0)}%
              </span>
              <span className="text-[8px] text-slate-400 font-medium">Conf</span>
            </div>
          </div>

          <div className="ml-3 flex-1 text-xs">
            <span className="font-semibold text-slate-800 block">
              {activeSignals.length > 0 ? "Actionable Dislocation" : "Disciplined Flat Regime"}
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              {activeSignals.length > 0
                ? `${activeSignals.length} pair(s) cleared edge hurdle and liquidity threshold.`
                : "Spreads in fair-value band. System enforces permission to stay quiet."}
            </p>
          </div>
        </div>

        {/* Actionable or Stay Quiet list */}
        <div className="mt-3.5 space-y-2">
          {activeSignals.length > 0 ? (
            activeSignals.map((sig) => (
              <div
                key={`${sig.symbol}-${sig.expiry_date}`}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-1.5 font-semibold text-slate-900">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-700 text-white">
                      {sig.signal_type}
                    </span>
                    <span>{sig.symbol} vs GOLDM</span>
                    <span className="text-[11px] text-slate-500 tabular-nums font-mono">
                      {formatZScore(sig.z_score)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Basis: {formatPct(sig.spread_pct)} &bull; Conf: {(sig.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <button
                  onClick={() => onSelectSignal(sig)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 hover:text-amber-800 cursor-pointer p-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-700 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Permission to Stay Quiet</span>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                {stayQuietSignals.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="truncate">
                      <strong>{s.symbol}:</strong> {s.stay_quiet_reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Model: Out-of-Sample XGBoost</span>
        <span>Filter: Strict Liquidity</span>
      </div>
    </div>
  );
};
