"use client";

import React, { useState, useMemo } from "react";
import {
  GitCompare,
  Calendar,
  Layers,
  Info,
  Check,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import { NormalizedPriceRecord } from "@/lib/types";
import { formatINR, formatPct, formatDate } from "@/lib/utils";

interface ContractCompareViewProps {
  prices: NormalizedPriceRecord[];
  referenceSymbol: string;
}

const CONTRACT_SPECS = [
  {
    symbol: "GOLDM",
    lotSize: "100 grams",
    quoteBase: "per 10g",
    purity: "995 fineness",
    tickSize: "₹1.00",
    color: "#C8963E",
    expiryRule: "Month-End (Last day of month)",
  },
  {
    symbol: "GOLDTEN",
    lotSize: "10 grams",
    quoteBase: "per 10g",
    purity: "995 fineness",
    tickSize: "₹1.00",
    color: "#1E3E62",
    expiryRule: "Month-End (Last day of month)",
  },
  {
    symbol: "GOLDGUINEA",
    lotSize: "8 grams",
    quoteBase: "per 8g",
    purity: "995 fineness",
    tickSize: "₹1.00",
    color: "#059669",
    expiryRule: "5th of the Month",
  },
  {
    symbol: "GOLDPETAL",
    lotSize: "1 gram",
    quoteBase: "per 1g",
    purity: "999 fineness",
    tickSize: "₹1.00",
    color: "#D97706",
    expiryRule: "5th of the Month",
  },
];

export function ContractCompareView({
  prices,
  referenceSymbol,
}: ContractCompareViewProps) {
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "ALL">("3M");
  const [viewMode, setViewMode] = useState<"price" | "spread">("price");
  const [visibleContracts, setVisibleContracts] = useState<{ [sym: string]: boolean }>({
    GOLDM: true,
    GOLDTEN: true,
    GOLDGUINEA: true,
    GOLDPETAL: true,
  });
  const [showEventMarkers, setShowEventMarkers] = useState(true);
  const [showThinLiquidityShade, setShowThinLiquidityShade] = useState(true);

  // Group prices by trade_date
  const chartData = useMemo(() => {
    if (!prices || prices.length === 0) return [];

    const dateMap = new Map<
      string,
      {
        date: string;
        GOLDM?: number;
        GOLDTEN?: number;
        GOLDGUINEA?: number;
        GOLDPETAL?: number;
        is_thin?: boolean;
        has_expiry?: boolean;
      }
    >();

    prices.forEach((p) => {
      if (!dateMap.has(p.trade_date)) {
        dateMap.set(p.trade_date, {
          date: p.trade_date,
          is_thin: false,
          has_expiry: false,
        });
      }
      const entry = dateMap.get(p.trade_date)!;
      // Store per-gram close
      (entry as any)[p.symbol] = p.norm_close;
      if (p.is_thin_liquidity) entry.is_thin = true;
      if (p.days_to_expiry !== undefined && p.days_to_expiry <= 1) {
        entry.has_expiry = true;
      }
    });

    const allDates = Array.from(dateMap.keys()).sort();
    let sliceCount = allDates.length;
    if (timeRange === "1M") sliceCount = Math.min(22, allDates.length);
    else if (timeRange === "3M") sliceCount = Math.min(66, allDates.length);
    else if (timeRange === "6M") sliceCount = Math.min(132, allDates.length);

    const selectedDates = allDates.slice(-sliceCount);

    return selectedDates.map((d) => {
      const entry = dateMap.get(d)!;
      const refPrice = (entry as any)[referenceSymbol] || 7200;

      if (viewMode === "spread") {
        return {
          date: d,
          is_thin: entry.is_thin,
          has_expiry: entry.has_expiry,
          GOLDM: entry.GOLDM ? ((entry.GOLDM - refPrice) / refPrice) * 100 : 0,
          GOLDTEN: entry.GOLDTEN ? ((entry.GOLDTEN - refPrice) / refPrice) * 100 : 0,
          GOLDGUINEA: entry.GOLDGUINEA ? ((entry.GOLDGUINEA - refPrice) / refPrice) * 100 : 0,
          GOLDPETAL: entry.GOLDPETAL ? ((entry.GOLDPETAL - refPrice) / refPrice) * 100 : 0,
        };
      }

      return {
        date: d,
        is_thin: entry.is_thin,
        has_expiry: entry.has_expiry,
        GOLDM: entry.GOLDM,
        GOLDTEN: entry.GOLDTEN,
        GOLDGUINEA: entry.GOLDGUINEA,
        GOLDPETAL: entry.GOLDPETAL,
      };
    });
  }, [prices, timeRange, viewMode, referenceSymbol]);

  // Find thin liquidity dates for shading
  const thinRanges = useMemo(() => {
    if (!showThinLiquidityShade) return [];
    const ranges: { start: string; end: string }[] = [];
    let curStart: string | null = null;

    chartData.forEach((pt, i) => {
      if (pt.is_thin && !curStart) {
        curStart = pt.date;
      } else if (!pt.is_thin && curStart) {
        ranges.push({ start: curStart, end: chartData[i - 1].date });
        curStart = null;
      }
    });
    if (curStart && chartData.length > 0) {
      ranges.push({ start: curStart, end: chartData[chartData.length - 1].date });
    }
    return ranges;
  }, [chartData, showThinLiquidityShade]);

  const toggleContract = (sym: string) => {
    setVisibleContracts((prev) => ({ ...prev, [sym]: !prev[sym] }));
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="surface-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C8963E]">
                Parity Analysis
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
                Price-per-Gram Basis
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white font-display mt-0.5">
              Cross-Contract Parity & Basis Comparison
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Multi-contract overlay normalized to ₹/gram with crosshair tracking, expiry markers, and thin-liquidity filtering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[var(--surface-subtle)] p-1 rounded-xl border border-[var(--border)]">
              <button
                onClick={() => setViewMode("price")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "price"
                    ? "bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Price (₹/g)
              </button>
              <button
                onClick={() => setViewMode("spread")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "spread"
                    ? "bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                Spread vs {referenceSymbol} (%)
              </button>
            </div>

            {/* Time Horizon Selector */}
            <div className="flex items-center bg-[var(--surface-subtle)] p-1 rounded-xl border border-[var(--border)]">
              {(["1M", "3M", "6M", "ALL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === r
                      ? "bg-[#C8963E] text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Event Markers Toggle */}
            <button
              onClick={() => setShowEventMarkers(!showEventMarkers)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1 cursor-pointer ${
                showEventMarkers
                  ? "bg-[#F4E9D2] dark:bg-[#2A2415] text-[#C8963E] border-[#DFC79E]"
                  : "border-stone-200 dark:border-stone-700 text-stone-400"
              }`}
              title="Toggle Expiry Event Markers"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Contract Spec Chips & Legend Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-stone-100 dark:border-stone-800">
          {CONTRACT_SPECS.map((spec) => {
            const isVisible = visibleContracts[spec.symbol];
            return (
              <div
                key={spec.symbol}
                onClick={() => toggleContract(spec.symbol)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isVisible
                    ? "bg-stone-50/50 dark:bg-[#132238]/50 border-stone-200 dark:border-stone-700 shadow-xs"
                    : "opacity-40 border-stone-200 dark:border-stone-800 bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: spec.color }}
                    />
                    <span className="font-bold text-xs text-stone-900 dark:text-white font-mono">
                      {spec.symbol}
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold">
                    {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="space-y-0.5 text-[11px] text-stone-600 dark:text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Lot:</span>
                    <span className="font-semibold">{spec.lotSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Quote:</span>
                    <span className="font-semibold">{spec.quoteBase}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-400">Expiry:</span>
                    <span className="font-medium text-[#C8963E]">{spec.expiryRule}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Multi-Line Recharts Display */}
      <div className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
              {viewMode === "price"
                ? "Normalized Price Trajectory (INR / Gram)"
                : `Cross-Contract Basis Disparity vs ${referenceSymbol} (%)`}
            </h3>
            {showThinLiquidityShade && thinRanges.length > 0 && (
              <span className="flex items-center space-x-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Shaded: Thin Liquidity Window</span>
              </span>
            )}
          </div>

          <div className="text-xs text-stone-400">
            {chartData.length} trading observations
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />

              <XAxis
                dataKey="date"
                tickFormatter={(d) => d.slice(5)}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
              />

              <YAxis
                domain={viewMode === "spread" ? [-2.5, 2.5] : ["auto", "auto"]}
                tickFormatter={(v) => (viewMode === "spread" ? `${v.toFixed(1)}%` : `₹${v.toFixed(0)}`)}
                stroke="#94A3B8"
                fontSize={11}
                width={60}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: any) => [
                  viewMode === "spread"
                    ? `${Number(value).toFixed(2)}% vs ${referenceSymbol}`
                    : `₹${Number(value).toFixed(2)} / gram`,
                  name,
                ]}
                labelFormatter={(lbl: any) => `Date: ${formatDate(String(lbl))}`}
              />

              <Legend verticalAlign="top" height={36} />

              {/* Zero Parity line for spread mode */}
              {viewMode === "spread" && (
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="4 4" label="Parity (0.00%)" />
              )}

              {/* Shaded Thin Liquidity Areas */}
              {showThinLiquidityShade &&
                thinRanges.map((rng, idx) => (
                  <ReferenceArea
                    key={idx}
                    x1={rng.start}
                    x2={rng.end}
                    fill="#FEF3C7"
                    fillOpacity={0.4}
                  />
                ))}

              {/* Dynamic Contract Lines */}
              {visibleContracts.GOLDM && (
                <Line
                  type="monotone"
                  dataKey="GOLDM"
                  stroke="#C8963E"
                  strokeWidth={2.5}
                  dot={false}
                  name="GOLDM (100g)"
                />
              )}
              {visibleContracts.GOLDTEN && (
                <Line
                  type="monotone"
                  dataKey="GOLDTEN"
                  stroke="#1E3E62"
                  strokeWidth={2}
                  dot={false}
                  name="GOLDTEN (10g)"
                />
              )}
              {visibleContracts.GOLDGUINEA && (
                <Line
                  type="monotone"
                  dataKey="GOLDGUINEA"
                  stroke="#059669"
                  strokeWidth={1.8}
                  dot={false}
                  name="GOLDGUINEA (8g)"
                />
              )}
              {visibleContracts.GOLDPETAL && (
                <Line
                  type="monotone"
                  dataKey="GOLDPETAL"
                  stroke="#D97706"
                  strokeWidth={1.8}
                  dot={false}
                  name="GOLDPETAL (1g)"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Microstructure explanation footer */}
        <div className="mt-4 p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-stone-600 dark:text-stone-300 flex items-start space-x-2">
          <Info className="w-4 h-4 text-[#C8963E] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-stone-900 dark:text-white">
              Institutional Normalization Note:
            </p>
            <p className="leading-relaxed text-[11px] text-stone-500 dark:text-stone-400">
              MCX quotation bases vary: GOLDM &amp; GOLDTEN trade in ₹/10g; GOLDGUINEA trades in ₹/8g; GOLDPETAL trades in ₹/1g.
              All series above are divided by their quotation base grams to reflect pure price-per-gram sovereign parity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
