"use client";

import React from "react";
import { formatPct, formatZScore } from "@/lib/utils";
import { SignalItem } from "@/lib/types";
import { Card, Label, Kpi } from "@/components/ui";

interface HeroKPIsProps {
  activeCount: number;
  totalEvaluated: number;
  disciplineStatus: string;
  avgConfidence: number;
  bestOpportunity: SignalItem | null;
  healthScore: number;
  tradingDays: number;
  thinLiquidityCount: number;
  onSelectSignal?: (signal: SignalItem) => void;
  asOfDate?: string;
}

export const HeroKPIs: React.FC<HeroKPIsProps> = ({
  activeCount,
  totalEvaluated,
  disciplineStatus,
  avgConfidence,
  bestOpportunity,
  healthScore,
  tradingDays,
  thinLiquidityCount,
  onSelectSignal,
  asOfDate = "2026-09-22",
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Active Signals */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <Label>Active Signals</Label>
          <div className="mt-2 font-mono text-2xl tabular-nums text-ink">
            {activeCount} <span className="text-xs text-muted font-sans font-normal">/ {totalEvaluated} scanned</span>
          </div>
          <div className="mt-1 text-xs text-muted">
            {disciplineStatus === "ACTIVE_OPPORTUNITY" ? (
              <span className="text-pos font-medium">Hurdle cleared &bull; Actionable</span>
            ) : (
              <span>Spreads inside fair-value band</span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-line text-[11px] text-muted">
          Suppressed if volume thin or conf &lt;62%
        </div>
      </Card>

      {/* 2. Reversion Confidence */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <Label>Reversion Confidence</Label>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold tabular-nums text-ink">
              {(avgConfidence * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] font-mono text-muted">
              {avgConfidence >= 0.62 ? (
                <span className="text-[#067647] font-semibold">Above Hurdle</span>
              ) : (
                <span className="text-[#5B6676]">Below 62% Hurdle</span>
              )}
            </span>
          </div>

          {/* Prominent High-Contrast Progress Bar with Hurdle Marker */}
          <div className="relative w-full bg-[#E2E8F0] rounded-full h-3.5 mt-3 overflow-hidden border border-[#CBD5E1]">
            {/* 62% Hurdle Marker */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#11161C] z-20 shadow-xs"
              style={{ left: "62%" }}
              title="62% Reversion Hurdle"
            />
            {/* Filled Progress Bar */}
            <div
              className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1 text-[9px] font-bold text-white"
              style={{
                width: `${Math.min(100, Math.max(8, avgConfidence * 100))}%`,
                backgroundColor: avgConfidence >= 0.62 ? "#067647" : "#A8741A",
              }}
            />
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-line text-[11px] text-muted flex justify-between items-center">
          <span className="font-mono font-medium">Hurdle: 62.0%</span>
          <span className="text-[#A8741A] font-semibold">XGBoost Platt</span>
        </div>
      </Card>

      {/* 3. Top Dislocated Spread */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <Label>Top Dislocated Spread</Label>
          {bestOpportunity ? (
            <div>
              <div className="mt-2 flex items-baseline justify-between font-mono text-xl tabular-nums text-ink">
                <span>{bestOpportunity.symbol}</span>
                <span className="text-sm font-semibold">{formatZScore(bestOpportunity.z_score)}</span>
              </div>
              <div className="mt-1 text-xs text-muted font-mono tabular-nums">
                {formatPct(bestOpportunity.spread_pct)} basis &bull; {bestOpportunity.days_to_expiry}d to exp
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted">In equilibrium corridor</div>
          )}
        </div>
        <div className="mt-3 pt-2 border-t border-line text-[11px] text-muted flex justify-between items-center">
          {bestOpportunity ? (
            <button
              onClick={() => onSelectSignal && onSelectSignal(bestOpportunity)}
              className="text-gold hover:underline cursor-pointer font-medium"
            >
              Explain Thesis &rarr;
            </button>
          ) : (
            <span>Structural parity</span>
          )}
          <span className="font-mono text-[10px]">{asOfDate}</span>
        </div>
      </Card>

      {/* 4. Settlement Data Health */}
      <Card className="p-5 flex flex-col justify-between">
        <div>
          <Label>Settlement Data Health</Label>
          <div className="mt-2 font-mono text-2xl tabular-nums text-pos">
            {healthScore}%
          </div>
          <div className="mt-1 text-xs text-muted">
            {tradingDays} trading days &bull; Strict T &ge; t
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-line text-[11px] text-muted flex justify-between font-mono">
          <span>Thin Liquidity:</span>
          <span className="tabular-nums">{thinLiquidityCount} rows</span>
        </div>
      </Card>
    </div>
  );
};
