/**
 * Utility and Formatting Functions for Fintech Visualizations.
 *
 * Implements the core mathematical decomposition:
 * raw spread -> carry adjustment -> noise -> residual -> costs (12 bps) -> net edge.
 */

import { SpreadDecomposition, SignalState } from "./types";

export function formatINR(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(val);
}

export function formatPct(val: number, decimals: number = 2): string {
  if (val === undefined || val === null || isNaN(val)) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(decimals)}%`;
}

export function formatBps(valPct: number): string {
  if (valPct === undefined || valPct === null || isNaN(valPct)) return "0.0 bps";
  const bps = valPct * 100;
  const sign = bps > 0 ? "+" : "";
  return `${sign}${bps.toFixed(1)} bps`;
}

export function formatZScore(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0.00σ";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}σ`;
}

export function formatDate(dateStr: string | number | undefined | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return String(dateStr);
  }
}

export function formatCompactNumber(val: number): string {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(1) + "k";
  return val.toFixed(0);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Decomposes a per-gram relative value record into the 5-stage institutional waterfall:
 * 1. Raw Spread
 * 2. Expiry / Carry Adjustment (pro-rated net cost of carry ~6.5% p.a.)
 * 3. Tick & Liquidity Noise
 * 4. Fundamental Residual
 * 5. Transaction Costs (configurable, default 12 bps round-trip)
 * 6. Net Edge after Costs
 */
export function computeSpreadDecomposition(params: {
  pair: string;
  trade_date: string;
  spread_pct: number;
  spread_abs: number;
  days_to_expiry: number;
  z_score: number;
  confidence: number;
  is_thin_liquidity: boolean;
  cost_bps?: number;
}): SpreadDecomposition {
  const {
    pair,
    trade_date,
    spread_pct,
    spread_abs,
    days_to_expiry,
    z_score,
    confidence,
    is_thin_liquidity,
    cost_bps = 12,
  } = params;

  // 1. Carry adjustment: difference in delivery timeline pro-rated
  // MCX gold risk-free rate ~6.5% - convenience yield ~0.5% => ~6.0% net carry
  // If calendar or expiry offset applies, carry = 6.0% * (days_offset / 365)
  // For cross-contract with same expiry date, carry effect is 0, but if offset exists:
  const isOffsetExpiry = pair.includes("GOLDPETAL") || pair.includes("GOLDGUINEA");
  const estimatedOffsetDays = isOffsetExpiry ? 20 : 0; // 5th vs Month-end offset
  const carryAdjustmentPct = isOffsetExpiry ? Number(((0.06 * estimatedOffsetDays) / 365 * 100).toFixed(4)) : 0.02;
  const carryAdjINR = (carryAdjustmentPct / 100) * 7200;

  // 2. Carry-adjusted spread
  const carryAdjustedPct = spread_pct - carryAdjustmentPct;

  // 3. Tick & Microstructure Noise (minimum tick size ~₹1 on quote base converted to % basis)
  const tickNoisePct = Number((0.015 * (is_thin_liquidity ? 2.5 : 1.0)).toFixed(4));

  // 4. Fundamental Residual
  const sign = Math.sign(carryAdjustedPct) || 1;
  const residualPct = sign * Math.max(0, Math.abs(carryAdjustedPct) - tickNoisePct);
  const residualINR = (residualPct / 100) * 7200;

  // 5. Transaction Cost Hurdle (12 bps round-trip = 0.12%)
  const costPct = cost_bps / 100; // e.g. 0.12%
  const costINR = (costPct / 100) * 7200;

  // 6. Net Tradable Edge
  const netEdgePct = Math.max(0, Math.abs(residualPct) - costPct) * (residualPct >= 0 ? 1 : -1);
  const netEdgeINR = (netEdgePct / 100) * 7200;

  // Signal State & Reason Determination
  let signalState: SignalState = "no_signal";
  let noSignalReason: string | null = null;

  if (days_to_expiry <= 5) {
    signalState = "no_signal";
    noSignalReason = "Expiry Tender Period (<5 days to expiry). Physical delivery risk excludes cash arbitrage.";
  } else if (is_thin_liquidity) {
    signalState = "no_signal";
    noSignalReason = "Thin Liquidity Filter: Daily Volume/OI below institutional execution threshold.";
  } else if (Math.abs(residualPct) <= costPct) {
    signalState = "no_signal";
    noSignalReason = `Residual edge (${Math.abs(residualPct).toFixed(2)}%) is consumed by round-trip transaction costs (${costPct.toFixed(2)}% / ${cost_bps} bps).`;
  } else if (confidence < 0.60) {
    signalState = "watch";
    noSignalReason = `Gross edge exists (+${Math.abs(netEdgePct).toFixed(2)}%), but ML reversion confidence (${(confidence * 100).toFixed(0)}%) is below the 60% execution gate.`;
  } else if (Math.abs(z_score) < 1.5) {
    signalState = "watch";
    noSignalReason = `Spread z-score (${Math.abs(z_score).toFixed(2)}σ) is within the normal statistical boundary (<1.50σ).`;
  } else {
    signalState = "signal";
    noSignalReason = null;
  }

  return {
    pair,
    trade_date,
    raw_spread_pct: spread_pct,
    raw_spread_inr_g: spread_abs,
    carry_adjustment_pct: carryAdjustmentPct,
    carry_adjustment_inr_g: carryAdjINR,
    carry_adjusted_spread_pct: carryAdjustedPct,
    tick_noise_pct: tickNoisePct,
    residual_pct: residualPct,
    residual_inr_g: residualINR,
    cost_bps,
    cost_pct: costPct,
    net_edge_pct: netEdgePct,
    net_edge_inr_g: netEdgeINR,
    signal_state: signalState,
    no_signal_reason: noSignalReason,
    confidence,
    z_score,
    is_thin_liquidity,
    days_to_expiry,
  };
}
