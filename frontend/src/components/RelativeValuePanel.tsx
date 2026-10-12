"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus, Sparkles, Clock } from "lucide-react";
import { RelativeValueRecord, SignalItem } from "@/lib/types";
import { formatPct, formatZScore, formatDate } from "@/lib/utils";
import { Card, Label } from "@/components/ui";

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
    <Card className="p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-line gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">
            Cross-Contract Relative Value Matrix (vs GOLDM Benchmark)
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Expiry-matched pairwise basis and rolling 30-day standardized z-score dislocations.
          </p>
        </div>
        <span className="text-xs text-muted font-mono self-start sm:self-auto">
          Reference: <strong>GOLDM (100g)</strong>
        </span>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-line text-muted font-medium uppercase tracking-wider text-[11px]">
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
          <tbody className="divide-y divide-line">
            {frontSpreads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-6 text-center text-xs text-muted">
                  No active basis dislocations detected — spreads are currently within fair-value boundaries.
                </td>
              </tr>
            ) : (
              frontSpreads.map((row) => {
                const absZ = Math.abs(row.z_score_30d || 0);

                let zBadgeClass = "text-pos";
                let zLabel = "Equilibrium";
                if (absZ >= 2.0) {
                  zBadgeClass = "text-neg font-semibold";
                  zLabel = "High Dislocation";
                } else if (absZ >= 1.0) {
                  zBadgeClass = "text-gold font-semibold";
                  zLabel = "Moderate Dislocation";
                }

                return (
                  <tr key={`${row.symbol}-${row.expiry_date}`} className="hover:bg-ground/50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-ink flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-gold" />
                      <span>{row.symbol}</span>
                      <span className="text-muted font-normal text-[11px]">vs GOLDM</span>
                    </td>

                    <td className="py-3 px-3 text-muted">
                      <div className="font-medium text-ink">{formatDate(row.expiry_date)}</div>
                      <div className="text-[10px] text-muted font-mono">
                        {row.days_to_expiry}d to exp
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-ink tabular-nums">
                      {row.spread_abs > 0 ? "+" : ""}
                      {row.spread_abs.toFixed(2)} ₹/g
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 font-mono text-xs tabular-nums ${
                          row.spread_pct > 0
                            ? "text-neg"
                            : row.spread_pct < 0
                            ? "text-pos"
                            : "text-muted"
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
                      <span className={`font-mono text-xs tabular-nums ${zBadgeClass}`}>
                        {formatZScore(row.z_score_30d)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-ink text-xs">
                      {zLabel}
                    </td>

                    <td className="py-3 px-3 text-xs">
                      {row.is_thin_liquidity ? (
                        <span className="text-gold font-medium">Thin</span>
                      ) : (
                        <span className="text-muted font-normal">Institutional</span>
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
                        className="inline-flex items-center space-x-1 text-xs text-gold hover:underline cursor-pointer font-medium"
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
    </Card>
  );
};
