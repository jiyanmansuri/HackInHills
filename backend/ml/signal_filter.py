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


def evaluate_daily_signals(target_date: Optional[str] = None) -> int:
    """
    Run daily signal evaluation for target_date (defaults to latest available date).
    Emits BUY_SPREAD, SELL_SPREAD, or disciplined NO_SIGNAL with explicit rationale.
    """
    df_all = build_feature_dataset(include_unlabeled=True)
    if df_all.empty:
        logger.warning("Feature dataset is empty, cannot generate daily signals.")
        return 0

    if target_date:
        eval_date = pd.to_datetime(target_date)
    else:
        eval_date = df_all["trade_date"].max()

    # Train model on all historical data prior to eval_date with labeled targets (strictly no lookahead)
    labeled_history = df_all[(df_all["trade_date"] < eval_date) & (df_all["future_spread_5d"].notna())].copy()
    today_slice = df_all[df_all["trade_date"] == eval_date].copy()

    if labeled_history.empty or today_slice.empty:
        # Fall back to using labeled slice
        labeled_slice = df_all[df_all["future_spread_5d"].notna()].copy()
        split_idx = int(len(labeled_slice) * 0.85)
        labeled_history = labeled_slice.iloc[:split_idx].copy()
        if today_slice.empty:
            today_slice = labeled_slice.iloc[split_idx:].copy()

    X_train = labeled_history[FEATURE_NAMES].values
    y_train = labeled_history["target_revert_5d"].values

    # Fit model & scaler
    model, scaler = train_model(X_train, y_train, model_type="xgboost")

    # Predict today's probabilities
    X_today = today_slice[FEATURE_NAMES].values
    confidences = predict_confidence(model, scaler, X_today)
    today_slice["confidence"] = confidences

    signal_objects = []
    trade_d = eval_date.date() if hasattr(eval_date, "date") else eval_date

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


def get_active_signals(target_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Query market signals, discipline breakdown, and confidence metrics for target_date.
    If target_date is given or DB is empty, evaluates signals dynamically on that date.
    """
    with get_session() as session:
        if target_date:
            signals = session.query(Signal).filter(Signal.trade_date == target_date).order_by(Signal.is_active.desc(), Signal.confidence.desc()).all()
        else:
            signals = session.query(Signal).order_by(Signal.is_active.desc(), Signal.confidence.desc()).all()

        if not signals:
            # Dynamically evaluate for target_date
            evaluate_daily_signals(target_date=target_date)
            if target_date:
                signals = session.query(Signal).filter(Signal.trade_date == target_date).order_by(Signal.is_active.desc(), Signal.confidence.desc()).all()
            else:
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

        # Group by symbol to strictly keep the front-month (shortest days_to_expiry) contract per symbol
        # This guarantees 100% 1-to-1 parity with the front-month Relative Value table!
        front_month_signals = {}
        for s in signals:
            sym = s.symbol
            if sym not in front_month_signals or s.days_to_expiry < front_month_signals[sym].days_to_expiry:
                front_month_signals[sym] = s

        front_signal_list = [s.to_dict() for s in front_month_signals.values()]
        active_signals = [s for s in front_signal_list if s["is_active"]]

        avg_conf = round(float(np.mean([s["confidence"] for s in front_signal_list])), 3) if front_signal_list else 0.0

        best_opp = None
        if active_signals:
            best_opp = max(active_signals, key=lambda x: (x["confidence"], abs(x["z_score"])))
        else:
            # Select highest absolute z-score candidate in front-month even if staying quiet
            best_opp = max(front_signal_list, key=lambda x: abs(x["z_score"])) if front_signal_list else None

        return {
            "signals": front_signal_list,
            "has_actionable_signals": len(active_signals) > 0,
            "discipline_status": "ACTIVE_OPPORTUNITY" if len(active_signals) > 0 else "STAY_QUIET",
            "active_count": len(active_signals),
            "total_evaluated": len(front_signal_list),
            "avg_confidence": avg_conf,
            "best_opportunity": best_opp
        }
