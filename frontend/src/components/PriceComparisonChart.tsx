"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { NormalizedPriceRecord } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

interface PriceComparisonChartProps {
  data: NormalizedPriceRecord[];
  asOfDate?: string;
}

const CONTRACT_COLORS: Record<string, string> = {
  GOLDM: "#0F172A",      // Dark Slate Benchmark
  GOLDTEN: "#B8860B",    // Accent Gold
  GOLDGUINEA: "#64748B", // Slate
  GOLDPETAL: "#059669",  // Emerald
};

export const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({
  data,
  asOfDate = "2026-09-22",
}) => {
  const [selectedRange, setSelectedRange] = useState<"1M" | "3M" | "6M" | "ALL">("3M");
  const [chartMode, setChartMode] = useState<"PRICE" | "ZSCORE">("PRICE");
  const [activeSymbols, setActiveSymbols] = useState<Record<string, boolean>>({
    GOLDM: true,
    GOLDTEN: true,
    GOLDGUINEA: true,
    GOLDPETAL: true,
  });

  // Pivot data by trade_date, matching front-month contract per symbol and clipping to asOfDate
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Clip data to the active replay date so chart matches the replay horizon
    const dataClipped = data.filter((item) => !asOfDate || item.trade_date <= asOfDate);

    // Filter for the front-month contract (earliest expiry) per symbol on each trade date
    const dateSymMap = new Map<string, NormalizedPriceRecord>();
    dataClipped.forEach((item) => {
      const key = `${item.trade_date}_${item.symbol}`;
      if (!dateSymMap.has(key) || item.expiry_date < dateSymMap.get(key)!.expiry_date) {
        dateSymMap.set(key, item);
      }
    });

    const dateMap = new Map<string, any>();
    dateSymMap.forEach((item) => {
      const d = item.trade_date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d });
      }
      const entry = dateMap.get(d);
      entry[item.symbol] = Number(item.norm_close);
    });

    const sorted = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (sorted.length === 0) return [];

    // Calculate synthetic spread z-scores vs GOLDM for statistical ±1σ / ±2σ bands
    const windowSize = 30;
    for (let i = 0; i < sorted.length; i++) {
      const windowSlice = sorted.slice(Math.max(0, i - windowSize + 1), i + 1);
      const goldm = sorted[i].GOLDM;

      ["GOLDTEN", "GOLDGUINEA", "GOLDPETAL"].forEach((sym) => {
        if (sorted[i][sym] !== undefined && goldm !== undefined) {
          const spread = sorted[i][sym] - goldm;
          sorted[i][`${sym}_spread`] = spread;

          const spreadsInWindow = windowSlice
            .filter((row) => row[sym] !== undefined && row.GOLDM !== undefined)
            .map((row) => row[sym] - row.GOLDM);

          if (spreadsInWindow.length >= 5) {
            const mean = spreadsInWindow.reduce((a, b) => a + b, 0) / spreadsInWindow.length;
            const variance =
              spreadsInWindow.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
              spreadsInWindow.length;
            const std = Math.sqrt(variance) || 1.0;
            sorted[i][`${sym}_zscore`] = parseFloat(((spread - mean) / std).toFixed(2));
          } else {
            sorted[i][`${sym}_zscore`] = 0.0;
          }
        }
      });
    }

    if (selectedRange === "ALL") return sorted;
    const daysCount = selectedRange === "1M" ? 22 : selectedRange === "3M" ? 65 : 130;
    return sorted.slice(-daysCount);
  }, [data, selectedRange, asOfDate]);

  const toggleSymbol = (sym: string) => {
    setActiveSymbols((prev) => ({ ...prev, [sym]: !prev[sym] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    if (chartMode === "ZSCORE") {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-md text-xs">
          <div className="font-semibold text-slate-800 mb-1.5 border-b pb-1">
            {formatDate(label)} (Rolling 30d Z-Score)
          </div>
          <div className="space-y-1">
            {payload.map((entry: any) => {
              const sym = entry.dataKey?.replace("_zscore", "");
              const val = entry.value;
              if (val === undefined || val === null) return null;
              return (
                <div key={sym} className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium text-slate-700">{sym}:</span>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {val > 0 ? `+${val}σ` : `${val}σ`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const goldmVal = payload.find((p: any) => p.dataKey === "GOLDM")?.value;

    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-md text-xs">
        <div className="font-semibold text-slate-800 mb-1.5 border-b pb-1">
          {formatDate(label)} (Normalized Settlement)
        </div>
        <div className="space-y-1">
          {payload.map((entry: any) => {
            const sym = entry.dataKey;
            const val = entry.value;
            if (val === undefined || val === null) return null;
            const spreadVsGoldM = goldmVal && sym !== "GOLDM" ? val - goldmVal : 0;

            return (
              <div key={sym} className="flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-1.5">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium text-slate-700">{sym}:</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900 tabular-nums">{formatINR(val)}/g</span>
                  {sym !== "GOLDM" && goldmVal && (
                    <span
                      className={`ml-1.5 text-[10px] font-medium tabular-nums ${
                        spreadVsGoldM > 0
                          ? "text-rose-600"
                          : spreadVsGoldM < 0
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      ({spreadVsGoldM > 0 ? "+" : ""}{spreadVsGoldM.toFixed(1)} ₹/g)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md h-full flex flex-col justify-between">
      {/* Header & Controls */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {chartMode === "PRICE"
                ? "Normalized Settlement Price Parity"
                : "Basis Spread Z-Score & Statistical Bands (±1σ, ±2σ)"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {chartMode === "PRICE"
                ? "Common denominator baseline: GOLDM (÷10g), GOLDTEN (÷1g), GOLDGUINEA (÷8g), GOLDPETAL (÷1g)."
                : "Rolling 30-day standardized spread. Shaded ±1σ and ±2σ reference bands identify mean-reversion zones."}
            </p>
          </div>

          {/* Toggle controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setChartMode("PRICE")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === "PRICE"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Parity
              </button>
              <button
                onClick={() => setChartMode("ZSCORE")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  chartMode === "ZSCORE"
                    ? "bg-white text-slate-900 shadow-2xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                ±Z Bands
              </button>
            </div>

            <div className="flex items-center space-x-0.5 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              {(["1M", "3M", "6M", "ALL"] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => setSelectedRange(rng)}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    selectedRange === rng
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {rng}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contract Series Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 my-3 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Series:
          </span>
          {Object.entries(CONTRACT_COLORS).map(([sym, color]) => {
            if (chartMode === "ZSCORE" && sym === "GOLDM") return null;
            return (
              <button
                key={sym}
                onClick={() => toggleSymbol(sym)}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-xs cursor-pointer transition-all ${
                  activeSymbols[sym]
                    ? "bg-slate-50 border-slate-300 text-slate-900 font-medium"
                    : "bg-white border-dashed border-slate-200 text-slate-400 opacity-60"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeSymbols[sym] ? color : "#CBD5E1" }}
                />
                <span>{sym}</span>
                {sym === "GOLDM" && (
                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded">Ref</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chart View with Responsive Container & isAnimationActive={false} */}
        <div className="h-[280px] min-h-[280px] w-full pt-1">
          {chartData.length === 0 ? (
            <div className="h-full w-full rounded-xl bg-slate-50 border border-slate-100 grid place-items-center text-xs text-slate-400">
              No chart data available for this range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "PRICE" ? (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDate(d)}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    stroke="#E2E8F0"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `₹${Math.round(v)}`}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    stroke="#E2E8F0"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {activeSymbols.GOLDM && (
                    <Line
                      type="monotone"
                      dataKey="GOLDM"
                      stroke={CONTRACT_COLORS.GOLDM}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDM (100g)"
                    />
                  )}
                  {activeSymbols.GOLDTEN && (
                    <Line
                      type="monotone"
                      dataKey="GOLDTEN"
                      stroke={CONTRACT_COLORS.GOLDTEN}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDTEN (10g)"
                    />
                  )}
                  {activeSymbols.GOLDGUINEA && (
                    <Line
                      type="monotone"
                      dataKey="GOLDGUINEA"
                      stroke={CONTRACT_COLORS.GOLDGUINEA}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDGUINEA (8g)"
                    />
                  )}
                  {activeSymbols.GOLDPETAL && (
                    <Line
                      type="monotone"
                      dataKey="GOLDPETAL"
                      stroke={CONTRACT_COLORS.GOLDPETAL}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDPETAL (1g)"
                    />
                  )}
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDate(d)}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    stroke="#E2E8F0"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[-3.0, 3.0]}
                    tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}σ`}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    stroke="#E2E8F0"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={2.0} stroke="#EF4444" strokeDasharray="3 3" />
                  <ReferenceLine y={1.0} stroke="#B8860B" strokeDasharray="2 2" />
                  <ReferenceLine y={0.0} stroke="#64748B" strokeWidth={1.5} />
                  <ReferenceLine y={-1.0} stroke="#B8860B" strokeDasharray="2 2" />
                  <ReferenceLine y={-2.0} stroke="#EF4444" strokeDasharray="3 3" />

                  {activeSymbols.GOLDTEN && (
                    <Line
                      type="monotone"
                      dataKey="GOLDTEN_zscore"
                      stroke={CONTRACT_COLORS.GOLDTEN}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDTEN (Z)"
                    />
                  )}
                  {activeSymbols.GOLDGUINEA && (
                    <Line
                      type="monotone"
                      dataKey="GOLDGUINEA_zscore"
                      stroke={CONTRACT_COLORS.GOLDGUINEA}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDGUINEA (Z)"
                    />
                  )}
                  {activeSymbols.GOLDPETAL && (
                    <Line
                      type="monotone"
                      dataKey="GOLDPETAL_zscore"
                      stroke={CONTRACT_COLORS.GOLDPETAL}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      name="GOLDPETAL (Z)"
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Benchmark: GOLDM (100g, Quoted per 10g)</span>
        <span>Normalized session date: {asOfDate}</span>
      </div>
    </div>
  );
};
