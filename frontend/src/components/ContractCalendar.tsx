"use client";

import React from "react";
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { CalendarItem } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

interface ContractCalendarProps {
  calendar: CalendarItem[];
}

export const ContractCalendar: React.FC<ContractCalendarProps> = ({ calendar }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-[#0B192C]">
              Expiry-Aware Contract Lifecycle &amp; Calendar
            </h2>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-200">
              Composite Identity (Symbol, Expiry)
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time tracking of active contracts, tender/roll windows, and days to maturity.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            <span>&le; 5 Days: Tender Roll Alert</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="pb-3 pr-4">Symbol &amp; Lot</th>
              <th className="pb-3 px-3">Expiry Date</th>
              <th className="pb-3 px-3">Days to Expiry</th>
              <th className="pb-3 px-3">Lifecycle Status</th>
              <th className="pb-3 px-3">Settlement / g</th>
              <th className="pb-3 px-3">Raw Quote</th>
              <th className="pb-3 px-3">Volume (Lots)</th>
              <th className="pb-3 pl-3 text-right">Open Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calendar.map((item) => {
              const isRoll = item.is_roll_window;

              return (
                <tr
                  key={`${item.symbol}-${item.expiry_date}`}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isRoll ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="py-3 pr-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#0B192C]" />
                      <span>{item.symbol}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Physical Lot: {item.lot_size_g}g
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {formatDate(item.expiry_date)}
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        isRoll
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : item.days_to_expiry <= 15
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{item.days_to_expiry} days</span>
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {isRoll ? (
                      <span className="inline-flex items-center space-x-1 text-rose-700 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Tender / Roll Window</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-slate-600 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Active Trading</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-900">
                    {formatINR(item.price_per_gram)}/g
                  </td>

                  <td className="py-3 px-3 text-slate-600 font-mono">
                    ₹{item.raw_close.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {item.volume_contracts.toLocaleString()}
                    {item.is_thin_liquidity && (
                      <span className="ml-1 text-[10px] text-amber-600 bg-amber-50 px-1 rounded">
                        thin
                      </span>
                    )}
                  </td>

                  <td className="py-3 pl-3 text-right font-medium text-slate-700">
                    {item.oi_contracts.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
