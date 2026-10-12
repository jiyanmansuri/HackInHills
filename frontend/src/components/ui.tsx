"use client";

import React from "react";
import { ResponsiveContainer } from "recharts";

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-md border border-line bg-white ${className}`}>{children}</section>
);

export const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{children}</div>
);

export function Kpi({
  label,
  value,
  sub,
  tone = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "ink" | "pos" | "neg";
}) {
  const c = {
    ink: "text-ink",
    pos: "text-pos",
    neg: "text-neg",
  }[tone];

  return (
    <Card className="p-5">
      <Label>{label}</Label>
      <div className={`mt-2 font-mono text-2xl tabular-nums ${c}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  );
}

export function ChartCard({
  title,
  subtitle,
  loading,
  empty,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  empty?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-4 h-[300px] w-full">
        {loading ? (
          <div className="h-full animate-pulse rounded bg-slate-100" />
        ) : empty ? (
          <div className="grid h-full place-items-center text-sm text-muted">No data for this range</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
