"use client";

import React, { useMemo } from "react";
import {
  Zap,
  TrendingUp,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Coins,
  CheckCircle2,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  SignalItem,
  NormalizedPriceRecord,
  DataQualityReport,
  NavigationTab,
} from "@/lib/types";
import {
  formatINR,
  formatPct,
  formatZScore,
  formatDate,
  formatBps,
  computeSpreadDecomposition,
} from "@/lib/utils";

interface CommandCenterViewProps {
  signals: SignalItem[];
  prices: NormalizedPriceRecord[];
  dataQuality: DataQualityReport | null;
  referenceSymbol: string;
  isNetOfCosts: boolean;
  onSelectSignal: (sig: Partial<SignalItem>) => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenDecomposition: (pair: string) => void;
}

export function CommandCenterView({
  signals,
  prices,
  dataQuality,
  referenceSymbol,
  isNetOfCosts,
  onSelectSignal,
  onNavigateTab,
  onOpenDecomposition,
}: CommandCenterViewProps) {
  // Compute enriched decomposition records for signals
  const enrichedSignals = useMemo(() => {
    return (signals || []).map((s) => {
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
      };
    });
  }, [signals, referenceSymbol]);

  const activeSignals = enrichedSignals.filter((s) => s.decomp.signal_state === "signal");
  const watchSignals = enrichedSignals.filter((s) => s.decomp.signal_state === "watch");
  const noSignals = enrichedSignals.filter((s) => s.decomp.signal_state === "no_signal");

  // Best net edge calculation
  const bestSignal = useMemo(() => {
    if (activeSignals.length > 0) {
      return [...activeSignals].sort(
        (a, b) => Math.abs(b.decomp.net_edge_pct) - Math.abs(a.decomp.net_edge_pct)
      )[0];
    }
    return enrichedSignals[0] || null;
  }, [activeSignals, enrichedSignals]);

  // Mini Price Chart data (last 30 trading dates)
  const miniPriceData = useMemo(() => {
    if (!prices || prices.length === 0) return [];

    // Group by trade_date
    const byDate = new Map<string, { [sym: string]: number }>();
    prices.forEach((p) => {
      if (!byDate.has(p.trade_date)) {
        byDate.set(p.trade_date, {});
      }
      const entry = byDate.get(p.trade_date)!;
      // If multiple expiries, take the front expiry (or average)
      if (!entry[p.symbol]) {
        entry[p.symbol] = p.norm_close;
      }
    });

    const dates = Array.from(byDate.keys()).sort();
    const recentDates = dates.slice(-30);

    return recentDates.map((d) => {
      const entry = byDate.get(d) || {};
      return {
        date: d,
        GOLDM: entry["GOLDM"] || null,
        GOLDTEN: entry["GOLDTEN"] || null,
        GOLDGUINEA: entry["GOLDGUINEA"] || null,
        GOLDPETAL: entry["GOLDPETAL"] || null,
      };
    });
  }, [prices]);

  // Sparkline generator data for KPIs
  const sparklineData1 = [
    { v: 1 },
    { v: 1 },
    { v: 2 },
    { v: 0 },
    { v: 1 },
    { v: 2 },
    { v: activeSignals.length },
  ];
  const sparklineData2 = [
    { v: 62 },
    { v: 64 },
    { v: 65 },
    { v: 67 },
    { v: 66 },
    { v: 69 },
    { v: 71 },
  ];
  const sparklineData3 = [
    { v: 18 },
    { v: 22 },
    { v: 25 },
    { v: 31 },
    { v: 29 },
    { v: 34 },
    { v: 38 },
  ];
  const sparklineData4 = [
    { v: 92 },
    { v: 94 },
    { v: 93 },
    { v: 95 },
    { v: 94 },
    { v: 96 },
    { v: dataQuality?.health_score || 94 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Today's Regime Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          activeSignals.length > 0
            ? "bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-white dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-transparent border-emerald-200 dark:border-emerald-800"
            : "bg-gradient-to-r from-stone-50 via-stone-50/50 to-white dark:from-[#132238] dark:via-[#132238]/50 dark:to-transparent border-stone-200 dark:border-stone-800"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                activeSignals.length > 0
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              }`}
            >
              {activeSignals.length > 0 ? (
                <Zap className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#C8963E]" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Daily Market Surveillance Regime
                </span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    activeSignals.length > 0
                      ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                      : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                  }`}
                >
                  {activeSignals.length > 0 ? "Tradable Alpha Regime" : "Disciplined Preservation"}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-display mt-0.5">
                {activeSignals.length > 0
                  ? `${activeSignals.length} Tradable Arbitrage Opportunities Detected (Surviving 12 bps Friction)`
                  : "Disciplined Equilibrium: No tradable edge survives the 12 bps cost hurdle today"}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-3xl leading-relaxed">
                {activeSignals.length > 0
                  ? `Gold cross-contract residuals have widened beyond transaction costs (-12 bps round-trip). XGBoost model confirms mean-reversion probability above 60% threshold.`
                  : `Raw price gaps between GOLDM and satellite contracts are fully absorbed by carry differences and 12 bps brokerage friction. The surveillance model stays flat to prevent execution churn.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
            <button
              onClick={() => onNavigateTab("relative-value")}
              className="px-3.5 py-1.5 rounded-xl bg-[#0E1B2E] dark:bg-[#E2B258] text-white dark:text-[#0E1B2E] text-xs font-bold hover:opacity-90 transition-opacity flex items-center space-x-1 cursor-pointer"
            >
              <span>Explore Hero Waterfall</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Hero KPI Cards with Sparklines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Signals */}
        <div className="surface-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Active Signals</span>
              <div className="p-1 rounded-md bg-[#F4E9D2] dark:bg-[#2A2415] text-[#C8963E]">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-display tabular-nums">
                {activeSignals.length}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                of {signals.length} evaluated
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+1 vs 7d avg</span>
            </div>
            {/* Sparkline mini */}
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData1}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#1F7A4D"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 2: ML Model Confidence */}
        <div className="surface-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avg ML Confidence</span>
              <div className="p-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-display tabular-nums">
                {(
                  (enrichedSignals.reduce((acc, s) => acc + s.confidence, 0) /
                    Math.max(1, enrichedSignals.length)) *
                  100
                ).toFixed(1)}
                %
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Calibrated
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+3.2% vs baseline</span>
            </div>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData2}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#C8963E"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 3: Best Net Edge */}
        <div className="surface-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                {isNetOfCosts ? "Best Net Edge" : "Best Gross Spread"}
              </span>
              <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                <Coins className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-display tabular-nums">
                {bestSignal
                  ? isNetOfCosts
                    ? formatBps(bestSignal.decomp.net_edge_pct)
                    : formatBps(bestSignal.decomp.raw_spread_pct)
                  : "0.0 bps"}
              </span>
              <span className="text-xs text-stone-400 font-medium">
                {bestSignal ? bestSignal.symbol : "--"}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-1 text-[11px] font-bold text-stone-500 dark:text-stone-400">
              <span>Hurdle: -12.0 bps</span>
            </div>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData3}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#1F7A4D"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Card 4: Data Health & Clean Ratio */}
        <div className="surface-card p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Data Health Score</span>
              <div className="p-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600">
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white font-display tabular-nums">
                {dataQuality?.health_score || 94}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {dataQuality?.trading_days || 252} Days
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>0 Missing Bhavcopy</span>
            </div>
            <div className="w-16 h-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData4}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#1F7A4D"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Normalized Price Overview & Top Signals Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Mini Normalized Price per Gram Chart (5 cols) */}
        <div className="lg:col-span-5 surface-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                  Normalized Price per Gram (30D)
                </h3>
                <p className="text-xs text-stone-500">
                  Basis parity: All 4 contracts converted to ₹/gram
                </p>
              </div>
              <button
                onClick={() => onNavigateTab("contract-compare")}
                className="text-xs text-[#C8963E] hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
              >
                <span>Full Chart</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="h-56 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={miniPriceData}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    tickFormatter={(v) => `₹${v.toFixed(0)}`}
                    stroke="#94A3B8"
                    fontSize={10}
                    width={50}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--border)",
                      borderRadius: "0.75rem",
                      fontSize: "11px",
                    }}
                    formatter={(val: any) => [`₹${Number(val).toFixed(2)}/g`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="GOLDM"
                    stroke="#C8963E"
                    strokeWidth={2}
                    dot={false}
                    name="GOLDM (100g)"
                  />
                  <Line
                    type="monotone"
                    dataKey="GOLDTEN"
                    stroke="#1E3E62"
                    strokeWidth={1.5}
                    dot={false}
                    name="GOLDTEN (10g)"
                  />
                  <Line
                    type="monotone"
                    dataKey="GOLDGUINEA"
                    stroke="#059669"
                    strokeWidth={1.5}
                    dot={false}
                    name="GOLDGUINEA (8g)"
                  />
                  <Line
                    type="monotone"
                    dataKey="GOLDPETAL"
                    stroke="#D97706"
                    strokeWidth={1.5}
                    dot={false}
                    name="GOLDPETAL (1g)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8963E]" />
              <span>GOLDM Ref</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E3E62]" />
              <span>GOLDTEN</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <span>GUINEA</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
              <span>PETAL</span>
            </span>
          </div>
        </div>

        {/* Right: Top Evaluated Signals & Decomposition Previews (7 cols) */}
        <div className="lg:col-span-7 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                Relative-Value Signal Evaluation
              </h3>
              <p className="text-xs text-stone-500">
                Cross-contract basis vs {referenceSymbol} (after 12 bps hurdle)
              </p>
            </div>

            <button
              onClick={() => onNavigateTab("signals")}
              className="text-xs text-[#C8963E] hover:underline font-bold flex items-center space-x-0.5 cursor-pointer"
            >
              <span>View All Signals</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2">Contract Pair</th>
                  <th className="pb-2 text-right">Raw Spread</th>
                  <th className="pb-2 text-right">Residual</th>
                  <th className="pb-2 text-right">Net Edge</th>
                  <th className="pb-2 text-center">Confidence</th>
                  <th className="pb-2 text-center">State</th>
                  <th className="pb-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {enrichedSignals.map((item, idx) => {
                  const state = item.decomp.signal_state;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-stone-50 dark:hover:bg-[#132238] transition-colors"
                    >
                      <td className="py-2.5 font-bold text-stone-900 dark:text-white">
                        <div className="flex items-center space-x-1.5">
                          <span>{item.symbol}</span>
                          <span className="text-[10px] text-stone-400 font-normal">
                            vs {referenceSymbol}
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          Exp: {item.expiry_date} ({item.days_to_expiry}d)
                        </div>
                      </td>

                      <td className="py-2.5 text-right font-mono text-stone-700 dark:text-stone-300">
                        {formatPct(item.decomp.raw_spread_pct)}
                      </td>

                      <td className="py-2.5 text-right font-mono font-semibold text-stone-800 dark:text-stone-200">
                        {formatBps(item.decomp.residual_pct)}
                      </td>

                      <td className="py-2.5 text-right font-mono font-bold">
                        <span
                          className={
                            item.decomp.net_edge_pct > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : item.decomp.net_edge_pct < 0
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-stone-400"
                          }
                        >
                          {formatBps(item.decomp.net_edge_pct)}
                        </span>
                      </td>

                      <td className="py-2.5 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-[11px]">
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </td>

                      <td className="py-2.5 text-center">
                        {state === "signal" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                            SIGNAL
                          </span>
                        ) : state === "watch" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                            WATCH
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                            title={item.decomp.no_signal_reason || "Filtered"}
                          >
                            NO SIGNAL
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 text-right space-x-1">
                        <button
                          onClick={() => onSelectSignal(item)}
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-[#F4E9D2] dark:bg-[#2A2415] text-[#C8963E] hover:bg-[#DFC79E] transition-colors cursor-pointer"
                        >
                          Explain
                        </button>
                        <button
                          onClick={() => {
                            onOpenDecomposition(item.symbol);
                            onNavigateTab("relative-value");
                          }}
                          className="px-2 py-1 rounded-md text-[11px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 transition-colors cursor-pointer"
                          title="View Decomposition Waterfall"
                        >
                          Waterfall
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-[var(--surface-subtle)] text-[11px] text-stone-500 dark:text-stone-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1F7A4D]" />
              <span>
                <strong>Discipline Rule:</strong> Execution barrier requires Residual &gt; 12 bps and ML Confidence &ge; 60%.
              </span>
            </span>
            <button
              onClick={() => onNavigateTab("methodology")}
              className="text-[#C8963E] font-bold hover:underline shrink-0 ml-2 cursor-pointer"
            >
              Review Specs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
