"use client";

import React from "react";
import { ResponsiveContainer } from "recharts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  action,
  loading = false,
  empty = false,
  children,
  className = "",
}) => {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="mt-4 h-[320px] min-h-[320px] w-full">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-xl bg-slate-100/80" />
        ) : empty ? (
          <div className="grid h-full place-items-center text-xs text-slate-400">
            No active data records found for this selection
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children as any}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};
