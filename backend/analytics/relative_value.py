"""
Cross-Contract Relative Value Analytics.
Calculates pairwise spreads, rolling 30-day z-scores, and convergence metrics vs GOLDM.
Commodity Derivatives Intelligence
"""

import logging
from datetime import date
from typing import Optional, List, Dict, Any
import numpy as np
import pandas as pd
from sqlalchemy import func
from backend.config import REFERENCE_SYMBOL, DEFAULT_ZSCORE_WINDOW
from backend.database.connection import get_session
from backend.database.schema import NormalizedPrice, Spread

logger = logging.getLogger(__name__)


def compute_and_store_spreads(window: int = DEFAULT_ZSCORE_WINDOW) -> int:
    """
    Match contracts by exact (trade_date, expiry_date) against GOLDM benchmark,
    calculate absolute/relative spreads and rolling z-scores, and save to spreads table.

    Returns:
        int: Total spread rows generated.
    """
    with get_session() as session:
        query = session.query(
            NormalizedPrice.symbol,
            NormalizedPrice.trade_date,
            NormalizedPrice.expiry_date,
            NormalizedPrice.norm_close,
            NormalizedPrice.volume_grams,
            NormalizedPrice.open_interest_grams,
            NormalizedPrice.is_thin_liquidity
        )
        df = pd.read_sql(query.statement, session.bind)

    if df.empty:
        logger.warning("No normalized prices available to compute spreads.")
        return 0

    # Ensure date objects
    df["trade_date"] = pd.to_datetime(df["trade_date"])
    df["expiry_date"] = pd.to_datetime(df["expiry_date"])

    # Separate reference contract (GOLDM)
    df_ref = df[df["symbol"] == REFERENCE_SYMBOL].copy()
    df_ref = df_ref.rename(columns={
        "norm_close": "ref_close",
        "is_thin_liquidity": "ref_thin"
    })
    df_ref = df_ref[["trade_date", "expiry_date", "ref_close", "ref_thin"]]

    # Pair all non-reference contracts with GOLDM on exact (trade_date, expiry_date)
    df_non_ref = df[df["symbol"] != REFERENCE_SYMBOL].copy()
    merged = pd.merge(
        df_non_ref,
        df_ref,
        on=["trade_date", "expiry_date"],
        how="inner"
    )

    if merged.empty:
        logger.warning("No matched contracts found for the same trade_date and expiry_date.")
        return 0

    # Sort strictly by symbol, expiry_date, trade_date
    merged = merged.sort_values(by=["symbol", "expiry_date", "trade_date"]).reset_index(drop=True)

    # 1. Absolute and Percentage Spreads
    merged["spread_abs"] = merged["norm_close"] - merged["ref_close"]
    merged["spread_pct"] = (merged["spread_abs"] / merged["ref_close"]) * 100.0

    # Days to expiry
    merged["days_to_expiry"] = (merged["expiry_date"] - merged["trade_date"]).dt.days

    # 2. Rolling 30-Day Z-Score per contract series (symbol, expiry_date)
    # Using rolling window with min_periods=5
    merged["spread_ma_30d"] = merged.groupby(["symbol", "expiry_date"])["spread_abs"].transform(
        lambda s: s.rolling(window=window, min_periods=5).mean()
    )
    merged["spread_std_30d"] = merged.groupby(["symbol", "expiry_date"])["spread_abs"].transform(
        lambda s: s.rolling(window=window, min_periods=5).std().fillna(1.0)
    )
    std_safe = merged["spread_std_30d"].replace(0.0, 1.0)
    merged["z_score_30d"] = (merged["spread_abs"] - merged["spread_ma_30d"]) / std_safe

    # Flag thin liquidity if either leg is thin
    merged["is_thin_liquidity"] = merged["is_thin_liquidity"] | merged["ref_thin"]

    # 3. Store to DB
    spread_objects = []
    for _, r in merged.iterrows():
        z_val = float(r["z_score_30d"]) if pd.notna(r["z_score_30d"]) else None
        ma_val = float(r["spread_ma_30d"]) if pd.notna(r["spread_ma_30d"]) else None
        std_val = float(r["spread_std_30d"]) if pd.notna(r["spread_std_30d"]) else None

        spread_objects.append(
            Spread(
                symbol=str(r["symbol"]),
                benchmark_symbol=REFERENCE_SYMBOL,
                trade_date=r["trade_date"].date(),
                expiry_date=r["expiry_date"].date(),
                spread_abs=float(r["spread_abs"]),
                spread_pct=float(r["spread_pct"]),
                z_score_30d=z_val,
                spread_ma_30d=ma_val,
                spread_std_30d=std_val,
                days_to_expiry=int(r["days_to_expiry"]),
                is_thin_liquidity=bool(r["is_thin_liquidity"])
            )
        )

    with get_session() as session:
        session.query(Spread).delete()
        session.bulk_save_objects(spread_objects)
        session.commit()

    logger.info(f"Successfully computed and stored {len(spread_objects)} relative value spread rows.")
    return len(spread_objects)


def get_relative_value_snapshot(target_date: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get the relative-value cross-contract snapshot for the given date (defaults to latest trade date).
    Returns front-month spreads and z-scores for all pairs vs GOLDM.
    """
    with get_session() as session:
        if not target_date:
            latest_date = session.query(func.max(Spread.trade_date)).scalar()
            if not latest_date:
                return []
            target_date = latest_date.isoformat()

        # Fetch all spreads for this target date
        spreads = session.query(Spread).filter(Spread.trade_date == target_date).order_by(
            Spread.symbol.asc(), Spread.days_to_expiry.asc()
        ).all()

        results = []
        for s in spreads:
            z = s.z_score_30d if s.z_score_30d is not None else 0.0

            # Regime identification
            if abs(z) >= 2.0:
                regime = "HIGH_DISLOCATION"
            elif abs(z) >= 1.2:
                regime = "MODERATE_DISLOCATION"
            elif abs(z) <= 0.5:
                regime = "EQUILIBRIUM"
            else:
                regime = "MEAN_REVERTING"

            direction = "UP" if s.spread_pct > 0 else "DOWN" if s.spread_pct < 0 else "FLAT"

            item = s.to_dict()
            item["regime"] = regime
            item["direction"] = direction
            item["opportunity_score"] = min(100.0, round(abs(z) * 35.0, 1))
            results.append(item)

        return results
