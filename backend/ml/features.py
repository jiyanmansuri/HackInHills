"""
Quantitative Feature Engineering and Target Generation Pipeline.
Commodity Derivatives Intelligence
"""

import logging
from typing import Tuple, List
import numpy as np
import pandas as pd
from backend.config import REFERENCE_SYMBOL, DEFAULT_REVERSION_DAYS
from backend.database.connection import get_session
from backend.database.schema import Spread, NormalizedPrice

logger = logging.getLogger(__name__)

FEATURE_NAMES = [
    "z_score_30d",
    "abs_z_score",
    "spread_momentum_5d",
    "spread_pct",
    "days_to_expiry",
    "volume_oi_ratio",
    "vol_ratio_to_goldm",
    "recent_volatility_15d",
    "is_thin_liquidity"
]


def build_feature_dataset(include_unlabeled: bool = False) -> pd.DataFrame:
    """
    Construct cross-contract feature matrix and 5-day mean reversion target.
    If include_unlabeled=True, includes trailing unlabelled dates for inference.

    Features:
    - z_score_30d: Rolling 30d standardized basis vs benchmark
    - abs_z_score: Absolute magnitude of dislocation
    - spread_momentum_5d: 5-day change in z-score (exhaustion vs acceleration)
    - spread_pct: Relative percentage spread vs benchmark
    - days_to_expiry: Contract lifecycle maturity
    - volume_oi_ratio: Turnover / liquidity velocity
    - vol_ratio_to_goldm: Relative volume scale compared to reference
    - recent_volatility_15d: Realized basis volatility
    - is_thin_liquidity: Binary indicator for low liquidity

    Target (reversion_target_5d):
    - 1 if spread reverts toward equilibrium by at least 0.25 standard deviations within 5 trading days
    - 0 otherwise
    """
    with get_session() as session:
        # Load spreads
        spread_query = session.query(
            Spread.symbol,
            Spread.trade_date,
            Spread.expiry_date,
            Spread.spread_abs,
            Spread.spread_pct,
            Spread.z_score_30d,
            Spread.spread_ma_30d,
            Spread.spread_std_30d,
            Spread.days_to_expiry,
            Spread.is_thin_liquidity
        ).order_by(Spread.symbol.asc(), Spread.expiry_date.asc(), Spread.trade_date.asc())

        df_spreads = pd.read_sql(spread_query.statement, session.bind)

        # Load normalized prices for volume/OI features
        norm_query = session.query(
            NormalizedPrice.symbol,
            NormalizedPrice.trade_date,
            NormalizedPrice.expiry_date,
            NormalizedPrice.volume_grams,
            NormalizedPrice.open_interest_grams
        )
        df_norm = pd.read_sql(norm_query.statement, session.bind)

    if df_spreads.empty:
        raise ValueError("No spread data found to build features.")

    # Dates to datetime
    df_spreads["trade_date"] = pd.to_datetime(df_spreads["trade_date"])
    df_spreads["expiry_date"] = pd.to_datetime(df_spreads["expiry_date"])
    df_norm["trade_date"] = pd.to_datetime(df_norm["trade_date"])
    df_norm["expiry_date"] = pd.to_datetime(df_norm["expiry_date"])

    # Separate reference contract volume
    ref_norm = df_norm[df_norm["symbol"] == REFERENCE_SYMBOL].copy()
    ref_norm = ref_norm.rename(columns={"volume_grams": "ref_volume_grams"})[["trade_date", "expiry_date", "ref_volume_grams"]]

    # Merge contract volume and reference volume
    merged = pd.merge(df_spreads, df_norm, on=["symbol", "trade_date", "expiry_date"], how="left")
    merged = pd.merge(merged, ref_norm, on=["trade_date", "expiry_date"], how="left")

    # Sort strictly chronologically within each contract series
    merged = merged.sort_values(by=["symbol", "expiry_date", "trade_date"]).reset_index(drop=True)

    # 1. Feature Engineering
    merged["z_score_30d"] = merged["z_score_30d"].fillna(0.0)
    merged["abs_z_score"] = merged["z_score_30d"].abs()

    # 5-day momentum in z-score
    merged["spread_momentum_5d"] = merged.groupby(["symbol", "expiry_date"])["z_score_30d"].diff(5).fillna(0.0)

    # Turnover ratio (Volume / OI)
    oi_safe = merged["open_interest_grams"].replace(0.0, 1.0).fillna(1.0)
    merged["volume_oi_ratio"] = (merged["volume_grams"].fillna(0.0) / oi_safe).clip(0.0, 10.0)

    # Relative volume to benchmark
    ref_vol_safe = merged["ref_volume_grams"].replace(0.0, 1.0).fillna(1.0)
    merged["vol_ratio_to_goldm"] = (merged["volume_grams"].fillna(0.0) / ref_vol_safe).clip(0.0, 5.0)

    # Realized 15-day volatility of spread %
    merged["recent_volatility_15d"] = merged.groupby(["symbol", "expiry_date"])["spread_pct"].transform(
        lambda s: s.rolling(15, min_periods=3).std().fillna(0.1)
    )

    # Convert boolean thin liquidity to integer 0/1
    merged["is_thin_liquidity"] = merged["is_thin_liquidity"].astype(int)

    # 2. Target Generation (5-Day Forward Mean Reversion)
    # Target definition: Does spread revert toward 30d MA within N=5 trading days?
    forward_spread = merged.groupby(["symbol", "expiry_date"])["spread_abs"].shift(-DEFAULT_REVERSION_DAYS)
    merged["future_spread_5d"] = forward_spread

    # Condition for reversion:
    # If Z > 0 (expensive spread): future spread is lower than current spread by at least 0.20 * sigma
    # If Z < 0 (cheap spread): future spread is higher than current spread by at least 0.20 * sigma
    delta_spread = merged["future_spread_5d"] - merged["spread_abs"]
    sigma_threshold = 0.20 * merged["spread_std_30d"].fillna(1.0).replace(0.0, 1.0)

    overpriced_reversion = (merged["z_score_30d"] > 0) & (delta_spread <= -sigma_threshold)
    underpriced_reversion = (merged["z_score_30d"] < 0) & (delta_spread >= sigma_threshold)

    merged["target_revert_5d"] = (overpriced_reversion | underpriced_reversion).fillna(0).astype(int)
 
    if include_unlabeled:
        return merged
 
    # Drop the trailing rows where future_spread_5d is NaN (the last 5 trading days cannot be labeled yet)
    labeled_df = merged.dropna(subset=["future_spread_5d"]).copy()
    labeled_df["target_revert_5d"] = labeled_df["target_revert_5d"].astype(int)

    logger.info(
        f"Feature matrix constructed: {len(labeled_df)} labeled samples. "
        f"Positive class (reversion) balance: {labeled_df['target_revert_5d'].mean():.2%}"
    )

    return labeled_df
