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
import { Card } from "@/components/ui";

interface PriceComparisonChartProps {
  data: NormalizedPriceRecord[];
  asOfDate?: string;
  defaultSymbol?: string;
  hasActiveSignal?: boolean;
}

const CONTRACT_PAIRS = [
  { key: "GOLDTEN", name: "GOLDTEN vs GOLDM", shortName: "GOLDTEN (10g)", color: "#A8741A" },
  { key: "GOLDGUINEA", name: "GOLDGUINEA vs GOLDM", shortName: "GOLDGUINEA (8g)", color: "#5B6676" },
  { key: "GOLDPETAL", name: "GOLDPETAL vs GOLDM", shortName: "GOLDPETAL (1g)", color: "#067647" },
];

export const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({
  data,
  asOfDate = "2026-08-12",
  defaultSymbol = "GOLDTEN",
  hasActiveSignal = false,
}) => {
  const [selectedRange, setSelectedRange] = useState<"1M" | "3M" | "6M" | "ALL">("3M");
  const [chartMode, setChartMode] = useState<"ZSCORE" | "PRICE">("ZSCORE");
  const [focusedSymbol, setFocusedSymbol] = useState<string>(
    defaultSymbol.includes("GOLD") ? defaultSymbol.split(" ")[0] : "GOLDTEN"
  );

  // Synchronize focusedSymbol if defaultSymbol changes from parent
  React.useEffect(() => {
    if (defaultSymbol) {
      const cleanSym = defaultSymbol.split(" ")[0];
      if (cleanSym === "GOLDTEN" || cleanSym === "GOLDGUINEA" || cleanSym === "GOLDPETAL") {
        setFocusedSymbol(cleanSym);
      }
    }
  }, [defaultSymbol]);

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

  return (
    <Card className="p-5 h-full flex flex-col justify-between">
      <div>
        {/* Top Header & Range Controls */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-3 border-b border-line gap-2">
          <div>
            <h3 className="text-[15px] font-semibold text-ink">
              {chartMode === "ZSCORE"
                ? "Basis Spread Z-Score & Statistical Bands (±1σ, ±2σ)"
                : "Normalized Settlement Price Parity (₹/g)"}
            </h3>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {chartMode === "ZSCORE"
                ? "Rolling 30-day standardized basis relative to GOLDM zero baseline. Focus pair shown with statistical corridors."
                : "All 4 contracts normalized to per-gram baseline (GOLDM ÷10g, GOLDTEN ÷1g, GOLDGUINEA ÷8g, GOLDPETAL ÷1g)."}
            </p>
          </div>

          <div className="flex items-center space-x-1.5 self-start sm:self-auto shrink-0">
            <div className="flex items-center space-x-0.5 bg-ground p-0.5 rounded text-xs font-medium border border-line/60">
              <button
                onClick={() => setChartMode("ZSCORE")}
                className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                  chartMode === "ZSCORE" ? "bg-white text-ink font-semibold shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                ±Z Bands
              </button>
              <button
                onClick={() => setChartMode("PRICE")}
                className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                  chartMode === "PRICE" ? "bg-white text-ink font-semibold shadow-xs" : "text-muted hover:text-ink"
                }`}
              >
                Parity
              </button>
            </div>

            <div className="flex items-center space-x-0.5 bg-ground p-0.5 rounded text-xs font-medium border border-line/60">
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

        {/* Pair Focus Selector & Legend with high contrast text */}
        {chartMode === "ZSCORE" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 my-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted mr-1">
                Focus Pair:
              </span>
              {CONTRACT_PAIRS.map((p) => {
                const isSelected = focusedSymbol === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setFocusedSymbol(p.key)}
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-[#11161C] text-white font-semibold border-[#11161C] shadow-xs"
                        : "bg-white border-line text-[#5B6676] hover:text-[#11161C] hover:border-[#11161C]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? "#C8963E" : p.color }}
                    />
                    <span className={isSelected ? "text-white" : "text-ink"}>{p.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Benchmark Zero Baseline & Band Legend */}
            <div className="flex items-center space-x-3 text-[11px] font-mono text-muted">
              <span className="inline-flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-[#11161C] inline-block" />
                <span className="text-ink font-medium">GOLDM (0 Baseline)</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-[#EEF2F6] border border-[#CBD5E1] inline-block" />
                <span>±1σ Zone</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-[#F8FAFC] border border-[#E2E8F0] inline-block" />
                <span>±2σ Zone</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 my-3 text-xs">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted mr-1">
              Series:
            </span>
            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-ground text-ink font-medium">
              <span className="w-2 h-2 rounded-full bg-[#11161C]" />
              <span>GOLDM (100g Benchmark)</span>
            </span>
            {CONTRACT_PAIRS.map((p) => (
              <span
                key={p.key}
                className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-ground text-ink font-medium"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.shortName}</span>
              </span>
            ))}
          </div>
        )}

        {/* 300px Recharts Container with ±5σ Range and Internal Band Labels */}
        <div className="h-[300px] min-h-[300px] w-full mt-2 relative">
          {chartData.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted">
              No data available for this range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === "PRICE" ? (
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#8A94A3", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={45}
                    tickFormatter={(d) => formatDate(d)}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#8A94A3", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                    orientation="right"
                    tickFormatter={(v) => `₹${Math.round(v)}`}
                  />
                  <Tooltip
                    contentStyle={{ border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 12, boxShadow: "none" }}
                    formatter={(value: any, name: any) => [`₹${Number(value).toFixed(1)}/g`, name]}
                    labelFormatter={(label: any) => formatDate(String(label))}
                  />
                  <Line
                    dataKey="GOLDM"
                    stroke="#11161C"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                    type="monotone"
                    name="GOLDM (Ref)"
                  />
                  {CONTRACT_PAIRS.map((p) => (
                    <Line
                      key={p.key}
                      dataKey={p.key}
                      stroke={p.color}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                      type="monotone"
                      name={p.shortName}
                    />
                  ))}
                </LineChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 12, right: 36, bottom: 12, left: 8 }}>
                  {/* Outer ±2σ Band */}
                  <ReferenceArea y1={-2} y2={2} fill="#F8FAFC" fillOpacity={0.8} />
                  {/* Inner ±1σ Band */}
                  <ReferenceArea y1={-1} y2={1} fill="#EEF2F6" fillOpacity={0.9} />
                  
                  {/* Zero Baseline for Benchmark */}
                  <ReferenceLine y={0} stroke="#11161C" strokeWidth={1.5} />
                  
                  {/* Clean reference boundaries with white-tagged label badges to prevent line-text collisions */}
                  <ReferenceLine
                    y={2}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    label={(props: any) => {
                      const { viewBox } = props;
                      const x = (viewBox?.x ?? 0) + 12;
                      const y = (viewBox?.y ?? 0) - 18;
                      return (
                        <g>
                          <rect x={x} y={y} width={50} height={14} fill="#FFFFFF" rx={2} stroke="#CBD5E1" strokeWidth={0.75} />
                          <text x={x + 5} y={y + 10} fill="#5B6676" fontSize={9} fontWeight={600} fontFamily="var(--font-mono)">
                            +2σ Zone
                          </text>
                        </g>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={1}
                    stroke="#E2E8F0"
                    strokeDasharray="2 2"
                    label={(props: any) => {
                      const { viewBox } = props;
                      const x = (viewBox?.x ?? 0) + 12;
                      const y = (viewBox?.y ?? 0) - 18;
                      return (
                        <g>
                          <rect x={x} y={y} width={50} height={14} fill="#FFFFFF" rx={2} stroke="#E2E8F0" strokeWidth={0.75} />
                          <text x={x + 5} y={y + 10} fill="#8A94A3" fontSize={9} fontWeight={600} fontFamily="var(--font-mono)">
                            +1σ Zone
                          </text>
                        </g>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={-1}
                    stroke="#E2E8F0"
                    strokeDasharray="2 2"
                    label={(props: any) => {
                      const { viewBox } = props;
                      const x = (viewBox?.x ?? 0) + 12;
                      const y = (viewBox?.y ?? 0) + 4;
                      return (
                        <g>
                          <rect x={x} y={y} width={50} height={14} fill="#FFFFFF" rx={2} stroke="#E2E8F0" strokeWidth={0.75} />
                          <text x={x + 5} y={y + 10} fill="#8A94A3" fontSize={9} fontWeight={600} fontFamily="var(--font-mono)">
                            -1σ Zone
                          </text>
                        </g>
                      );
                    }}
                  />
                  <ReferenceLine
                    y={-2}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    label={(props: any) => {
                      const { viewBox } = props;
                      const x = (viewBox?.x ?? 0) + 12;
                      const y = (viewBox?.y ?? 0) + 4;
                      return (
                        <g>
                          <rect x={x} y={y} width={50} height={14} fill="#FFFFFF" rx={2} stroke="#CBD5E1" strokeWidth={0.75} />
                          <text x={x + 5} y={y + 10} fill="#5B6676" fontSize={9} fontWeight={600} fontFamily="var(--font-mono)">
                            -2σ Zone
                          </text>
                        </g>
                      );
                    }}
                  />

                  <CartesianGrid stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#8A94A3", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={50}
                    tickFormatter={(d) => formatDate(d)}
                  />
                  <YAxis
                    domain={[-5, 5]}
                    ticks={[-4, -2, 0, 2, 4]}
                    tick={{ fontSize: 11, fill: "#5B6676", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    orientation="right"
                    tickFormatter={(v) => (v === 0 ? "0σ" : `${v > 0 ? "+" : ""}${v}σ`)}
                  />
                  <Tooltip
                    contentStyle={{ border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 12, boxShadow: "none" }}
                    formatter={(value: any, name: any) => [`${Number(value) > 0 ? "+" : ""}${Number(value).toFixed(2)}σ`, name]}
                    labelFormatter={(label: any) => formatDate(String(label))}
                  />

                  {/* Other background pairs as faint thin lines */}
                  {CONTRACT_PAIRS.filter((p) => p.key !== focusedSymbol).map((p) => (
                    <Line
                      key={p.key}
                      dataKey={`${p.key}_zscore`}
                      stroke={p.color}
                      strokeWidth={1}
                      strokeOpacity={0.25}
                      dot={false}
                      isAnimationActive={false}
                      type="monotone"
                      name={`${p.key} (Secondary)`}
                    />
                  ))}

                  {/* Primary Focus Pair: Thick high-contrast line */}
                  {(() => {
                    const activePair = CONTRACT_PAIRS.find((p) => p.key === focusedSymbol) || CONTRACT_PAIRS[0];
                    return (
                      <Line
                        dataKey={`${activePair.key}_zscore`}
                        stroke={activePair.color}
                        strokeWidth={2.75}
                        dot={(props: any) => {
                          const { cx, cy, payload } = props;
                          // If current date matches asOfDate and a signal fired, draw red prominent beacon
                          if (payload?.date === asOfDate && hasActiveSignal) {
                            return (
                              <g key={`marker-${payload.date}`}>
                                <circle cx={cx} cy={cy} r={6} fill="#B42318" stroke="#FFFFFF" strokeWidth={2} />
                                <circle cx={cx} cy={cy} r={9} fill="none" stroke="#B42318" strokeWidth={1.5} opacity={0.6} />
                              </g>
                            );
                          }
                          return <React.Fragment key={`dot-${props.key || Math.random()}`} />;
                        }}
                        isAnimationActive={false}
                        type="monotone"
                        name={`${activePair.name} (Z)`}
                      />
                    );
                  })()}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
        <span>Benchmark Reference: GOLDM (100g, Quoted per 10g) &bull; Zero Parity</span>
        <span className="font-mono">As of {asOfDate}</span>
      </div>
    </Card>
  );
};
