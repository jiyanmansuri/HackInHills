"use client";

import React, { useState, useMemo } from "react";
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
import { NormalizedPriceRecord } from "@/lib/types";
import { formatINR, formatPct, formatDate } from "@/lib/utils";

interface PriceComparisonChartProps {
  data: NormalizedPriceRecord[];
}

const CONTRACT_COLORS: Record<string, string> = {
  GOLDM: "#0B192C",
  GOLDTEN: "#C8963E",
  GOLDGUINEA: "#7C3AED",
  GOLDPETAL: "#059669",
};

export const PriceComparisonChart: React.FC<PriceComparisonChartProps> = ({ data }) => {
  const [selectedRange, setSelectedRange] = useState<"1M" | "3M" | "6M" | "ALL">("3M");
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
      // Front-month or average normalized close on that date
      entry[item.symbol] = item.norm_close;
    });

    const sorted = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Apply date range filter
    if (sorted.length === 0) return [];
    if (selectedRange === "ALL") return sorted;

    const daysCount = selectedRange === "1M" ? 22 : selectedRange === "3M" ? 65 : 130;
    return sorted.slice(-daysCount);
  }, [data, selectedRange]);

  const toggleSymbol = (sym: string) => {
    setActiveSymbols((prev) => ({ ...prev, [sym]: !prev[sym] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const goldmVal = payload.find((p: any) => p.dataKey === "GOLDM")?.value;

    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs">
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
                  <span className="font-bold text-slate-900">{formatINR(val)}/g</span>
                  {sym !== "GOLDM" && goldmVal && (
                    <span
                      className={`ml-2 text-[10px] font-semibold ${
                        spreadVsGoldM > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      ({formatPct(spreadPct)})
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-[#0B192C]">
            Normalized Contract Price Parity (INR / gram)
          </h2>
          <p className="text-xs text-slate-500">
            All 4 MCX futures contracts standardized to 1.0g pure gold basis. Divergences highlight relative-value arbitrage opportunities.
          </p>
        </div>

        {/* Range selectors */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {(["1M", "3M", "6M", "ALL"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                selectedRange === range
                  ? "bg-white text-[#0B192C] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Contract toggles */}
      <div className="flex flex-wrap items-center gap-2 py-3 text-xs">
        <span className="text-slate-400 font-medium mr-1">Display Series:</span>
        {Object.entries(CONTRACT_COLORS).map(([sym, color]) => (
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
        ))}
      </div>

      {/* Recharts Line Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
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
            <Legend wrapperStyle={{ display: "none" }} />

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
                strokeWidth={1.8}
                dot={false}
                name="GOLDTEN (10g)"
              />
            )}
            {activeSymbols.GOLDGUINEA && (
              <Line
                type="monotone"
                dataKey="GOLDGUINEA"
                stroke={CONTRACT_COLORS.GOLDGUINEA}
                strokeWidth={1.8}
                dot={false}
                name="GOLDGUINEA (8g)"
              />
            )}
            {activeSymbols.GOLDPETAL && (
              <Line
                type="monotone"
                dataKey="GOLDPETAL"
                stroke={CONTRACT_COLORS.GOLDPETAL}
                strokeWidth={1.8}
                dot={false}
                name="GOLDPETAL (1g)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
