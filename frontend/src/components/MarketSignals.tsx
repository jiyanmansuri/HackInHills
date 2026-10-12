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
        <div className="mt-4 flex items-center justify-between p-3 bg-ground/60 rounded border border-line">
          <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={22}
                  outerRadius={30}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="font-mono text-xs font-semibold text-ink tabular-nums block leading-tight">
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
                className="p-3 rounded border border-pos/20 bg-pos/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-1.5 font-medium text-ink">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-pos text-white">
                      {sig.signal_type}
                    </span>
                    <span>{sig.symbol} vs GOLDM</span>
                    <span className="font-mono text-muted tabular-nums">
                      {formatZScore(sig.z_score)}
                    </span>
                  </div>
                  <div className="text-muted mt-0.5 font-mono text-[11px] tabular-nums">
                    Basis: {formatPct(sig.spread_pct)} &bull; Conf: {(sig.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <button
                  onClick={() => onSelectSignal(sig)}
                  className="inline-flex items-center space-x-1 text-xs font-medium text-gold hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-3 rounded border border-line bg-white text-xs">
              <div className="font-medium text-ink mb-1.5 flex items-center justify-between">
                <span>Filter Rationales</span>
                <span className="text-[11px] text-muted font-normal">3 pairs scanned</span>
              </div>
              <div className="text-muted space-y-1.5 text-[11.5px]">
                {stayQuietSignals.slice(0, 3).map((s, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
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
