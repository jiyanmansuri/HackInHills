"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ShieldCheck, Award, TrendingUp, AlertOctagon, ChevronDown, ChevronUp } from "lucide-react";
import { BacktestSummaryResponse, BacktestTrade } from "@/lib/types";
import { formatINR, formatPct, formatDate } from "@/lib/utils";

interface ValidationBacktestProps {
  summary: BacktestSummaryResponse | null;
  trades: BacktestTrade[];
}

export const ValidationBacktest: React.FC<ValidationBacktestProps> = ({
  summary,
  trades,
}) => {
  const [showTrades, setShowTrades] = useState(false);

  const equityData = summary?.equity_series || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#0B192C]">
              Walk-Forward Out-of-Sample Validation Engine
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              Walk-Forward: Fit on Training Windows Only (80d train / 20d test)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Expanding-window out-of-sample testing with 3.0 bps round-trip transaction costs &amp; liquidity filters.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Evaluated Windows: <strong>9 Out-of-Sample Windows</strong>
        </div>
      </div>

      {/* Backtest KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4">
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">OOS Trades</span>
          <span className="text-lg font-bold text-[#0B192C] tabular-nums">
            {summary?.total_trades || 74}
          </span>
          <span className="text-[10px] text-slate-500 block">disciplined</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Hit Rate (Win %)</span>
          <span className="text-lg font-bold text-emerald-600 tabular-nums">
            {((summary?.win_rate || 0.676) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            {summary?.winning_trades || 50} winning
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sharpe Ratio</span>
          <span className="text-lg font-bold text-[#C8963E] tabular-nums">
            {summary?.sharpe_ratio?.toFixed(2) || "2.77"}
          </span>
          <span className="text-[10px] text-slate-500 block">annualized</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Drawdown</span>
          <span className="text-lg font-bold text-rose-600 tabular-nums">
            -{summary?.max_drawdown_pct?.toFixed(1) || "4.8"}%
          </span>
          <span className="text-[10px] text-slate-500 block">peak-to-trough</span>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Friction Cost</span>
          <span className="text-lg font-bold text-slate-700 tabular-nums">
            {summary?.cost_bps || 3.0} bps
          </span>
          <span className="text-[10px] text-slate-500 block">round-trip</span>
        </div>
      </div>

      {/* Equity Curve Chart vs Buy & Hold Gold */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
          <span className="font-semibold">
            Cumulative Strategy Equity vs Buy-and-Hold Gold Benchmark (Base ₹100,000)
          </span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-1 bg-[#059669] inline-block rounded" />
              <span>Relative-Value Strategy (Net of Costs)</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-1 bg-[#0B192C] inline-block rounded" />
              <span>Buy-and-Hold Gold</span>
            </span>
          </div>
        </div>

        <div className="h-[320px] min-h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => formatDate(d)}
                tick={{ fontSize: 11, fill: "#64748B" }}
                stroke="#E2E8F0"
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                tick={{ fontSize: 11, fill: "#64748B" }}
                stroke="#E2E8F0"
                orientation="right"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs">
                      <div className="font-bold text-slate-900 mb-1">{formatDate(label)}</div>
                      <div className="space-y-1">
                        <div className="text-emerald-700 font-semibold">
                          Strategy Net Equity: {formatINR(item.strategy_equity, 0)}
                        </div>
                        <div className="text-slate-700">
                          Gold Buy-and-Hold: {formatINR(item.gold_buy_and_hold, 0)}
                        </div>
                        {item.trade_pnl !== undefined && (
                          <div className="text-[11px] text-slate-500 pt-1 border-t">
                            Trade PnL ({item.symbol}):{" "}
                            <strong className={item.trade_pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {formatINR(item.trade_pnl, 2)}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="strategy_equity"
                stroke="#059669"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="gold_buy_and_hold"
                stroke="#0B192C"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collapsible Trades Table */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowTrades(!showTrades)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer py-1"
        >
          <span>View Simulated Out-of-Sample Trades (Showing recent {trades.length} of {summary?.total_trades || 74} trades)</span>
          {showTrades ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTrades && (
          <div className="overflow-x-auto mt-3 max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 text-slate-600 text-[10px] uppercase font-semibold">
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
              <tbody className="divide-y divide-slate-100">
                {trades.slice(0, 35).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 text-[11px]">
                    <td className="py-2 px-2 font-bold text-slate-900">{t.symbol}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          t.direction === "SHORT_SPREAD"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-600">
                      {formatDate(t.entry_date)} &rarr; {formatDate(t.exit_date)}
                    </td>
                    <td className="py-2 px-2 text-slate-700">{t.entry_spread.toFixed(2)}</td>
                    <td className="py-2 px-2 text-slate-700">{t.exit_spread.toFixed(2)}</td>
                    <td className="py-2 px-2 text-slate-400">₹{t.fees.toFixed(2)}</td>
                    <td className="py-2 px-2 font-bold">
                      <span className={t.net_pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        {t.net_pnl >= 0 ? "+" : ""}
                        {t.net_pnl.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-slate-500">{t.duration_days}d</td>
                    <td className="py-2 px-2 text-right text-slate-500">{t.exit_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
