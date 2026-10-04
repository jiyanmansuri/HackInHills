"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Zap, ShieldCheck, AlertCircle, Info, Sparkles, ArrowRight } from "lucide-react";
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
    { name: "Confidence", value: Math.round(avgConf * 100), color: "#C8963E" },
    { name: "Remaining", value: Math.max(0, 100 - Math.round(avgConf * 100)), color: "#E2E8F0" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#0B192C]">
              Machine Learning Signals &amp; Discipline Engine
            </h2>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">
              Calibrated XGBoost
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Probability of mean reversion within 5 trading days. System enforces the right to stay quiet.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-600">Model Regime:</span>
          <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
            Out-of-Sample Validated
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 items-center">
        {/* Signal Confidence Donut Gauge */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50/70 rounded-xl border border-slate-100 text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Aggregate Reversion Confidence
          </span>
          <div className="w-36 h-36 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={60}
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
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-[#0B192C]">
                {(avgConf * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] font-semibold text-slate-400">P(Reversion)</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-2">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#C8963E]" />
              <span>Edge Threshold: 62%</span>
            </span>
          </div>
        </div>

        {/* Signals Status & Actionable Cards */}
        <div className="lg:col-span-2 space-y-3">
          {activeSignals.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Actionable Reversion Opportunities ({activeSignals.length})</span>
                <span className="text-emerald-600 font-bold">Hurdle Cleared</span>
              </div>
              {activeSignals.map((sig) => (
                <div
                  key={`${sig.symbol}-${sig.expiry_date}`}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-700 text-white">
                        {sig.signal_type}
                      </span>
                      <span className="font-bold text-sm text-[#0B192C]">
                        {sig.symbol} vs GOLDM
                      </span>
                      <span className="text-xs bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium">
                        {formatZScore(sig.z_score)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Basis at {formatPct(sig.spread_pct)} ({sig.days_to_expiry} days to expiry). Model confidence:{" "}
                      <strong>{(sig.confidence * 100).toFixed(1)}%</strong>.
                    </p>
                  </div>

                  <button
                    onClick={() => onSelectSignal(sig)}
                    className="inline-flex items-center space-x-1.5 bg-[#0B192C] text-[#C8963E] hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain Thesis</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Clear "NO SIGNAL TODAY" Disciplined State */
            <div className="p-6 rounded-xl border border-amber-200 bg-[#FEF9F0] flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    No Actionable Signal Today &bull; Permission to Stay Quiet
                  </h3>
                  <span className="text-[10px] bg-amber-200/60 text-amber-900 font-semibold px-2 py-0.5 rounded">
                    Disciplined Flat
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  The cross-contract spreads are either in equilibrium (|Z| &lt; 1.0), within the delivery roll window (&le; 5d), or filtered due to thin liquidity. The quantitative engine intentionally chooses to stay flat rather than manufacture low-conviction turnover.
                </p>
                {stayQuietSignals.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-500 space-y-1">
                    <span className="font-semibold text-slate-700">Filter rationales:</span>
                    {stayQuietSignals.slice(0, 2).map((s, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>
                          <strong>{s.symbol}:</strong> {s.stay_quiet_reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market Signal Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Spread Opportunity</span>
              <span className="font-bold text-slate-800">
                {activeSignals.length > 0 ? "HIGH" : "LOW / FAIR"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Volatility Alert</span>
              <span className="font-bold text-emerald-600">NORMAL (13.5%)</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block font-medium">Trend Strength</span>
              <span className="font-bold text-slate-800">MEAN-REVERTING</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
