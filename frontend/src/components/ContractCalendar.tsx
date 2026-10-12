"use client";

import React from "react";
import { formatINR, formatDate } from "@/lib/utils";
import { CalendarItem } from "@/lib/types";
import { Card, Label } from "@/components/ui";

interface ContractCalendarProps {
  calendar: CalendarItem[];
}

export const ContractCalendar: React.FC<ContractCalendarProps> = ({ calendar }) => {
  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-line gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">
            Contract Lifecycle &amp; Expiry Schedule
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Active MCX futures contracts, days to maturity, and per-gram settlement.
          </p>
        </div>
        <span className="text-[11px] font-mono text-muted self-start sm:self-auto">
          Tender window: &le; 5 days
        </span>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-line text-muted font-medium uppercase tracking-wider text-[11px]">
              <th className="pb-2.5 pr-4">Symbol</th>
              <th className="pb-2.5 px-3">Expiry Date</th>
              <th className="pb-2.5 px-3">Days to Expiry</th>
              <th className="pb-2.5 px-3">Lifecycle Status</th>
              <th className="pb-2.5 pl-3 text-right">Settlement / g</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {calendar.map((item) => {
              const isRoll = item.is_roll_window;

              return (
                <tr
                  key={`${item.symbol}-${item.expiry_date}`}
                  className="hover:bg-ground/50 transition-colors"
                >
                  <td className="py-2.5 pr-4 font-medium text-ink">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-ink" />
                      <span>{item.symbol}</span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-muted">
                    {formatDate(item.expiry_date)}
                  </td>

                  <td className="py-2.5 px-3 font-mono tabular-nums text-ink">
                    <span className={isRoll ? "text-neg font-semibold" : ""}>
                      {item.days_to_expiry}d
                    </span>
                  </td>

                  <td className="py-2.5 px-3">
                    {isRoll ? (
                      <span className="text-neg font-medium text-xs">
                        Tender / Roll Window
                      </span>
                    ) : (
                      <span className="text-muted text-xs">
                        Active Trading
                      </span>
                    )}
                  </td>

                  <td className="py-2.5 pl-3 text-right font-mono font-medium text-ink tabular-nums">
                    {formatINR(item.price_per_gram)}/g
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
