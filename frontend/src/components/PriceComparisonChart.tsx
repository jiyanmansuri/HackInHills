"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { NormalizedPriceRecord } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Card, Label } from "@/components/ui";

interface PriceComparisonChartProps {
  data: NormalizedPriceRecord[];
  asOfDate?: string;
}

const SERIES = [
  { key: "GOLDM", label: "GOLDM (100g Ref)", color: "#11161C" },
  { key: "GOLDTEN", label: "GOLDTEN (10g)", color: "#A8741A" },
  { key: "GOLDGUINEA", label: "GOLDGUINEA (8g)", color: "#5B6676" },
  { key: "GOLDPETAL", label: "GOLDPETAL (1g)", color: "#067647" },
];

export const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({
  data,
  asOfDate = "2026-09-22",
}) => {
  const [selectedRange, setSelectedRange] = useState<"1M" | "3M" | "6M" | "ALL">("3M");
  const [chartMode, setChartMode] = useState<"PRICE" | "ZSCORE">("ZSCORE");
  const [activeSymbols, setActiveSymbols] = useState<Record<string, boolean>>({
    GOLDM: true,
    GOLDTEN: true,
    GOLDGUINEA: true,
    GOLDPETAL: true,
  });

  // Pivot data by trade_date for front-month contract per symbol and clip to asOfDate
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const dataClipped = data.filter((item) => !asOfDate || item.trade_date <= asOfDate);

    // Filter for front-month contract per symbol on each date
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

    // Calculate rolling 30-day z-scores vs GOLDM for statistical sigma bands
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

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-3 border-b border-line gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">
              {chartMode === "PRICE"
                ? "Normalized Settlement Price Parity"
                : "Basis Spread Z-Score & Statistical Bands (±1σ, ±2σ)"}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {chartMode === "PRICE"
                ? "All 4 contracts normalized to per-gram baseline (GOLDM ÷10g, GOLDTEN ÷1g, GOLDGUINEA ÷8g, GOLDPETAL ÷1g)."
                : "Rolling 30-day standardized basis. Shaded ±1σ and ±2σ reference bands detect statistical mean-reversion zones."}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            <div className="flex items-center space-x-0.5 bg-ground p-0.5 rounded text-xs font-medium">
              <button
                onClick={() => setChartMode("PRICE")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  chartMode === "PRICE" ? "bg-white text-ink font-semibold shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                Parity
              </button>
              <button
                onClick={() => setChartMode("ZSCORE")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  chartMode === "ZSCORE" ? "bg-white text-ink font-semibold shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                ±Z Bands
              </button>
            </div>

            <div className="flex items-center space-x-0.5 bg-ground p-0.5 rounded text-xs font-medium">
              {(["1M", "3M", "6M", "ALL"] as const).map((rng) => (
                <button
                  key={rng}
                  onClick={() => setSelectedRange(rng)}
                  className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                    selectedRange === rng ? "bg-white text-ink font-semibold shadow-xs" : "text-muted hover:text-ink"
                  }`}
                >
                  {rng}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Series filters */}
        <div className="flex flex-wrap items-center gap-1.5 my-3 text-xs">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted mr-1">
            Series:
          </span>
          {SERIES.map((s) => {
            if (chartMode === "ZSCORE" && s.key === "GOLDM") return null;
            return (
              <button
                key={s.key}
                onClick={() => toggleSymbol(s.key)}
                className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded border text-xs cursor-pointer transition-all ${
                  activeSymbols[s.key]
                    ? "bg-white border-line text-ink font-medium"
                    : "bg-ground border-dashed border-line text-muted opacity-60"
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeSymbols[s.key] ? s.color : "#94A3B8" }} />
                <span>{s.key}</span>
              </button>
            );
          })}
        </div>

        {/* 300px Recharts Container with explicit height */}
        <div className="h-[300px] min-h-[300px] w-full mt-2">
          {chartData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted">
              No data available for this range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "PRICE" ? (
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#8A94A3" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                    tickFormatter={(d) => formatDate(d)}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#8A94A3" }}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    orientation="right"
                    tickFormatter={(v) => `₹${Math.round(v)}`}
                  />
                  <Tooltip
                    contentStyle={{ border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 12, boxShadow: "none" }}
                    formatter={(value: any, name: any) => [`₹${Number(value).toFixed(1)}/g`, name]}
                    labelFormatter={(label: any) => formatDate(String(label))}
                  />
                  {SERIES.map((s) =>
                    activeSymbols[s.key] ? (
                      <Line
                        key={s.key}
                        dataKey={s.key}
                        stroke={s.color}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        type="monotone"
                        name={s.label}
                      />
                    ) : null
                  )}
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <ReferenceArea y1={-2} y2={2} fill="#F3F5F8" />
                  <ReferenceArea y1={-1} y2={1} fill="#E6EAF0" />
                  <ReferenceLine y={0} stroke="#8A94A3" />
                  <CartesianGrid stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#8A94A3" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={40}
                    tickFormatter={(d) => formatDate(d)}
                  />
                  <YAxis
                    domain={[-3, 3]}
                    tick={{ fontSize: 11, fill: "#8A94A3" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    orientation="right"
                    tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}σ`}
                  />
                  <Tooltip
                    contentStyle={{ border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 12, boxShadow: "none" }}
                    formatter={(value: any, name: any) => [`${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)}σ`, name]}
                    labelFormatter={(label: any) => formatDate(String(label))}
                  />
                  {activeSymbols.GOLDTEN && (
                    <Line
                      dataKey="GOLDTEN_zscore"
                      stroke="#A8741A"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      type="monotone"
                      name="GOLDTEN vs GOLDM (Z)"
                    />
                  )}
                  {activeSymbols.GOLDGUINEA && (
                    <Line
                      dataKey="GOLDGUINEA_zscore"
                      stroke="#5B6676"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      type="monotone"
                      name="GOLDGUINEA vs GOLDM (Z)"
                    />
                  )}
                  {activeSymbols.GOLDPETAL && (
                    <Line
                      dataKey="GOLDPETAL_zscore"
                      stroke="#067647"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                      type="monotone"
                      name="GOLDPETAL vs GOLDM (Z)"
                    />
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
        <span>Benchmark Reference: GOLDM (100g, Quoted per 10g)</span>
        <span className="font-mono">As of {asOfDate}</span>
      </div>
    </Card>
  );
};
