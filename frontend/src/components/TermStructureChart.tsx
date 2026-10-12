"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { TermStructureResponse } from "@/lib/types";
import { formatINR, formatPct, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui";

interface TermStructureChartProps {
  termStructure: TermStructureResponse | null;
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
}

export const TermStructureChart: React.FC<TermStructureChartProps> = ({
  termStructure,
  onSelectSymbol,
  selectedSymbol,
}) => {
  const curve = termStructure?.curve || [];
  const isContango = termStructure?.is_contango ?? true;

  const chartData = curve.map((pt, idx) => ({
    expiry: `${formatDate(pt.expiry_date)} (M${idx + 1})`,
    price: pt.price_per_gram,
    carry: pt.annualized_carry_pct,
    spread: pt.calendar_spread_inr,
    days: pt.days_to_expiry,
  }));

  const symbols = ["GOLDM", "GOLDTEN", "GOLDGUINEA", "GOLDPETAL"];

  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-line gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-[15px] font-semibold text-ink">
              Forward Term Structure Curve
            </h3>
            <span className="font-mono text-xs text-muted">
              ({isContango ? "Contango" : "Backwardation"})
            </span>
          </div>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Per-gram forward curve across active expiries. Slope reflects implied carry and convenience yield.
          </p>
        </div>
      </div>

      {/* Contract selector tabs */}
      <div className="flex items-center space-x-1 my-3 bg-ground p-0.5 rounded text-xs font-medium w-fit">
        {symbols.map((sym) => (
          <button
            key={sym}
            onClick={() => onSelectSymbol(sym)}
            className={`px-3 py-1 rounded cursor-pointer transition-all ${
              selectedSymbol === sym
                ? "bg-white text-ink font-semibold shadow-xs"
                : "text-muted hover:text-ink"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-2 h-[260px] min-h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 10 }}>
              <CartesianGrid stroke="#EEF0F3" vertical={false} />
              <XAxis
                dataKey="expiry"
                padding={{ left: 40, right: 40 }}
                tick={{ fontSize: 11, fill: "#5B6676", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₹${Math.round(v)}`}
                tick={{ fontSize: 11, fill: "#8A94A3", fontFamily: "var(--font-mono)" }}
                tickLine={false}
                axisLine={false}
                width={56}
                orientation="right"
              />
              <Tooltip
                contentStyle={{ border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 12, boxShadow: "none" }}
                formatter={(value: any) => [`₹${Number(value).toFixed(1)}/g`, "Settlement"]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#A8741A"
                strokeWidth={2}
                dot={{ r: 5, fill: "#11161C", stroke: "#A8741A", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expiry Details */}
        <div className="space-y-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted block font-mono">
            Calendar Expiry Details
          </span>
          {curve.map((pt, idx) => (
            <div
              key={pt.expiry_date}
              className="p-2.5 rounded border border-line bg-ground/40 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-medium text-ink">
                  {idx === 0 ? "Near Month (T1)" : idx === 1 ? "Middle Month (T2)" : "Far Month (T3)"}
                </div>
                <div className="text-[11px] text-muted font-mono">{formatDate(pt.expiry_date)} &bull; {pt.days_to_expiry}d exp</div>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium text-ink tabular-nums">{formatINR(pt.price_per_gram)}/g</div>
                <div className="text-[11px] text-muted font-mono">
                  Carry: {formatPct(pt.annualized_carry_pct)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
