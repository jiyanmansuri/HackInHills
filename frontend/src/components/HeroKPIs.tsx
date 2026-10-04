"use client";

import React from "react";
import { Zap, Target, TrendingUp, ShieldCheck, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { formatPct, formatZScore, formatINR } from "@/lib/utils";
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
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Active Arbitrage Signals */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Reversion Signals
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#0B192C]">{activeCount}</span>
            <span className="text-xs text-slate-400">/ {totalEvaluated} pairs evaluated</span>
          </div>
          <div className="mt-2 flex items-center space-x-2">
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
          Strict filtering: Suppressed if thin volume or &lt;62% confidence.
        </div>
      </div>

      {/* 2. Mean-Reversion Confidence */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Reversion Confidence
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#FEF9F0] text-[#C8963E] flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-[#0B192C]">
              {(avgConfidence * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">calibrated XGBoost</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-[#C8963E] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, avgConfidence * 100)}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
          <span>Hurdle Rate: 62.0%</span>
          <span className="text-[#C8963E] font-medium">Platt Calibrated</span>
        </div>
      </div>

      {/* 3. Top Mispriced Opportunity */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Top Dislocated Spread
          </span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3">
          {bestOpportunity ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#0B192C]">
                  {bestOpportunity.symbol} vs GOLDM
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {formatZScore(bestOpportunity.z_score)}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-1">
                {bestOpportunity.spread_pct > 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-rose-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-sm font-semibold text-slate-700">
                  {formatPct(bestOpportunity.spread_pct)} basis
                </span>
                <span className="text-xs text-slate-400">({bestOpportunity.days_to_expiry}d to exp)</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400 italic">No dislocations detected</div>
          )}
        </div>

        <div className="text-[11px] pt-2 border-t border-slate-100">
          {bestOpportunity ? (
            <button
              onClick={() => onSelectSignal && onSelectSignal(bestOpportunity)}
              className="text-[#C8963E] hover:text-[#9A671A] font-medium cursor-pointer underline text-[11px]"
            >
              Explain Thesis with Claude &rarr;
            </button>
          ) : (
            <span className="text-slate-400">Market in structural equilibrium</span>
          )}
        </div>
      </div>

      {/* 4. Data Quality & Liquidity Health */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Settlement Data Health
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="my-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-emerald-600">{healthScore}%</span>
            <span className="text-xs text-slate-500 font-medium">HEALTHY</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {tradingDays} Trading Days Verified &bull; Strict $T \ge t$ Expiry Parity
          </p>
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
          <span>Thin Liquidity Tagged:</span>
          <span className="font-semibold text-amber-600">{thinLiquidityCount} rows</span>
        </div>
      </div>
    </div>
  );
};
