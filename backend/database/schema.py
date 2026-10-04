"""
SQLAlchemy Schema Models for Commodity Derivatives Intelligence.
8 Tables:
1. contracts_spec
2. bhavcopy_raw
3. bhavcopy_clean
4. normalized_prices
5. spreads
6. signals
7. backtest_runs
8. backtest_trades
"""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime,
    ForeignKey, UniqueConstraint, Index, Text
)
from backend.database.connection import Base


class ContractSpec(Base):
    """Static metadata and quotation definitions per MCX symbol."""
    __tablename__ = "contracts_spec"

    symbol = Column(String(20), primary_key=True)
    name = Column(String(100), nullable=False)
    contract_size_g = Column(Float, nullable=False)  # Lot size in grams
    quotation_base_g = Column(Float, nullable=False)  # Quoted grams denominator
    purity = Column(Float, nullable=False, default=0.995)
    tick_size = Column(Float, nullable=False, default=1.0)
    trading_unit = Column(String(50), nullable=True)
    quote_unit = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "name": self.name,
            "contract_size_g": self.contract_size_g,
            "quotation_base_g": self.quotation_base_g,
            "purity": self.purity,
            "tick_size": self.tick_size,
            "trading_unit": self.trading_unit,
            "quote_unit": self.quote_unit,
            "description": self.description
        }


class BhavcopyRaw(Base):
    """Raw settlement data ingested verbatim from MCX Bhavcopy CSVs."""
    __tablename__ = "bhavcopy_raw"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    trade_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    open_price = Column(Float, nullable=True)
    high_price = Column(Float, nullable=True)
    low_price = Column(Float, nullable=True)
    close_price = Column(Float, nullable=False)
    volume = Column(Float, nullable=False, default=0.0)
    open_interest = Column(Float, nullable=False, default=0.0)
    source_file = Column(String(255), nullable=True)
    ingested_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_raw_sym_dates", "symbol", "trade_date", "expiry_date"),
    )


class BhavcopyClean(Base):
    """Cleansed, deduplicated, type-cast settlement data with liquidity tags."""
    __tablename__ = "bhavcopy_clean"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    trade_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    volume = Column(Float, nullable=False, default=0.0)
    open_interest = Column(Float, nullable=False, default=0.0)
    is_thin_liquidity = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("symbol", "trade_date", "expiry_date", name="uq_clean_contract_date"),
        Index("idx_clean_sym_date", "symbol", "trade_date"),
        Index("idx_clean_trade_expiry", "trade_date", "expiry_date"),
    )

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "trade_date": self.trade_date.isoformat() if isinstance(self.trade_date, (date, datetime)) else str(self.trade_date),
            "expiry_date": self.expiry_date.isoformat() if isinstance(self.expiry_date, (date, datetime)) else str(self.expiry_date),
            "open": self.open_price,
            "high": self.high_price,
            "low": self.low_price,
            "close": self.close_price,
            "volume": self.volume,
            "open_interest": self.open_interest,
            "is_thin_liquidity": self.is_thin_liquidity,
        }


class NormalizedPrice(Base):
    """Prices normalized to INR per gram (1.0g basis) across all contracts."""
    __tablename__ = "normalized_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    trade_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    norm_open = Column(Float, nullable=False)
    norm_high = Column(Float, nullable=False)
    norm_low = Column(Float, nullable=False)
    norm_close = Column(Float, nullable=False)
    volume_grams = Column(Float, nullable=False)
    open_interest_grams = Column(Float, nullable=False)
    is_thin_liquidity = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("symbol", "trade_date", "expiry_date", name="uq_norm_contract_date"),
        Index("idx_norm_sym_date", "symbol", "trade_date"),
        Index("idx_norm_trade_expiry", "trade_date", "expiry_date"),
    )

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "trade_date": self.trade_date.isoformat() if isinstance(self.trade_date, (date, datetime)) else str(self.trade_date),
            "expiry_date": self.expiry_date.isoformat() if isinstance(self.expiry_date, (date, datetime)) else str(self.expiry_date),
            "norm_open": round(self.norm_open, 2),
            "norm_high": round(self.norm_high, 2),
            "norm_low": round(self.norm_low, 2),
            "norm_close": round(self.norm_close, 2),
            "volume_grams": round(self.volume_grams, 1),
            "open_interest_grams": round(self.open_interest_grams, 1),
            "is_thin_liquidity": self.is_thin_liquidity,
        }


class Spread(Base):
    """Cross-contract relative-value spreads vs benchmark (GOLDM) on matching expiry."""
    __tablename__ = "spreads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    benchmark_symbol = Column(String(20), nullable=False, default="GOLDM")
    trade_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    spread_abs = Column(Float, nullable=False)  # Symbol price/g - Benchmark price/g
    spread_pct = Column(Float, nullable=False)  # (Spread_abs / Benchmark price/g) * 100
    z_score_30d = Column(Float, nullable=True)  # Rolling 30d z-score
    spread_ma_30d = Column(Float, nullable=True)
    spread_std_30d = Column(Float, nullable=True)
    days_to_expiry = Column(Integer, nullable=False)
    is_thin_liquidity = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("symbol", "benchmark_symbol", "trade_date", "expiry_date", name="uq_spread_entry"),
        Index("idx_spread_sym_date", "symbol", "trade_date"),
        Index("idx_spread_trade_expiry", "trade_date", "expiry_date"),
    )

    def to_dict(self):
        return {
            "symbol": self.symbol,
            "benchmark_symbol": self.benchmark_symbol,
            "trade_date": self.trade_date.isoformat() if isinstance(self.trade_date, (date, datetime)) else str(self.trade_date),
            "expiry_date": self.expiry_date.isoformat() if isinstance(self.expiry_date, (date, datetime)) else str(self.expiry_date),
            "spread_abs": round(self.spread_abs, 3),
            "spread_pct": round(self.spread_pct, 4),
            "z_score_30d": round(self.z_score_30d, 2) if self.z_score_30d is not None else None,
            "spread_ma_30d": round(self.spread_ma_30d, 3) if self.spread_ma_30d is not None else None,
            "spread_std_30d": round(self.spread_std_30d, 3) if self.spread_std_30d is not None else None,
            "days_to_expiry": self.days_to_expiry,
            "is_thin_liquidity": self.is_thin_liquidity,
        }


class Signal(Base):
    """Daily ML-evaluated signals with confidence and signal discipline reason."""
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trade_date = Column(Date, nullable=False)
    symbol = Column(String(20), nullable=False)
    expiry_date = Column(Date, nullable=False)
    signal_type = Column(String(30), nullable=False)  # BUY_SPREAD, SELL_SPREAD, NO_SIGNAL
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0 calibrated probability
    z_score = Column(Float, nullable=False)
    spread_pct = Column(Float, nullable=False)
    regime = Column(String(50), nullable=True)  # MEAN_REVERTING, DISLOCATED, THIN_LIQUIDITY, ROLL_WINDOW
    stay_quiet_reason = Column(String(255), nullable=True)  # Rationale if NO_SIGNAL
    days_to_expiry = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_signal_date", "trade_date"),
        Index("idx_signal_active", "is_active"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "trade_date": self.trade_date.isoformat() if isinstance(self.trade_date, (date, datetime)) else str(self.trade_date),
            "symbol": self.symbol,
            "expiry_date": self.expiry_date.isoformat() if isinstance(self.expiry_date, (date, datetime)) else str(self.expiry_date),
            "signal_type": self.signal_type,
            "confidence": round(self.confidence, 3),
            "z_score": round(self.z_score, 2),
            "spread_pct": round(self.spread_pct, 4),
            "regime": self.regime,
            "stay_quiet_reason": self.stay_quiet_reason,
            "days_to_expiry": self.days_to_expiry,
            "is_active": self.is_active,
        }


class BacktestRun(Base):
    """Walk-forward backtest summary metrics."""
    __tablename__ = "backtest_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_name = Column(String(100), nullable=False)
    model_name = Column(String(50), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    train_window_days = Column(Integer, nullable=False)
    test_window_days = Column(Integer, nullable=False)
    total_trades = Column(Integer, nullable=False)
    winning_trades = Column(Integer, nullable=False)
    win_rate = Column(Float, nullable=False)
    total_return_pct = Column(Float, nullable=False)
    sharpe_ratio = Column(Float, nullable=False)
    max_drawdown_pct = Column(Float, nullable=False)
    cost_bps = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "run_name": self.run_name,
            "model_name": self.model_name,
            "start_date": self.start_date.isoformat() if isinstance(self.start_date, (date, datetime)) else str(self.start_date),
            "end_date": self.end_date.isoformat() if isinstance(self.end_date, (date, datetime)) else str(self.end_date),
            "train_window_days": self.train_window_days,
            "test_window_days": self.test_window_days,
            "total_trades": self.total_trades,
            "winning_trades": self.winning_trades,
            "win_rate": round(self.win_rate, 4),
            "total_return_pct": round(self.total_return_pct, 2),
            "sharpe_ratio": round(self.sharpe_ratio, 2),
            "max_drawdown_pct": round(self.max_drawdown_pct, 2),
            "cost_bps": self.cost_bps,
        }


class BacktestTrade(Base):
    """Individual out-of-sample simulated trades."""
    __tablename__ = "backtest_trades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(Integer, ForeignKey("backtest_runs.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    expiry_date = Column(Date, nullable=False)
    entry_date = Column(Date, nullable=False)
    exit_date = Column(Date, nullable=False)
    direction = Column(String(10), nullable=False)  # LONG_SPREAD, SHORT_SPREAD
    entry_spread = Column(Float, nullable=False)
    exit_spread = Column(Float, nullable=False)
    entry_gold_price = Column(Float, nullable=False)
    exit_gold_price = Column(Float, nullable=False)
    gross_pnl = Column(Float, nullable=False)
    fees = Column(Float, nullable=False)
    net_pnl = Column(Float, nullable=False)
    return_pct = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    exit_reason = Column(String(50), nullable=False)  # REVERSION, STOP_LOSS, EXPIRY_ROLL
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "symbol": self.symbol,
            "expiry_date": self.expiry_date.isoformat() if isinstance(self.expiry_date, (date, datetime)) else str(self.expiry_date),
            "entry_date": self.entry_date.isoformat() if isinstance(self.entry_date, (date, datetime)) else str(self.entry_date),
            "exit_date": self.exit_date.isoformat() if isinstance(self.exit_date, (date, datetime)) else str(self.exit_date),
            "direction": self.direction,
            "entry_spread": round(self.entry_spread, 3),
            "exit_spread": round(self.exit_spread, 3),
            "gross_pnl": round(self.gross_pnl, 2),
            "fees": round(self.fees, 2),
            "net_pnl": round(self.net_pnl, 2),
            "return_pct": round(self.return_pct, 4),
            "duration_days": self.duration_days,
            "exit_reason": self.exit_reason
        }
