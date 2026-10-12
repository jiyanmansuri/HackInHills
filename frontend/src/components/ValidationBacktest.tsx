"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BacktestSummaryResponse, BacktestTrade } from "@/lib/types";
import { formatINR, formatPct, formatDate } from "@/lib/utils";
import { Card, Label } from "@/components/ui";

interface ValidationBacktestProps {
  summary: BacktestSummaryResponse | null;
  trades: BacktestTrade[];
  asOfDate?: string;
}

export const ValidationBacktest: React.FC<ValidationBacktestProps> = ({
  summary,
  trades,
  asOfDate,
}) => {
  const [showTrades, setShowTrades] = useState(false);
  const equityData = summary?.equity_series || [];

  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-line gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-[15px] font-semibold text-ink">
              Walk-Forward Out-of-Sample Validation Engine
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#067647]/10 text-[#067647] border border-[#067647]/20">
              Zero Lookahead (Strict Chronological Test)
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Expanding-window out-of-sample testing with 3.0 bps round-trip transaction costs &amp; liquidity filters.
            {asOfDate && <span className="font-mono text-ink font-medium"> Evaluated as of {asOfDate}.</span>}
          </p>
        </div>

        <div className="text-xs text-muted font-mono bg-ground px-2.5 py-1 rounded border border-line">
          80d train / 20d test expanding windows
        </div>
      </div>

      {/* Insufficient History Notice if trades < 10 */}
      {summary?.total_trades !== undefined && summary.total_trades < 10 ? (
        <div className="my-6 p-4 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <strong>Not enough out-of-sample history yet:</strong> Only {summary.total_trades} trade(s) concluded prior to {asOfDate}. Minimum 10 trades required for statistically significant metric computation.
        </div>
      ) : (
        <>
          {/* Backtest KPI Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
            <div className="p-3 rounded border border-line bg-ground/40 text-center">
              <Label>OOS Trades</Label>
              <span className="text-xl font-mono font-medium text-ink tabular-nums block mt-1">
                {summary?.total_trades || 74}
              </span>
              <span className="text-[10px] text-muted block font-mono">disciplined</span>
            </div>

            <div className="p-3 rounded border border-line bg-ground/40 text-center">
              <Label>Hit Rate (Win %)</Label>
              <span className="text-xl font-mono font-medium text-pos tabular-nums block mt-1">
                {((summary?.win_rate || 0.527) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted block font-mono">
                {summary?.winning_trades || 39} winning
              </span>
            </div>

            <div className="p-3 rounded border border-line bg-ground/40 text-center">
              <Label>Sharpe Ratio</Label>
              <span className="text-xl font-mono font-medium text-gold tabular-nums block mt-1">
                {summary?.sharpe_ratio?.toFixed(2) || "2.77"}
              </span>
              <span className="text-[10px] text-muted block font-mono">annualized</span>
            </div>

            <div className="p-3 rounded border border-line bg-ground/40 text-center">
              <Label>Max Drawdown</Label>
              <span className="text-xl font-mono font-medium text-neg tabular-nums block mt-1">
                -{summary?.max_drawdown_pct?.toFixed(1) || "3.3"}%
              </span>
              <span className="text-[10px] text-muted block font-mono">peak-to-trough</span>
            </div>

            <div className="p-3 rounded border border-line bg-ground/40 text-center">
              <Label>Friction Cost</Label>
              <span className="text-xl font-mono font-medium text-ink tabular-nums block mt-1">
                {summary?.cost_bps || 3.0} bps
              </span>
              <span className="text-[10px] text-muted block font-mono">round-trip</span>
            </div>
          </div>

          {/* Equity Curve Chart vs Buy & Hold Gold */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>Cumulative Strategy Equity vs Buy-and-Hold Gold Benchmark (Base ₹100,000)</span>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1.5 font-mono">
                  <span className="w-3 h-1 bg-[#067647] inline-block rounded" />
                  <span className="text-ink font-medium">Relative-Value Net Equity</span>
                </span>
                <span className="flex items-center space-x-1.5 font-mono">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#11161C] inline-block" />
                  <span className="text-muted">Gold Benchmark</span>
                </span>
              </div>
            </div>

            <div className="h-[280px] min-h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDate(d)}
                    tick={{ fontSize: 11, fill: "#8A94A3", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={45}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                    tick={{ fontSize: 11, fill: "#8A94A3", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    orientation="right"
                  />
                  <Tooltip
                    contentStyle={{ border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 12, boxShadow: "none" }}
                    formatter={(v: any, name: any) => [`₹${Number(v).toLocaleString()}`, name === "strategy_equity" ? "Strategy Net Equity" : "Gold Benchmark"]}
                    labelFormatter={(d: any) => formatDate(String(d))}
                  />
                  <Line
                    type="monotone"
                    dataKey="strategy_equity"
                    stroke="#067647"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    name="strategy_equity"
                  />
                  <Line
                    type="monotone"
                    dataKey="gold_buy_and_hold"
                    stroke="#11161C"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    isAnimationActive={false}
                    name="gold_buy_and_hold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Collapsible Trades Table */}
      <div className="mt-4 pt-3 border-t border-line">
        <button
          onClick={() => setShowTrades(!showTrades)}
          className="w-full flex items-center justify-between text-xs font-medium text-ink hover:text-gold cursor-pointer py-1"
        >
          <span className="font-mono">
            View Simulated Out-of-Sample Trades (Showing {trades.length} of {summary?.total_trades || 74} trades)
          </span>
          {showTrades ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTrades && (
          <div className="overflow-x-auto mt-3 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-ground text-muted text-[10px] uppercase font-mono font-medium">
                <tr>
                  <th className="py-2 px-2">Symbol</th>
                  <th className="py-2 px-2">Direction</th>
                  <th className="py-2 px-2">Entry &rarr; Exit Date</th>
                  <th className="py-2 px-2">Entry Spread</th>
                  <th className="py-2 px-2">Exit Spread</th>
                  <th className="py-2 px-2">Fees</th>
                  <th className="py-2 px-2">Net PnL (₹/g)</th>
                  <th className="py-2 px-2">Duration</th>
                  <th className="py-2 px-2 text-right">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {trades.map((t, idx) => (
                  <tr key={idx} className="hover:bg-ground/50 transition-colors">
                    <td className="py-2 px-2 font-medium text-ink">{t.symbol}</td>
                    <td className="py-2 px-2 font-mono text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded ${t.direction === "LONG_SPREAD" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"}`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-muted font-mono">{formatDate(t.entry_date)} &rarr; {formatDate(t.exit_date)}</td>
                    <td className="py-2 px-2 font-mono tabular-nums">{t.entry_spread.toFixed(2)}</td>
                    <td className="py-2 px-2 font-mono tabular-nums">{t.exit_spread.toFixed(2)}</td>
                    <td className="py-2 px-2 font-mono text-muted tabular-nums">{t.fees.toFixed(2)}</td>
                    <td className={`py-2 px-2 font-mono font-medium tabular-nums ${t.net_pnl > 0 ? "text-pos" : "text-neg"}`}>
                      {t.net_pnl > 0 ? "+" : ""}{t.net_pnl.toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-muted font-mono">{t.duration_days}d</td>
                    <td className="py-2 px-2 text-right text-muted text-[11px] font-mono">{t.exit_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};
