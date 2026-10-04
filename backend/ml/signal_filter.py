"""
Signal Generation and Discipline Engine.
Enforces the core rule: "The system must be allowed to stay quiet."
Filters signals on confidence hurdles, liquidity regimes, and roll window safety.
Hack in Hills '26 - Team Holyknight
"""

import logging
from datetime import date
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sqlalchemy import func
from backend.config import (
    ML_CONFIDENCE_THRESHOLD, ROLL_WINDOW_DAYS, REFERENCE_SYMBOL
)
from backend.database.connection import get_session
from backend.database.schema import Signal, Spread, NormalizedPrice
from backend.ml.features import build_feature_dataset, FEATURE_NAMES
from backend.ml.models import train_model, predict_confidence

logger = logging.getLogger(__name__)


def evaluate_daily_signals() -> int:
    """
    Run daily signal evaluation for the latest trading date.
    Emits BUY_SPREAD, SELL_SPREAD, or disciplined NO_SIGNAL with explicit rationale.

    Returns:
        int: Total signals generated.
    """
    df = build_feature_dataset()
    if df.empty:
        logger.warning("Feature dataset is empty, cannot generate daily signals.")
        return 0

    latest_date = df["trade_date"].max()

    # Train model on all historical data prior to latest_date (strictly no lookahead)
    train_slice = df[df["trade_date"] < latest_date].copy()
    today_slice = df[df["trade_date"] == latest_date].copy()

    if train_slice.empty or today_slice.empty:
        # Fall back to using 85% chronological train split
        split_idx = int(len(df) * 0.85)
        train_slice = df.iloc[:split_idx].copy()
        today_slice = df.iloc[split_idx:].copy()

    X_train = train_slice[FEATURE_NAMES].values
    y_train = train_slice["target_revert_5d"].values

    # Fit model & scaler
    model, scaler = train_model(X_train, y_train, model_type="xgboost")

    # Predict today's probabilities
    X_today = today_slice[FEATURE_NAMES].values
    confidences = predict_confidence(model, scaler, X_today)
    today_slice["confidence"] = confidences

    signal_objects = []
    trade_d = latest_date.date() if hasattr(latest_date, "date") else latest_date

    for _, row in today_slice.iterrows():
        sym = str(row["symbol"])
        exp_d = row["expiry_date"].date() if hasattr(row["expiry_date"], "date") else row["expiry_date"]
        z = float(row["z_score_30d"])
        spread_pct = float(row["spread_pct"])
        days_to_exp = int(row["days_to_expiry"])
        is_thin = bool(row["is_thin_liquidity"] == 1)
        conf = float(row["confidence"])

        # Signal Discipline Evaluation Rules
        signal_type = "NO_SIGNAL"
        stay_quiet_reason = None
        regime = "EQUILIBRIUM"

        if is_thin:
            stay_quiet_reason = "Thin contract liquidity (Volume/OI below institutional threshold)"
            regime = "THIN_LIQUIDITY"
        elif days_to_exp <= ROLL_WINDOW_DAYS:
            stay_quiet_reason = f"Tender/roll window active ({days_to_exp}d to expiry): Delivery basis friction"
            regime = "ROLL_WINDOW"
        elif abs(z) < 1.0:
            stay_quiet_reason = f"Spread in equilibrium corridor (|Z| = {abs(z):.2f} < 1.0)"
            regime = "EQUILIBRIUM"
        elif conf < ML_CONFIDENCE_THRESHOLD:
            stay_quiet_reason = f"Statistical confidence ({conf:.1%}) below {ML_CONFIDENCE_THRESHOLD:.0%} threshold"
            regime = "LOW_CONFIDENCE"
        else:
            # Actionable signal confirmed!
            if z > 1.0:
                signal_type = "SELL_SPREAD"  # Short overpriced contract, Long GOLDM
                regime = "HIGH_DISLOCATION" if z >= 2.0 else "MODERATE_DISLOCATION"
            else:
                signal_type = "BUY_SPREAD"   # Long underpriced contract, Short GOLDM
                regime = "HIGH_DISLOCATION" if z <= -2.0 else "MODERATE_DISLOCATION"

        signal_objects.append(
            Signal(
                trade_date=trade_d,
                symbol=sym,
                expiry_date=exp_d,
                signal_type=signal_type,
                confidence=conf,
                z_score=z,
                spread_pct=spread_pct,
                regime=regime,
                stay_quiet_reason=stay_quiet_reason,
                days_to_expiry=days_to_exp,
                is_active=(signal_type != "NO_SIGNAL")
            )
        )

    with get_session() as session:
        session.query(Signal).delete()
        session.bulk_save_objects(signal_objects)
        session.commit()

    logger.info(f"Daily signal evaluation complete: Generated {len(signal_objects)} contract signals for {trade_d}.")
    return len(signal_objects)


def get_active_signals() -> Dict[str, Any]:
    """
    Query current market signals, discipline breakdown, and confidence metrics.
    """
    with get_session() as session:
        signals = session.query(Signal).order_by(Signal.is_active.desc(), Signal.confidence.desc()).all()

        if not signals:
            return {
                "signals": [],
                "has_actionable_signals": False,
                "discipline_status": "NO_DATA",
                "active_count": 0,
                "avg_confidence": 0.0,
                "best_opportunity": None
            }

        signal_list = [s.to_dict() for s in signals]
        active_signals = [s for s in signal_list if s["is_active"]]

        avg_conf = round(float(np.mean([s["confidence"] for s in signal_list])), 3) if signal_list else 0.0

        best_opp = None
        if active_signals:
            best_opp = max(active_signals, key=lambda x: (x["confidence"], abs(x["z_score"])))
        else:
            # Select highest absolute z-score candidate even if staying quiet
            best_opp = max(signal_list, key=lambda x: abs(x["z_score"]))

        return {
            "signals": signal_list,
            "has_actionable_signals": len(active_signals) > 0,
            "discipline_status": "ACTIVE_OPPORTUNITY" if len(active_signals) > 0 else "STAY_QUIET",
            "active_count": len(active_signals),
            "total_evaluated": len(signal_list),
            "avg_confidence": avg_conf,
            "best_opportunity": best_opp
        }
