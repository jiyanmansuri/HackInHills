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

  const chartData = curve.map((pt) => ({
    expiry: formatDate(pt.expiry_date),
    price: pt.price_per_gram,
    carry: pt.annualized_carry_pct,
    spread: pt.calendar_spread_inr,
    days: pt.days_to_expiry,
  }));

  const symbols = ["GOLDM", "GOLDTEN", "GOLDGUINEA", "GOLDPETAL"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md mb-6">
      {/* Title & Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-slate-900">
              Forward Term Structure Curve
            </h2>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isContango
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {isContango ? "Contango (Carry Positive)" : "Backwardation (Prompt Premium)"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Per-gram forward curve across active expiries. Slope reflects implied financing and convenience yield.
          </p>
        </div>
      </div>

      {/* Contract Tabs below title */}
      <div className="flex items-center space-x-1 my-3 bg-slate-100 p-0.5 rounded-lg text-xs font-medium w-fit">
        {symbols.map((sym) => (
          <button
            key={sym}
            onClick={() => onSelectSymbol(sym)}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              selectedSymbol === sym
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {sym}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Term Structure Chart */}
        <div className="lg:col-span-2 h-[260px] min-h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="expiry" tick={{ fontSize: 11, fill: "#64748B" }} stroke="#E2E8F0" />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => `₹${Math.round(v)}`}
                tick={{ fontSize: 11, fill: "#64748B" }}
                stroke="#E2E8F0"
                orientation="right"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-md text-xs">
                      <div className="font-semibold text-slate-900 mb-1">{item.expiry}</div>
                      <div className="space-y-1">
                        <div>Price: <strong>{formatINR(item.price)}/g</strong></div>
                        <div>Calendar Basis: <strong>{item.spread >= 0 ? "+" : ""}{item.spread} ₹/g</strong></div>
                        <div>Annualized Carry: <strong>{formatPct(item.carry)}</strong></div>
                      </div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#B8860B"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expiry Details */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Calendar Expiry Details
          </span>
          {curve.map((pt, idx) => (
            <div
              key={pt.expiry_date}
              className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-semibold text-slate-900">
                  {idx === 0 ? "Near Month (T1)" : idx === 1 ? "Middle Month (T2)" : "Far Month (T3)"}
                </div>
                <div className="text-[11px] text-slate-500">{formatDate(pt.expiry_date)}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-900 tabular-nums">{formatINR(pt.price_per_gram)}/g</div>
                <div className="text-[11px] text-slate-500">
                  Carry: <strong className="text-slate-700">{formatPct(pt.annualized_carry_pct)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
