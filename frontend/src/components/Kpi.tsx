"use client";

import React from "react";

interface KpiProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad";
}

export const Kpi: React.FC<KpiProps> = ({
  label,
  value,
  sub,
  tone = "default",
}) => {
  const color = {
    default: "text-slate-900",
    good: "text-emerald-600",
    bad: "text-rose-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-semibold tabular-nums ${color}`}>
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-slate-500 font-medium">{sub}</div>}
    </div>
  );
};
