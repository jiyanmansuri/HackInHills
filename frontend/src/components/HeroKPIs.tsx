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
          <div className="mt-2 font-mono text-2xl tabular-nums text-ink">
            {(avgConfidence * 100).toFixed(1)}%
          </div>
          <div className="relative w-full bg-ground rounded h-2 mt-2.5 overflow-hidden border border-line/60">
            {/* 62% Hurdle Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-ink/70 z-10"
              style={{ left: "62%" }}
              title="62% Reversion Hurdle"
            />
            <div
              className="bg-gold h-full rounded transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, avgConfidence * 100))}%` }}
            />
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-line text-[11px] text-muted flex justify-between items-center">
          <span className="font-mono">Hurdle: 62.0%</span>
          <span className="text-gold font-medium">XGBoost Platt</span>
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
