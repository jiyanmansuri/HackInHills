"use client";

import React from "react";
import { Zap, Target, TrendingUp, ShieldCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatPct, formatZScore } from "@/lib/utils";
import { SignalItem } from "@/lib/types";

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
      {/* 1. Active Arbitrage Signals */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Reversion Signals
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-slate-900 tabular-nums">{activeCount}</span>
            <span className="text-xs text-slate-400">/ {totalEvaluated} pairs evaluated</span>
          </div>
          <div className="mt-2">
            {disciplineStatus === "ACTIVE_OPPORTUNITY" ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Actionable Arbitrage Active
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Disciplined: Permission to Stay Quiet
              </span>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          Suppressed when volume thin or confidence &lt;62%
        </div>
      </div>

      {/* 2. Mean-Reversion Confidence */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Reversion Confidence
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-slate-900 tabular-nums">
              {(avgConfidence * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-medium">calibrated ML</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, avgConfidence * 100)}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
          <span>Hurdle Rate: 62.0%</span>
          <span className="text-amber-700 font-medium">Platt Calibrated</span>
        </div>
      </div>

      {/* 3. Top Mispriced Opportunity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Top Dislocated Spread
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          {bestOpportunity ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">
                  {bestOpportunity.symbol} vs GOLDM
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg tabular-nums">
                  {formatZScore(bestOpportunity.z_score)}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-1 text-xs">
                {bestOpportunity.spread_pct > 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span className="font-semibold text-slate-700 tabular-nums">
                  {formatPct(bestOpportunity.spread_pct)} basis
                </span>
                <span className="text-slate-400">
                  ({bestOpportunity.days_to_expiry}d to exp)
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              Spreads currently within fair-value boundaries
            </div>
          )}
        </div>

        <div className="text-[11px] pt-2 border-t border-slate-100 flex justify-between items-center">
          {bestOpportunity ? (
            <button
              onClick={() => onSelectSignal && onSelectSignal(bestOpportunity)}
              className="text-amber-700 hover:text-amber-800 font-medium cursor-pointer underline text-[11px]"
            >
              Explain Thesis &rarr;
            </button>
          ) : (
            <span className="text-slate-400">Structural equilibrium</span>
          )}
          <span className="text-[10px] text-slate-400">As of {asOfDate}</span>
        </div>
      </div>

      {/* 4. Data Quality & Liquidity Health */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Settlement Data Health
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-semibold text-emerald-600 tabular-nums">{healthScore}%</span>
            <span className="text-xs text-slate-500 font-medium">HEALTHY</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {tradingDays} Trading Days Verified &bull; Strict Expiry Parity (T &ge; t)
          </p>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
          <span>Thin Liquidity Tagged:</span>
          <span className="font-semibold text-amber-600 tabular-nums">{thinLiquidityCount} rows</span>
        </div>
      </div>
    </div>
  );
};
