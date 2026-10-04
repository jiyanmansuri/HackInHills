/**
 * TypeScript Data Models for Commodity Derivatives Intelligence.
 * Hack in Hills '26 - Team Holyknight
 */

export interface ContractSpec {
  symbol: string;
  name: string;
  contract_size_g: number;
  quotation_base_g: number;
  purity: number;
  tick_size: number;
  trading_unit: string;
  quote_unit: string;
  description: string;
}

export interface NormalizedPriceRecord {
  symbol: string;
  trade_date: string;
  expiry_date: string;
  norm_open: number;
  norm_high: number;
  norm_low: number;
  norm_close: number;
  volume_grams: number;
  open_interest_grams: number;
  is_thin_liquidity: boolean;
}

export interface RelativeValueRecord {
  symbol: string;
  benchmark_symbol: string;
  trade_date: string;
  expiry_date: string;
  spread_abs: number;
  spread_pct: number;
  z_score_30d: number | null;
  spread_ma_30d: number | null;
  spread_std_30d: number | null;
  days_to_expiry: number;
  is_thin_liquidity: boolean;
  regime: "HIGH_DISLOCATION" | "MODERATE_DISLOCATION" | "EQUILIBRIUM" | "MEAN_REVERTING";
  direction: "UP" | "DOWN" | "FLAT";
  opportunity_score: number;
}

export interface SignalItem {
  id?: number;
  trade_date: string;
  symbol: string;
  expiry_date: string;
  signal_type: "BUY_SPREAD" | "SELL_SPREAD" | "NO_SIGNAL";
  confidence: number;
  z_score: number;
  spread_pct: number;
  spread_abs?: number;
  is_thin_liquidity?: boolean;
  regime: string;
  stay_quiet_reason?: string | null;
  days_to_expiry: number;
  is_active: boolean;
}

export interface SignalsResponse {
  signals: SignalItem[];
  has_actionable_signals: boolean;
  discipline_status: "ACTIVE_OPPORTUNITY" | "STAY_QUIET" | "NO_DATA";
  active_count: number;
  total_evaluated: number;
  avg_confidence: number;
  best_opportunity: SignalItem | null;
}

export interface TermStructurePoint {
  expiry_date: string;
  price_per_gram: number;
  calendar_spread_inr: number;
  annualized_carry_pct: number;
  days_to_expiry: number;
  is_roll_window: boolean;
  volume_grams: number;
  oi_grams: number;
  is_thin_liquidity: boolean;
}

export interface TermStructureResponse {
  symbol: string;
  trade_date: string;
  is_contango: boolean;
  curve: TermStructurePoint[];
  comparison_curve: {
    expiry_date: string;
    price_per_gram: number;
    days_to_expiry: number;
  }[];
}

export interface CalendarItem {
  symbol: string;
  contract_name: string;
  trade_date: string;
  expiry_date: string;
  days_to_expiry: number;
  is_roll_window: boolean;
  roll_status: "ROLL_ACTIVE" | "NORMAL";
  price_per_gram: number;
  raw_close: number;
  volume_contracts: number;
  oi_contracts: number;
  volume_grams: number;
  lot_size_g: number;
  is_thin_liquidity: boolean;
}

export interface AttributionPoint {
  date: string;
  cum_total_pnl: number;
  cum_spread_pnl: number;
  cum_gold_drift_pnl: number;
  gold_price: number;
  gold_benchmark_pnl: number;
}

export interface AttributionResponse {
  series: AttributionPoint[];
  summary: {
    total_pnl_inr_g: number;
    spread_capture_share_pct: number;
    gold_drift_share_pct: number;
    beta_to_gold: number;
    is_market_neutral: boolean;
    conclusion: string;
  };
}

export interface EquityPoint {
  date: string;
  strategy_equity: number;
  gold_buy_and_hold: number;
  trade_pnl: number;
  symbol: string;
  direction: string;
}

export interface BacktestSummaryResponse {
  id: number;
  run_name: string;
  model_name: string;
  start_date: string;
  end_date: string;
  train_window_days: number;
  test_window_days: number;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_return_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  cost_bps: number;
  equity_series: EquityPoint[];
}

export interface BacktestTrade {
  id: number;
  run_id: number;
  symbol: string;
  expiry_date: string;
  entry_date: string;
  exit_date: string;
  direction: "LONG_SPREAD" | "SHORT_SPREAD";
  entry_spread: number;
  exit_spread: number;
  gross_pnl: number;
  fees: number;
  net_pnl: number;
  return_pct: number;
  duration_days: number;
  exit_reason: string;
}

export interface SymbolStat {
  records: number;
  avg_volume: number;
  avg_oi: number;
  thin_records: number;
  thin_pct: number;
}

export interface DataQualityReport {
  health_score: number;
  status: "HEALTHY" | "WARNING" | "NO_DATA";
  total_raw_rows: number;
  total_clean_rows: number;
  thin_liquidity_count: number;
  thin_liquidity_pct: number;
  start_date: string;
  end_date: string;
  trading_days: number;
  symbols: Record<string, SymbolStat>;
}

export interface ExplainResponse {
  explanation: string;
  model_used: string;
  is_fallback: boolean;
  error_note?: string;
}
