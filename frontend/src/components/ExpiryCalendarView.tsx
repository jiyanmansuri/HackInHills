"use client";

import React, { useMemo } from "react";
import {
  CalendarRange,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
  Calendar,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { CalendarItem } from "@/lib/types";
import { formatINR, formatDate, formatCompactNumber } from "@/lib/utils";

interface ExpiryCalendarViewProps {
  calendar: CalendarItem[];
}

export function ExpiryCalendarView({ calendar }: ExpiryCalendarViewProps) {
  // Sort calendar by expiry_date then symbol
  const sortedCalendar = useMemo(() => {
    return [...calendar].sort((a, b) => {
      if (a.expiry_date === b.expiry_date) {
        return a.symbol.localeCompare(b.symbol);
      }
      return a.expiry_date.localeCompare(b.expiry_date);
    });
  }, [calendar]);

  // Determine contract category (5th of month vs month-end based on MCX specs)
  const enrichedContracts = useMemo(() => {
    return sortedCalendar.map((item) => {
      const is5th = item.symbol === "GOLDGUINEA" || item.symbol === "GOLDPETAL";
      const isTenderZone = item.days_to_expiry <= 5;
      const isRollWindow = item.is_roll_window || (item.days_to_expiry > 5 && item.days_to_expiry <= 12);

      // Displayed target expiry rule for MCX
      const targetExpiryDisplay = is5th
        ? item.expiry_date
        : item.expiry_date.replace(/-05$/, "-28"); // month-end delivery display

      return {
        ...item,
        displayExpiry: targetExpiryDisplay,
        is5th,
        expiryType: is5th ? "5th of Month" : "Month-End",
        isTenderZone,
        isRollWindow,
      };
    });
  }, [sortedCalendar]);

  // Group by distinct expiry date
  const distinctExpiries = useMemo(() => {
    const map = new Map<string, typeof enrichedContracts>();
    enrichedContracts.forEach((c) => {
      if (!map.has(c.expiry_date)) {
        map.set(c.expiry_date, []);
      }
      map.get(c.expiry_date)!.push(c);
    });
    return Array.from(map.entries());
  }, [enrichedContracts]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Thesis Card */}
      <div className="surface-card p-6 border-l-4 border-l-[#1E3E62]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1E3E62]/10 dark:bg-[#1E3E62]/40 text-[#1E3E62] dark:text-[#93C5FD] text-[11px] font-black uppercase tracking-wider">
                MCX Expiry Dynamics
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Asymmetric Delivery Schedule
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-display mt-1">
              5th-of-Month vs Month-End Expiry Dynamics
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
              Unlike standardized equity derivatives, MCX Gold contracts do{" "}
              <strong className="text-stone-900 dark:text-white">not</strong> share a uniform expiry date.
              Retail contracts (<strong>GOLDPETAL 1g</strong> and <strong>GOLDGUINEA 8g</strong>) expire on the{" "}
              <strong className="text-[#C8963E]">5th of each month</strong>, whereas institutional{" "}
              <strong>GOLDM (100g)</strong> expires at <strong className="text-[#1E3E62]">month-end</strong>.
              This ~20 day carry gap creates persistent cross-contract pricing dislocations.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <div>
                <span className="font-bold block text-[11px]">Tender Exclusion Zone</span>
                <span className="text-[10px] text-rose-600">Final 5 days before expiry</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Gantt / Timeline of Active Contracts */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white font-display">
              Active Contracts Expiry &amp; Roll Lifecycle (Gantt View)
            </h3>
            <p className="text-xs text-stone-500">
              Visualizing the delivery offset, roll window (10d prior), and physical delivery tender freeze
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#C8963E]" />
              <span className="text-stone-600 dark:text-stone-300">5th of Month</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-[#1E3E62]" />
              <span className="text-stone-600 dark:text-stone-300">Month-End</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              <span className="text-rose-600 font-bold">Tender Freeze</span>
            </div>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="space-y-4">
          {enrichedContracts.map((contract, idx) => {
            const maxDays = 90;
            const dte = Math.min(contract.days_to_expiry, maxDays);
            const progressPct = Math.max(5, Math.min(100, ((maxDays - dte) / maxDays) * 100));

            return (
              <div
                key={`${contract.symbol}-${contract.expiry_date}-${idx}`}
                className="p-3 rounded-xl bg-stone-50/50 dark:bg-[#132238]/50 border border-stone-200 dark:border-stone-800 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        contract.is5th ? "bg-[#C8963E]" : "bg-[#1E3E62]"
                      }`}
                    />
                    <span className="font-bold font-mono text-stone-900 dark:text-white">
                      {contract.symbol}
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">
                      ({contract.lot_size_g}g lot &bull; ₹{contract.price_per_gram.toFixed(2)}/g)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        contract.is5th
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                          : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                      }`}
                    >
                      {contract.expiryType}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-stone-500 font-mono text-[11px]">
                    <span>Delivery: {contract.displayExpiry}</span>
                    <span
                      className={`font-bold ${
                        contract.isTenderZone
                          ? "text-rose-600 dark:text-rose-400"
                          : contract.isRollWindow
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      {contract.days_to_expiry} Days Left
                    </span>
                  </div>
                </div>

                {/* Visual Gantt Bar */}
                <div className="relative h-6 bg-stone-200 dark:bg-stone-800 rounded-lg overflow-hidden flex items-center">
                  {/* Progress bar up to current position */}
                  <div
                    className={`h-full transition-all duration-300 ${
                      contract.isTenderZone
                        ? "bg-rose-500"
                        : contract.isRollWindow
                        ? "bg-amber-500"
                        : contract.is5th
                        ? "bg-[#C8963E]"
                        : "bg-[#1E3E62]"
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />

                  {/* Tender period marker at the tail */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-rose-600/30 border-l border-rose-500 flex items-center justify-center text-[9px] font-bold text-rose-700 dark:text-rose-300">
                    5D
                  </div>

                  <span className="absolute left-3 text-[10px] font-bold text-white drop-shadow-xs">
                    {contract.isTenderZone
                      ? "⚠️ TENDER PERIOD: NO CASH ARB"
                      : contract.isRollWindow
                      ? "ROLL ACTIVE WINDOW"
                      : `${contract.days_to_expiry} days to delivery`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Contract Table with Lot Size, OI & Volume */}
      <div className="surface-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 dark:text-white font-display">
              All Active Contracts Specifications &amp; Liquidity Depth
            </h3>
            <p className="text-xs text-stone-500">
              Comparing gram-equivalent Open Interest and Volume across contracts
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 font-bold uppercase text-[10px]">
                <th className="pb-2.5">Contract</th>
                <th className="pb-2.5">Expiry Date</th>
                <th className="pb-2.5 text-center">Cycle Type</th>
                <th className="pb-2.5 text-right">Per-Gram Price</th>
                <th className="pb-2.5 text-right">Lot Size</th>
                <th className="pb-2.5 text-right">Volume (Grams)</th>
                <th className="pb-2.5 text-right">OI (Grams)</th>
                <th className="pb-2.5 text-center">Roll Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {enrichedContracts.map((c, i) => (
                <tr key={i} className="hover:bg-stone-50 dark:hover:bg-[#132238]">
                  <td className="py-2.5 font-bold text-stone-900 dark:text-white font-mono">
                    {c.symbol}
                  </td>
                  <td className="py-2.5 text-stone-600 dark:text-stone-300 font-mono">
                    {c.displayExpiry}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.is5th
                          ? "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                          : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {c.expiryType}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-stone-900 dark:text-white">
                    ₹{c.price_per_gram.toFixed(2)}/g
                  </td>
                  <td className="py-2.5 text-right font-mono text-stone-600 dark:text-stone-400">
                    {c.lot_size_g}g
                  </td>
                  <td className="py-2.5 text-right font-mono text-stone-700 dark:text-stone-300">
                    {formatCompactNumber(c.volume_grams)}g
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-stone-800 dark:text-stone-200">
                    {formatCompactNumber(c.oi_contracts * c.lot_size_g)}g
                  </td>
                  <td className="py-2.5 text-center">
                    {c.isTenderZone ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                        Tender Zone
                      </span>
                    ) : c.isRollWindow ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Roll Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-500">
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
