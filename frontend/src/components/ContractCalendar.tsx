"use client";

import React from "react";
import { formatINR, formatDate } from "@/lib/utils";
import { CalendarItem } from "@/lib/types";
import { Card, Label } from "@/components/ui";

interface ContractCalendarProps {
  calendar: CalendarItem[];
}

export const ContractCalendar: React.FC<ContractCalendarProps> = ({ calendar }) => {
  // Group contracts by expiry month for compact timeline display
  const monthsGroup = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    calendar.forEach((item) => {
      const expDate = new Date(item.expiry_date);
      const monthKey = expDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!map.has(monthKey)) {
        map.set(monthKey, []);
      }
      map.get(monthKey)!.push(item);
    });
    return Array.from(map.entries());
  }, [calendar]);

  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-line gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">
            Contract Expiry Timeline &amp; Delivery Calendar
          </h3>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Grouped contract lifecycle maturities across active settlement cycles.
          </p>
        </div>
        <span className="text-[11px] font-mono text-muted self-start sm:self-auto">
          Tender Window: &le; 5 days
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {monthsGroup.map(([month, items]) => (
          <div key={month} className="p-3.5 rounded border border-line bg-ground/40 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-line/60">
              <span className="font-semibold text-ink text-xs">{month} Cycle</span>
              <span className="text-[11px] font-mono text-muted">{items.length} contracts</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {items.map((item) => {
                const isRoll = item.is_roll_window;
                return (
                  <div
                    key={`${item.symbol}-${item.expiry_date}`}
                    className={`p-2 rounded border bg-white flex flex-col justify-between ${
                      isRoll ? "border-neg/40 bg-neg/5" : "border-line"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-ink">{item.symbol}</span>
                      <span
                        className={`font-mono text-[10px] tabular-nums px-1 py-0.2 rounded ${
                          isRoll ? "text-neg bg-neg/10 font-medium" : "text-muted bg-ground"
                        }`}
                      >
                        {item.days_to_expiry}d
                      </span>
                    </div>

                    <div className="mt-1 text-[11px] font-mono text-ink tabular-nums">
                      {formatINR(item.price_per_gram)}/g
                    </div>

                    <div className="text-[10px] text-muted mt-0.5">
                      {isRoll ? "Tender Active" : "Active"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
