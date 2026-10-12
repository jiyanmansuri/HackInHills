"use client";

import React, { useState, useMemo } from "react";
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Percent,
  Coins,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { SignalItem, SignalsResponse, SignalState } from "@/lib/types";
import {
  formatINR,
  formatPct,
  formatBps,
  formatZScore,
  formatDate,
  computeSpreadDecomposition,
} from "@/lib/utils";

interface SignalsViewProps {
  signalsData: SignalsResponse | null;
  referenceSymbol: string;
  isNetOfCosts: boolean;
  onSelectSignal: (sig: Partial<SignalItem>) => void;
}

export function SignalsView({
  signalsData,
  referenceSymbol,
  isNetOfCosts,
  onSelectSignal,
}: SignalsViewProps) {
  const [filterState, setFilterState] = useState<"ALL" | "SIGNAL" | "WATCH" | "NO_SIGNAL">("ALL");

  const rawSignals = signalsData?.signals || [];

  // Enrich with mathematical decomposition
  const enrichedSignals = useMemo(() => {
    return rawSignals.map((s) => {
      const decomp = computeSpreadDecomposition({
        pair: `${s.symbol} vs ${referenceSymbol}`,
        trade_date: s.trade_date,
        spread_pct: s.spread_pct,
        spread_abs: s.spread_abs || (s.spread_pct / 100) * 7200,
        days_to_expiry: s.days_to_expiry,
        z_score: s.z_score,
        confidence: s.confidence,
        is_thin_liquidity: s.is_thin_liquidity || false,
        cost_bps: 12,
      });

      return {
        ...s,
        decomp,
        state: decomp.signal_state,
        reason: decomp.no_signal_reason,
      };
    });
  }, [rawSignals, referenceSymbol]);

  const filteredSignals = useMemo(() => {
    if (filterState === "ALL") return enrichedSignals;
    return enrichedSignals.filter((s) => s.state.toUpperCase() === filterState);
  }, [enrichedSignals, filterState]);

  const activeCount = enrichedSignals.filter((s) => s.state === "signal").length;
  const watchCount = enrichedSignals.filter((s) => s.state === "watch").length;
  const quietCount = enrichedSignals.filter((s) => s.state === "no_signal").length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Filtering Bar */}
      <div className="surface-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F7A4D]/10 text-[#1F7A4D] dark:text-[#2EAA6E] text-[11px] font-black uppercase tracking-wider">
                Execution Discipline
              </span>
              <span className="text-xs text-stone-400 font-mono">
                XGBoost Probability Gated
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-display mt-1">
              Cross-Contract Market Signals
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
              We treat <strong className="text-stone-900 dark:text-white">"No Signal"</strong> as a first-class, intentional state.
              The model explicitly defends capital by refusing to trade when edge is devoured by costs or when thin liquidity inflates execution risk.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
            <button
              onClick={() => setFilterState("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterState === "ALL"
                  ? "bg-white dark:bg-[#0E1B2E] text-stone-900 dark:text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              All ({enrichedSignals.length})
            </button>
            <button
              onClick={() => setFilterState("SIGNAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterState === "SIGNAL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
              }`}
            >
              Signal ({activeCount})
            </button>
            <button
              onClick={() => setFilterState("WATCH")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterState === "WATCH"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-amber-700 dark:text-amber-400 hover:text-amber-900"
              }`}
            >
              Watch ({watchCount})
            </button>
            <button
              onClick={() => setFilterState("NO_SIGNAL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterState === "NO_SIGNAL"
                  ? "bg-stone-700 text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Quiet ({quietCount})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Signals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSignals.map((item, idx) => {
          const isSignal = item.state === "signal";
          const isWatch = item.state === "watch";
          const isQuiet = item.state === "no_signal";

          return (
            <div
              key={idx}
              className={`surface-card p-5 flex flex-col justify-between transition-all border ${
                isSignal
                  ? "border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/10"
                  : isWatch
                  ? "border-amber-300 dark:border-amber-800"
                  : "border-stone-200 dark:border-stone-800"
              }`}
            >
              <div>
                {/* Card Header: Symbol & State Chip */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold font-mono text-base text-stone-900 dark:text-white">
                        {item.symbol}
                      </h3>
                      <span className="text-xs text-stone-400 font-mono">
                        vs {referenceSymbol}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono">
                      Expiry: {item.expiry_date} ({item.days_to_expiry}d left)
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isSignal
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                        : isWatch
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {isSignal
                      ? "ACTIONABLE SIGNAL"
                      : isWatch
                      ? "WATCHLIST"
                      : "NO SIGNAL (QUIET)"}
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-stone-50/60 dark:bg-[#132238]/60 border border-stone-100 dark:border-stone-800 text-xs mb-3">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-bold">
                      Raw Spread
                    </span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      {formatPct(item.decomp.raw_spread_pct)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-bold">
                      Fundamental Residual
                    </span>
                    <span className="font-mono font-bold text-[#C8963E]">
                      {formatBps(item.decomp.residual_pct)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-bold">
                      Net Edge (-12 bps)
                    </span>
                    <span
                      className={`font-mono font-black ${
                        item.decomp.net_edge_pct > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-stone-400"
                      }`}
                    >
                      {formatBps(item.decomp.net_edge_pct)}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase block font-bold">
                      Statistical Z-Score
                    </span>
                    <span className="font-mono font-bold text-stone-800 dark:text-stone-200">
                      {formatZScore(item.decomp.z_score)}
                    </span>
                  </div>
                </div>

                {/* Confidence Bar & Gauge */}
                <div className="mb-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-stone-500 font-medium">ML Reversion Confidence:</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-white">
                      {(item.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.confidence >= 0.65
                          ? "bg-emerald-500"
                          : item.confidence >= 0.50
                          ? "bg-amber-500"
                          : "bg-stone-400"
                      }`}
                      style={{ width: `${Math.min(100, item.confidence * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Reason Banner / Liquidity Warning */}
                {item.reason && (
                  <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-[11px] text-stone-600 dark:text-stone-300 space-y-1 mb-3">
                    <span className="font-bold flex items-center space-x-1 text-stone-700 dark:text-stone-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C8963E]" />
                      <span>Capital Protection Defense:</span>
                    </span>
                    <p className="leading-snug">{item.reason}</p>
                  </div>
                )}
              </div>

              {/* Card Action Button */}
              <button
                onClick={() => onSelectSignal(item)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  isSignal
                    ? "bg-[#C8963E] hover:bg-[#B5822F] text-white shadow-xs"
                    : "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-200"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C8963E]" />
                <span>Explain Decision (Claude AI)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
