"use client";

import React from "react";
import { Clock } from "lucide-react";
import { CalendarItem } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

interface ContractCalendarProps {
  calendar: CalendarItem[];
}

export const ContractCalendar: React.FC<ContractCalendarProps> = ({ calendar }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs transition hover:shadow-md mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Contract Lifecycle &amp; Expiry Schedule
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active MCX futures contracts, days to maturity, and settlement per gram.
          </p>
        </div>
        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200 self-start sm:self-auto">
          &le; 5 Days: Tender Roll Window
        </span>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="pb-2.5 pr-4">Symbol</th>
              <th className="pb-2.5 px-3">Expiry Date</th>
              <th className="pb-2.5 px-3">Days to Expiry</th>
              <th className="pb-2.5 px-3">Lifecycle Status</th>
              <th className="pb-2.5 pl-3 text-right">Settlement / g</th>
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
                  <td className="py-2.5 pr-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-slate-900" />
                      <span>{item.symbol}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-slate-600 font-medium">
                    {formatDate(item.expiry_date)}
                  </td>

                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-semibold text-xs ${
                        isRoll
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : item.days_to_expiry <= 15
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{item.days_to_expiry}d</span>
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    {isRoll ? (
                      <span className="inline-flex items-center text-rose-700 font-semibold text-xs">
                        Tender / Roll Window
                      </span>
                    ) : (
                      <span className="text-slate-600 font-medium text-xs">
                        Active Trading
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 pl-3 text-right font-bold text-slate-900 tabular-nums">
                    {formatINR(item.price_per_gram)}/g
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
