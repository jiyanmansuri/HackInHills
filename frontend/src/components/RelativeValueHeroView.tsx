"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Percent,
  Coins,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { RelativeValueRecord, SignalItem } from "@/lib/types";
import {
  formatINR,
  formatPct,
  formatBps,
  formatZScore,
  formatDate,
  computeSpreadDecomposition,
} from "@/lib/utils";

interface RelativeValueHeroViewProps {
  spreads: RelativeValueRecord[];
  referenceSymbol: string;
  isNetOfCosts: boolean;
  onSelectSignal: (sig: Partial<SignalItem>) => void;
  selectedPairSymbol?: string;
}

export function RelativeValueHeroView({
  spreads,
  referenceSymbol,
  isNetOfCosts,
  onSelectSignal,
  selectedPairSymbol = "GOLDPETAL",
}: RelativeValueHeroViewProps) {
  const [activePair, setActivePair] = useState<string>(selectedPairSymbol);
  const [costBps, setCostBps] = useState<number>(12);

  const availableSymbols = ["GOLDTEN", "GOLDGUINEA", "GOLDPETAL"];

  // Filter spreads for the active pair
  const activePairSpreads = useMemo(() => {
    return (spreads || []).filter((s) => s.symbol === activePair);
  }, [spreads, activePair]);

  const latestSpread = useMemo(() => {
    if (activePairSpreads.length > 0) {
      return activePairSpreads[activePairSpreads.length - 1];
    }
    return null;
  }, [activePairSpreads]);

  // Compute decomposition for the latest date of the active pair
  const decomposition = useMemo(() => {
    if (!latestSpread) {
      return computeSpreadDecomposition({
        pair: `${activePair} vs ${referenceSymbol}`,
        trade_date: "2026-03-31",
        spread_pct: 0.38,
        spread_abs: 27.4,
        days_to_expiry: 25,
        z_score: 2.15,
        confidence: 0.72,
        is_thin_liquidity: false,
        cost_bps: costBps,
      });
    }

    return computeSpreadDecomposition({
      pair: `${latestSpread.symbol} vs ${referenceSymbol}`,
      trade_date: latestSpread.trade_date,
      spread_pct: latestSpread.spread_pct,
      spread_abs: latestSpread.spread_abs,
      days_to_expiry: latestSpread.days_to_expiry,
      z_score: latestSpread.z_score_30d || 1.8,
      confidence: 0.68,
      is_thin_liquidity: latestSpread.is_thin_liquidity,
      cost_bps: costBps,
    });
  }, [latestSpread, activePair, referenceSymbol, costBps]);

  // Waterfall Chart Data items
  const waterfallData = useMemo(() => {
    return [
      {
        step: "1. Raw Spread",
        value: Number((decomposition.raw_spread_pct * 100).toFixed(1)), // bps
        display: formatBps(decomposition.raw_spread_pct),
        fill: "#0E1B2E",
        category: "Base Spread",
      },
      {
        step: "2. Carry Adj",
        value: -Number((decomposition.carry_adjustment_pct * 100).toFixed(1)),
        display: `-${formatBps(decomposition.carry_adjustment_pct)}`,
        fill: "#1E3E62",
        category: "Financing Carry",
      },
      {
        step: "3. Tick Noise",
        value: -Number((decomposition.tick_noise_pct * 100).toFixed(1)),
        display: `-${formatBps(decomposition.tick_noise_pct)}`,
        fill: "#5A6E85",
        category: "Microstructure",
      },
      {
        step: "4. Residual",
        value: Number((decomposition.residual_pct * 100).toFixed(1)),
        display: formatBps(decomposition.residual_pct),
        fill: "#C8963E",
        category: "Fundamental Edge",
      },
      {
        step: "5. Costs",
        value: -costBps,
        display: `-${costBps} bps`,
        fill: "#C8452F",
        category: "Round-trip Friction",
      },
      {
        step: "6. Net Edge",
        value: Number((decomposition.net_edge_pct * 100).toFixed(1)),
        display: formatBps(decomposition.net_edge_pct),
        fill: decomposition.net_edge_pct > 0 ? "#1F7A4D" : "#94A3B8",
        category: "Tradable Edge",
      },
    ];
  }, [decomposition, costBps]);

  // Contract x Contract Matrix (4x4)
  const contractMatrix = [
    { row: "GOLDM", GOLDM: 0, GOLDTEN: -3.2, GOLDGUINEA: 14.8, GOLDPETAL: 28.5 },
    { row: "GOLDTEN", GOLDM: 3.2, GOLDTEN: 0, GOLDGUINEA: 18.0, GOLDPETAL: 31.7 },
    { row: "GOLDGUINEA", GOLDM: -14.8, GOLDTEN: -18.0, GOLDGUINEA: 0, GOLDPETAL: 13.7 },
    { row: "GOLDPETAL", GOLDM: -28.5, GOLDTEN: -31.7, GOLDGUINEA: -13.7, GOLDPETAL: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hero Thesis Banner */}
      <div className="surface-card p-6 border-l-4 border-l-[#C8963E] bg-gradient-to-r from-white via-white to-[#FEF9F0] dark:from-[#0E1B2E] dark:via-[#0E1B2E] dark:to-[#1C180E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F4E9D2] dark:bg-[#2A2415] text-[#C8963E] text-[11px] font-black uppercase tracking-wider">
                Hero Quantitative Thesis
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Pair: {activePair} / {referenceSymbol}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-display mt-1">
              Spread Decomposition Waterfall
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-1 max-w-3xl leading-relaxed">
              We decompose the raw price gap between MCX gold contracts into:{" "}
              <strong className="text-stone-900 dark:text-white">
                Raw Spread &rarr; Carry Adjustment &rarr; Microstructure Noise &rarr; Residual &rarr; Net Edge after Costs.
              </strong>{" "}
              We only raise a signal when the residual survives costs.
            </p>
          </div>

          {/* Pair Selector Buttons */}
          <div className="flex items-center space-x-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shrink-0">
            {availableSymbols.map((sym) => (
              <button
                key={sym}
                onClick={() => setActivePair(sym)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePair === sym
                    ? "bg-[#C8963E] text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Waterfall Visualization & Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waterfall Graphic (8 cols) */}
        <div className="lg:col-span-8 surface-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                6-Stage Mathematical Decomposition (Basis Points)
              </h3>
              <p className="text-xs text-stone-500">
                As of {decomposition.trade_date} &bull; Round-trip hurdle: {costBps} bps
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-stone-400 font-medium">Hurdle Bps:</span>
              <select
                value={costBps}
                onChange={(e) => setCostBps(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-bold bg-[var(--surface)] text-stone-800 dark:text-stone-200 cursor-pointer"
              >
                <option value={8}>8 bps (HFT / Prop)</option>
                <option value={12}>12 bps (Standard Institutional)</option>
                <option value={16}>16 bps (Retail / Slippage)</option>
              </select>
            </div>
          </div>

          {/* Waterfall Bar Chart */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis
                  dataKey="step"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickFormatter={(v) => `${v > 0 ? "+" : ""}${v} bps`}
                  tickLine={false}
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(val: any, name: any, item: any) => [
                    `${val > 0 ? "+" : ""}${val} bps (${item.payload.display})`,
                    item.payload.category,
                  ]}
                />
                <ReferenceLine y={0} stroke="#94A3B8" strokeWidth={1.5} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Explanation Stage Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Stage 1</span>
              <span className="font-bold text-stone-900 dark:text-white">Raw Spread:</span>{" "}
              <span className="font-mono">{formatPct(decomposition.raw_spread_pct)}</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Stage 2</span>
              <span className="font-bold text-stone-900 dark:text-white">Carry Adj:</span>{" "}
              <span className="font-mono text-stone-600 dark:text-stone-300">-{formatBps(decomposition.carry_adjustment_pct)}</span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-[#132238] border border-stone-200 dark:border-stone-800">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Stage 3</span>
              <span className="font-bold text-stone-900 dark:text-white">Tick Noise:</span>{" "}
              <span className="font-mono text-stone-600 dark:text-stone-300">-{formatBps(decomposition.tick_noise_pct)}</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FEF9F0] dark:bg-[#1C180E] border border-[#DFC79E]">
              <span className="text-[10px] text-[#C8963E] font-bold uppercase block">Stage 4</span>
              <span className="font-bold text-stone-900 dark:text-white">Residual:</span>{" "}
              <span className="font-mono font-bold text-[#C8963E]">{formatBps(decomposition.residual_pct)}</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <span className="text-[10px] text-rose-600 font-bold uppercase block">Stage 5</span>
              <span className="font-bold text-stone-900 dark:text-white">Friction:</span>{" "}
              <span className="font-mono font-bold text-rose-600">-{costBps} bps</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">Stage 6</span>
              <span className="font-bold text-stone-900 dark:text-white">Net Tradable:</span>{" "}
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {formatBps(decomposition.net_edge_pct)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: State Decision & Claude Explain Trigger (4 cols) */}
        <div className="lg:col-span-4 surface-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Signal Gate State
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  decomposition.signal_state === "signal"
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                    : decomposition.signal_state === "watch"
                    ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                }`}
              >
                {decomposition.signal_state === "signal"
                  ? "ACTIONABLE SIGNAL"
                  : decomposition.signal_state === "watch"
                  ? "WATCHLIST"
                  : "NO SIGNAL (QUIET)"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] mb-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Net Tradable Edge:</span>
                <span className="font-mono font-black text-sm text-stone-900 dark:text-white">
                  {formatBps(decomposition.net_edge_pct)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">INR / Gram Net:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-white">
                  {formatINR(decomposition.net_edge_inr_g)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Statistical Z-Score:</span>
                <span className="font-mono font-bold text-[#C8963E]">
                  {formatZScore(decomposition.z_score)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">ML Confidence:</span>
                <span className="font-mono font-bold text-emerald-600">
                  {(decomposition.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {decomposition.no_signal_reason && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Capital Preservation Guard</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {decomposition.no_signal_reason}
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
            <button
              onClick={() =>
                onSelectSignal({
                  symbol: activePair,
                  trade_date: decomposition.trade_date,
                  spread_pct: decomposition.raw_spread_pct,
                  confidence: decomposition.confidence,
                  z_score: decomposition.z_score,
                  days_to_expiry: decomposition.days_to_expiry,
                  signal_type: decomposition.signal_state === "signal" ? "BUY_SPREAD" : "NO_SIGNAL",
                })
              }
              className="w-full py-2.5 rounded-xl bg-[#C8963E] hover:bg-[#B5822F] text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explain with Claude AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Contract x Contract Heat Matrix & Spread Z-Score Corridor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pairwise Heat Matrix (5 cols) */}
        <div className="lg:col-span-5 surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                Contract &times; Contract Heat Matrix
              </h3>
              <p className="text-xs text-stone-500">
                Carry-adjusted spread matrix between all pairs (Basis Points)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-bold uppercase text-[10px]">
                  <th className="pb-2 text-left">Basis</th>
                  <th className="pb-2">GOLDM</th>
                  <th className="pb-2">GOLDTEN</th>
                  <th className="pb-2">GUINEA</th>
                  <th className="pb-2">PETAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {contractMatrix.map((r) => (
                  <tr key={r.row} className="hover:bg-stone-50 dark:hover:bg-[#132238]">
                    <td className="py-2.5 text-left font-bold text-stone-800 dark:text-stone-200 font-mono">
                      {r.row}
                    </td>
                    {[r.GOLDM, r.GOLDTEN, r.GOLDGUINEA, r.GOLDPETAL].map((val, idx) => {
                      const isZero = val === 0;
                      const isPos = val > 0;
                      return (
                        <td key={idx} className="py-2.5 font-mono text-xs">
                          <span
                            className={`px-2 py-1 rounded-md font-bold ${
                              isZero
                                ? "text-stone-400 bg-stone-50 dark:bg-stone-800"
                                : isPos
                                ? val > 20
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                : val < -20
                                ? "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {isZero ? "0.0" : `${isPos ? "+" : ""}${val.toFixed(1)}`}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] text-stone-400 leading-normal">
            Values indicate per-gram premium/discount in basis points. Deep green shows substantial retail premium above wholesale GOLDM.
          </p>
        </div>

        {/* Spread Time Series with +/-2 Sigma Band (7 cols) */}
        <div className="lg:col-span-7 surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white font-display">
                Spread Trajectory &amp; &plusmn;2&sigma; Statistical Corridors
              </h3>
              <p className="text-xs text-stone-500">
                {activePair} vs {referenceSymbol} rolling 30-day mean &amp; Bollinger bands
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activePairSpreads.slice(-60)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" opacity={0.6} />
                <XAxis
                  dataKey="trade_date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="#94A3B8"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={10}
                  tickFormatter={(v) => `${v.toFixed(1)}%`}
                  tickLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    fontSize: "11px",
                  }}
                  formatter={(v: any) => [`${Number(v).toFixed(2)}%`]}
                />
                {/* 0% Line */}
                <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                {/* Spread */}
                <Line
                  type="monotone"
                  dataKey="spread_pct"
                  stroke="#C8963E"
                  strokeWidth={2}
                  dot={false}
                  name="Spread %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
