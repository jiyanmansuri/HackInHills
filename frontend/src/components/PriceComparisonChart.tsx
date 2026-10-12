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
import { formatINR, formatPct, formatDate } from "@/lib/utils";
import { Activity, Layers } from "lucide-react";

interface PriceComparisonChartProps {
  data: NormalizedPriceRecord[];
  asOfDate?: string;
}

const CONTRACT_COLORS: Record<string, string> = {
  GOLDM: "#0B192C",
  GOLDTEN: "#C8963E",
  GOLDGUINEA: "#7C3AED",
  GOLDPETAL: "#059669",
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

  // Pivot data by trade_date for multi-line charting
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const dateMap = new Map<string, any>();
    data.forEach((item) => {
      const d = item.trade_date;
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d });
      }
      const entry = dateMap.get(d);
      entry[item.symbol] = item.norm_close;
    });

    const sorted = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (sorted.length === 0) return [];

    // Calculate synthetic spread z-scores vs GOLDM for the Z-score band view
    const windowSize = 30;
    for (let i = 0; i < sorted.length; i++) {
      const windowSlice = sorted.slice(Math.max(0, i - windowSize + 1), i + 1);
      const goldm = sorted[i].GOLDM;

      ["GOLDTEN", "GOLDGUINEA", "GOLDPETAL"].forEach((sym) => {
        if (sorted[i][sym] && goldm) {
          const spread = sorted[i][sym] - goldm;
          sorted[i][`${sym}_spread`] = spread;

          const spreadsInWindow = windowSlice
            .filter((row) => row[sym] && row.GOLDM)
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
  }, [data, selectedRange]);

  const toggleSymbol = (sym: string) => {
    setActiveSymbols((prev) => ({ ...prev, [sym]: !prev[sym] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    if (chartMode === "ZSCORE") {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs font-mono">
          <div className="font-semibold text-slate-800 mb-2 border-b pb-1">
            {formatDate(label)} (Rolling 30d Z-Score Bands)
          </div>
          <div className="space-y-1.5">
            {payload.map((entry: any) => {
              const sym = entry.dataKey.replace("_zscore", "");
              const val = entry.value;
              return (
                <div key={sym} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium text-slate-700">{sym}:</span>
                  </div>
                  <span className="font-bold tabular-nums">
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
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs font-mono">
        <div className="font-semibold text-slate-800 mb-2 border-b pb-1">
          {formatDate(label)} (Per-Gram Settlement)
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any) => {
            const sym = entry.dataKey;
            const val = entry.value;
            const spreadVsGoldM =
              goldmVal && sym !== "GOLDM" ? val - goldmVal : 0;
            const spreadPct =
              goldmVal && sym !== "GOLDM" ? (spreadVsGoldM / goldmVal) * 100 : 0;

            return (
              <div key={sym} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-medium text-slate-700">{sym}:</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 tabular-nums">{formatINR(val)}/g</span>
                  {sym !== "GOLDM" && goldmVal && (
                    <span
                      className={`ml-2 text-[10px] font-semibold tabular-nums ${
                        spreadVsGoldM > 0
                          ? "text-rose-600"
                          : spreadVsGoldM < 0
                          ? "text-emerald-600"
                          : "text-slate-500"
                      }`}
                    >
                      ({spreadVsGoldM > 0 ? "+" : ""}
                      {spreadVsGoldM.toFixed(1)} ₹/g | {spreadPct > 0 ? "+" : ""}
                      {spreadPct.toFixed(2)}%)
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
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#0B192C]">
              {chartMode === "PRICE"
                ? "Normalized Settlement Price Parity"
                : "Basis Spread Z-Score & Statistical Bands (±1σ, ±2σ)"}
            </h2>
            <span className="bg-[#C8963E]/10 text-[#8A5816] border border-[#C8963E]/20 text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono">
              {chartMode === "PRICE" ? "INR / g Normalization" : "30-Day Rolling Bands"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {chartMode === "PRICE"
              ? "All 4 contracts normalized to common denominator: GOLDM (÷10g), GOLDTEN (÷1g), GOLDGUINEA (÷8g), GOLDPETAL (÷1g)."
              : "Standardized basis dislocation vs GOLDM benchmark. Bands flag statistical mean-reversion zones."}
          </p>
        </div>

        {/* View Mode Toggle and Range Buttons */}
        <div className="flex items-center space-x-2">
          {/* Mode toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setChartMode("PRICE")}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                chartMode === "PRICE"
                  ? "bg-white text-[#0B192C] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Price Parity
            </button>
            <button
              onClick={() => setChartMode("ZSCORE")}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                chartMode === "ZSCORE"
                  ? "bg-white text-[#0B192C] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              ±Z Bands
            </button>
          </div>

          {/* Range Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            {(["1M", "3M", "6M", "ALL"] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => setSelectedRange(rng)}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  selectedRange === rng
                    ? "bg-white text-[#0B192C] shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contract Legend & Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 my-3 text-xs">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Active Series:
        </span>
        {Object.entries(CONTRACT_COLORS).map(([sym, color]) => {
          if (chartMode === "ZSCORE" && sym === "GOLDM") return null;
          return (
            <button
              key={sym}
              onClick={() => toggleSymbol(sym)}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all ${
                activeSymbols[sym]
                  ? "bg-slate-50 border-slate-300 text-slate-900 shadow-xs"
                  : "bg-white border-dashed border-slate-200 text-slate-400 opacity-60"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSymbols[sym] ? color : "#CBD5E1" }}
              />
              <span>{sym}</span>
              {sym === "GOLDM" && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded">Ref</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explicit Fixed Container with Minimum Height */}
      <div className="h-[340px] min-h-[340px] w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full w-full rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
            <Layers className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs text-slate-500">No chart data available for this range.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === "PRICE" ? (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d)}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  stroke="#E2E8F0"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `₹${Math.round(v)}`}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  stroke="#E2E8F0"
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />

                {activeSymbols.GOLDM && (
                  <Line
                    type="monotone"
                    dataKey="GOLDM"
                    stroke={CONTRACT_COLORS.GOLDM}
                    strokeWidth={2.5}
                    dot={false}
                    name="GOLDM (100g)"
                  />
                )}
                {activeSymbols.GOLDTEN && (
                  <Line
                    type="monotone"
                    dataKey="GOLDTEN"
                    stroke={CONTRACT_COLORS.GOLDTEN}
                    strokeWidth={1.5}
                    dot={false}
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
                    name="GOLDPETAL (1g)"
                  />
                )}
              </LineChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d)}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  stroke="#E2E8F0"
                />
                <YAxis
                  domain={[-3.0, 3.0]}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}σ`}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  stroke="#E2E8F0"
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Reference Standard Deviation Bands */}
                <ReferenceLine y={2.0} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "+2σ Dislocation", position: "insideTopRight", fill: "#EF4444", fontSize: 10 }} />
                <ReferenceLine y={1.0} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "+1σ Hurdle", position: "insideTopRight", fill: "#F59E0B", fontSize: 10 }} />
                <ReferenceLine y={0.0} stroke="#64748B" strokeWidth={1.5} />
                <ReferenceLine y={-1.0} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: "-1σ Hurdle", position: "insideBottomRight", fill: "#F59E0B", fontSize: 10 }} />
                <ReferenceLine y={-2.0} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "-2σ Dislocation", position: "insideBottomRight", fill: "#EF4444", fontSize: 10 }} />

                {activeSymbols.GOLDTEN && (
                  <Line
                    type="monotone"
                    dataKey="GOLDTEN_zscore"
                    stroke={CONTRACT_COLORS.GOLDTEN}
                    strokeWidth={2}
                    dot={false}
                    name="GOLDTEN vs GOLDM (Z)"
                  />
                )}
                {activeSymbols.GOLDGUINEA && (
                  <Line
                    type="monotone"
                    dataKey="GOLDGUINEA_zscore"
                    stroke={CONTRACT_COLORS.GOLDGUINEA}
                    strokeWidth={2}
                    dot={false}
                    name="GOLDGUINEA vs GOLDM (Z)"
                  />
                )}
                {activeSymbols.GOLDPETAL && (
                  <Line
                    type="monotone"
                    dataKey="GOLDPETAL_zscore"
                    stroke={CONTRACT_COLORS.GOLDPETAL}
                    strokeWidth={2}
                    dot={false}
                    name="GOLDPETAL vs GOLDM (Z)"
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-slate-900"></span>
          <span>Benchmark Reference: <strong>GOLDM (100g, Quoted per 10g)</strong></span>
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Normalized settlement data as of {asOfDate}
        </span>
      </div>
    </div>
  );
};
