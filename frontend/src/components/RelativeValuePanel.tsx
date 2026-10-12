"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Sparkles, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { RelativeValueRecord, SignalItem } from "@/lib/types";
import { formatPct, formatZScore, formatDate } from "@/lib/utils";

interface RelativeValuePanelProps {
  spreads: RelativeValueRecord[];
  onSelectSignal: (signal: Partial<SignalItem>) => void;
}

export const RelativeValuePanel: React.FC<RelativeValuePanelProps> = ({
  spreads,
  onSelectSignal,
}) => {
  // Filter for front-month contract per symbol for clean matrix display
  const frontSpreads = React.useMemo(() => {
    const symbolMap = new Map<string, RelativeValueRecord>();
    spreads.forEach((item) => {
      if (!symbolMap.has(item.symbol) || item.days_to_expiry < symbolMap.get(item.symbol)!.days_to_expiry) {
        symbolMap.set(item.symbol, item);
      }
    });
    return Array.from(symbolMap.values());
  }, [spreads]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Cross-Contract Relative Value Matrix (vs GOLDM Benchmark)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Expiry-matched pairwise basis and rolling 30-day standardized z-score dislocations.
          </p>
        </div>
        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium self-start sm:self-auto">
          Reference: <strong>GOLDM (100g)</strong>
        </span>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-2.5 pr-4">Contract Pair</th>
              <th className="pb-2.5 px-3">Matched Expiry</th>
              <th className="pb-2.5 px-3">Basis (INR / g)</th>
              <th className="pb-2.5 px-3">Basis %</th>
              <th className="pb-2.5 px-3">30-Day Z-Score</th>
              <th className="pb-2.5 px-3">Regime</th>
              <th className="pb-2.5 px-3">Liquidity Depth</th>
              <th className="pb-2.5 pl-3 text-right">AI Thesis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {frontSpreads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                  No active basis dislocations detected — spreads are currently within fair-value boundaries.
                </td>
              </tr>
            ) : (
              frontSpreads.map((row) => {
                const absZ = Math.abs(row.z_score_30d || 0);

                let zBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                let zLabel = "Equilibrium";
                if (absZ >= 2.0) {
                  zBadgeClass = "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
                  zLabel = "High Dislocation";
                } else if (absZ >= 1.0) {
                  zBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                  zLabel = "Moderate Dislocation";
                }

                return (
                  <tr key={`${row.symbol}-${row.expiry_date}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pr-4 font-semibold text-slate-900 flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      <span>{row.symbol}</span>
                      <span className="text-slate-400 font-normal text-[11px]">vs GOLDM</span>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-medium text-slate-800">{formatDate(row.expiry_date)}</div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3 inline" />
                        <span>{row.days_to_expiry}d to exp</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-900 tabular-nums">
                      {row.spread_abs > 0 ? "+" : ""}
                      {row.spread_abs.toFixed(2)} ₹/g
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold text-xs tabular-nums ${
                          row.spread_pct > 0
                            ? "bg-rose-50 text-rose-700"
                            : row.spread_pct < 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {row.spread_pct > 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5 inline" />
                        ) : row.spread_pct < 0 ? (
                          <ArrowDownRight className="w-3.5 h-3.5 inline" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 inline" />
                        )}
                        <span>{formatPct(row.spread_pct)}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center border px-2.5 py-0.5 rounded-full font-semibold text-xs tabular-nums ${zBadgeClass}`}
                      >
                        {formatZScore(row.z_score_30d)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">
                      <span className="text-xs">{zLabel}</span>
                    </td>

                    <td className="py-3 px-3">
                      {row.is_thin_liquidity ? (
                        <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Thin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>Institutional</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 pl-3 text-right">
                      <button
                        onClick={() =>
                          onSelectSignal({
                            symbol: row.symbol,
                            expiry_date: row.expiry_date,
                            spread_abs: row.spread_abs,
                            spread_pct: row.spread_pct,
                            z_score: row.z_score_30d || 0,
                            days_to_expiry: row.days_to_expiry,
                            is_thin_liquidity: row.is_thin_liquidity,
                            regime: row.regime,
                            confidence: 0.72,
                            signal_type: (row.z_score_30d || 0) > 1.0 ? "SELL_SPREAD" : "BUY_SPREAD",
                          })
                        }
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Explain</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
