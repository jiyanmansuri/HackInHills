"""
Walk-Forward Out-of-Sample Backtesting Engine.
Enforces strict chronological train/test separation (zero look-ahead bias),
transaction friction modeling, and thin-liquidity exclusion.
Hack in Hills '26 - Team Holyknight
"""

import logging
from datetime import date, timedelta
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from backend.config import (
    TRANSACTION_COST_BPS, ML_CONFIDENCE_THRESHOLD,
    ROLL_WINDOW_DAYS, REFERENCE_SYMBOL
)
from backend.database.connection import get_session
from backend.database.schema import BacktestRun, BacktestTrade, NormalizedPrice
from backend.ml.features import build_feature_dataset, FEATURE_NAMES
from backend.ml.models import train_model, predict_confidence

logger = logging.getLogger(__name__)


def run_walk_forward_backtest(
    train_window_days: int = 80,
    test_window_days: int = 20,
    cost_bps: float = TRANSACTION_COST_BPS,
    model_type: str = "xgboost"
) -> Dict[str, Any]:
    """
    Execute expanding-window walk-forward backtest across historical data.

    Guarantees:
    - StandardScaler fitted ONLY on training split
    - Model trained ONLY on training split
    - Zero future leakage: test slice strictly follows training slice
    - Thin liquidity days are discarded
    - Transaction costs deducted on every round-trip trade
    """
    logger.info("Initializing Walk-Forward Backtesting Engine...")
    df = build_feature_dataset()

    # Load gold benchmark prices for transaction cost and beta attribution
    with get_session() as session:
        gold_prices = session.query(
            NormalizedPrice.trade_date,
            NormalizedPrice.norm_close
        ).filter(NormalizedPrice.symbol == REFERENCE_SYMBOL).all()
        gold_price_map = {r.trade_date: r.norm_close for r in gold_prices}

    # Distinct sorted trading dates
    unique_dates = sorted(df["trade_date"].unique())
    num_dates = len(unique_dates)

    if num_dates < (train_window_days + test_window_days):
        raise ValueError(
            f"Insufficient trading days ({num_dates}) for train window ({train_window_days}) "
            f"and test window ({test_window_days})."
        )

    all_oos_trades = []
    window_count = 0

    # Walk-forward expanding window loop
    start_train_idx = 0
    end_train_idx = train_window_days

    while end_train_idx < num_dates:
        end_test_idx = min(num_dates, end_train_idx + test_window_days)

        train_dates = unique_dates[start_train_idx:end_train_idx]
        test_dates = unique_dates[end_train_idx:end_test_idx]

        # Strict assertion of no look-ahead overlap
        assert max(train_dates) < min(test_dates), "LOOKAHEAD LEAKAGE DETECTED: max(train) >= min(test)!"

        df_train = df[df["trade_date"].isin(train_dates)].copy()
        df_test = df[df["trade_date"].isin(test_dates)].copy()

        if df_train.empty or df_test.empty:
            end_train_idx = end_test_idx
            continue

        X_train = df_train[FEATURE_NAMES].values
        y_train = df_train["target_revert_5d"].values

        # 1. Train model and scaler strictly on train set
        model, scaler = train_model(X_train, y_train, model_type=model_type)

        # 2. Predict out-of-sample test confidences
        X_test = df_test[FEATURE_NAMES].values
        test_probs = predict_confidence(model, scaler, X_test)
        df_test["ml_confidence"] = test_probs

        # 3. Simulate out-of-sample trades with signal discipline
        for _, row in df_test.iterrows():
            # Filter 1: Thin liquidity exclusion
            if row["is_thin_liquidity"] == 1:
                continue

            # Filter 2: Roll window exclusion (within 5 days of expiry)
            if row["days_to_expiry"] <= ROLL_WINDOW_DAYS:
                continue

            # Filter 3: Confidence cutoff
            conf = float(row["ml_confidence"])
            if conf < ML_CONFIDENCE_THRESHOLD:
                continue

            z = float(row["z_score_30d"])
            # Filter 4: Dislocation threshold (|Z| >= 1.1)
            if abs(z) < 1.1:
                continue

            # Determine trade direction
            direction = "SHORT_SPREAD" if z > 0 else "LONG_SPREAD"

            entry_date = row["trade_date"].date() if hasattr(row["trade_date"], "date") else row["trade_date"]
            expiry_date = row["expiry_date"].date() if hasattr(row["expiry_date"], "date") else row["expiry_date"]
            entry_spread = float(row["spread_abs"])
            symbol = str(row["symbol"])
            entry_gold = gold_price_map.get(entry_date, 7200.0)

            # Simulated forward exit lookup
            future_candidates = df[
                (df["symbol"] == symbol) &
                (df["expiry_date"] == row["expiry_date"]) &
                (df["trade_date"] > row["trade_date"])
            ].sort_values("trade_date").head(5)

            if future_candidates.empty:
                continue

            exit_spread = entry_spread
            exit_date = entry_date
            exit_reason = "TIME_EXPIRY"
            exit_gold = entry_gold

            for _, fut_row in future_candidates.iterrows():
                fut_z = float(fut_row["z_score_30d"])
                fut_days = int(fut_row["days_to_expiry"])
                fut_date = fut_row["trade_date"].date() if hasattr(fut_row["trade_date"], "date") else fut_row["trade_date"]

                # Target reached: z-score reverted to near zero (|Z| <= 0.35)
                if abs(fut_z) <= 0.35:
                    exit_spread = float(fut_row["spread_abs"])
                    exit_date = fut_date
                    exit_reason = "MEAN_REVERTED"
                    exit_gold = gold_price_map.get(exit_date, entry_gold)
                    break
                elif fut_days <= ROLL_WINDOW_DAYS:
                    exit_spread = float(fut_row["spread_abs"])
                    exit_date = fut_date
                    exit_reason = "ROLL_WINDOW_EXIT"
                    exit_gold = gold_price_map.get(exit_date, entry_gold)
                    break
            else:
                last_fut = future_candidates.iloc[-1]
                exit_spread = float(last_fut["spread_abs"])
                exit_date = last_fut["trade_date"].date() if hasattr(last_fut["trade_date"], "date") else last_fut["trade_date"]
                exit_reason = "MAX_HOLD_5D"
                exit_gold = gold_price_map.get(exit_date, entry_gold)

            # Calculate Gross PnL in INR per gram
            if direction == "SHORT_SPREAD":
                gross_pnl = entry_spread - exit_spread
            else:
                gross_pnl = exit_spread - entry_spread

            # Transaction costs: 2 legs (contract + reference) * 2 sides (entry + exit) * cost_bps
            # cost_bps in basis points (e.g. 3.0 bps = 0.00030)
            fee_rate = (cost_bps / 10000.0) * 2.0
            fees = entry_gold * fee_rate
            net_pnl = gross_pnl - fees
            duration_days = max(1, (exit_date - entry_date).days if isinstance(exit_date, date) else 1)
            ret_pct = (net_pnl / entry_gold) * 100.0

            all_oos_trades.append({
                "symbol": symbol,
                "expiry_date": expiry_date,
                "entry_date": entry_date,
                "exit_date": exit_date,
                "direction": direction,
                "entry_spread": entry_spread,
                "exit_spread": exit_spread,
                "entry_gold_price": entry_gold,
                "exit_gold_price": exit_gold,
                "gross_pnl": gross_pnl,
                "fees": fees,
                "net_pnl": net_pnl,
                "return_pct": ret_pct,
                "duration_days": duration_days,
                "exit_reason": exit_reason,
                "confidence": conf
            })

        window_count += 1
        # Expanding window: advance end of train window by test_window_days
        end_train_idx = end_test_idx

    logger.info(f"Walk-forward complete across {window_count} out-of-sample windows. Generated {len(all_oos_trades)} out-of-sample trades.")

    if not all_oos_trades:
        logger.warning("No out-of-sample trades passed the strict filtering criteria.")
        return {"status": "NO_TRADES", "message": "All windows stayed quiet."}

    # Aggregate performance metrics
    df_trades = pd.DataFrame(all_oos_trades)
    # Deduplicate overlapping signals for the exact same entry_date & symbol
    df_trades = df_trades.drop_duplicates(subset=["symbol", "entry_date"]).reset_index(drop=True)

    total_trades = len(df_trades)
    winning_trades = int((df_trades["net_pnl"] > 0).sum())
    win_rate = winning_trades / max(1, total_trades)

    # Cumulative equity curve
    df_trades["cum_pnl"] = df_trades["net_pnl"].cumsum()
    cum_returns = df_trades["net_pnl"].values

    total_return_pct = float(df_trades["return_pct"].sum())

    # Sharpe ratio (annualized)
    mean_ret = np.mean(cum_returns)
    std_ret = np.std(cum_returns) if np.std(cum_returns) > 0 else 1.0
    sharpe = float((mean_ret / std_ret) * np.sqrt(252.0 / 5.0))

    # Max Drawdown
    equity_curve = df_trades["cum_pnl"].values
    running_max = np.maximum.accumulate(equity_curve)
    drawdowns = equity_curve - running_max
    max_dd = float(np.min(drawdowns)) if len(drawdowns) > 0 else 0.0
    max_dd_pct = abs(max_dd / max(1.0, float(np.max(equity_curve)))) * 100.0 if np.max(equity_curve) > 0 else 0.0

    # Store BacktestRun and BacktestTrade records in DB
    with get_session() as session:
        session.query(BacktestTrade).delete()
        session.query(BacktestRun).delete()

        run = BacktestRun(
            run_name=f"Walk-Forward {model_type.upper()} ({train_window_days}d/{test_window_days}d)",
            model_name=model_type,
            start_date=unique_dates[0].date() if hasattr(unique_dates[0], "date") else unique_dates[0],
            end_date=unique_dates[-1].date() if hasattr(unique_dates[-1], "date") else unique_dates[-1],
            train_window_days=train_window_days,
            test_window_days=test_window_days,
            total_trades=total_trades,
            winning_trades=winning_trades,
            win_rate=win_rate,
            total_return_pct=total_return_pct,
            sharpe_ratio=round(sharpe, 2),
            max_drawdown_pct=round(max_dd_pct, 2),
            cost_bps=cost_bps
        )
        session.add(run)
        session.flush()

        trade_objects = []
        for _, t in df_trades.iterrows():
            trade_objects.append(
                BacktestTrade(
                    run_id=run.id,
                    symbol=t["symbol"],
                    expiry_date=t["expiry_date"],
                    entry_date=t["entry_date"],
                    exit_date=t["exit_date"],
                    direction=t["direction"],
                    entry_spread=t["entry_spread"],
                    exit_spread=t["exit_spread"],
                    entry_gold_price=t["entry_gold_price"],
                    exit_gold_price=t["exit_gold_price"],
                    gross_pnl=t["gross_pnl"],
                    fees=t["fees"],
                    net_pnl=t["net_pnl"],
                    return_pct=t["return_pct"],
                    duration_days=t["duration_days"],
                    exit_reason=t["exit_reason"]
                )
            )
        session.bulk_save_objects(trade_objects)
        session.commit()

    logger.info(
        f"Backtest metrics saved: Total Trades={total_trades}, Win Rate={win_rate:.1%}, "
        f"Sharpe={sharpe:.2f}, Max Drawdown={max_dd_pct:.1f}%"
    )

    return {
        "status": "success",
        "total_trades": total_trades,
        "winning_trades": winning_trades,
        "win_rate": round(win_rate, 4),
        "total_return_pct": round(total_return_pct, 2),
        "sharpe_ratio": round(sharpe, 2),
        "max_drawdown_pct": round(max_dd_pct, 2),
        "windows_evaluated": window_count,
        "trades_preview": df_trades.head(5).to_dict(orient="records")
    }


def get_backtest_summary(target_date: Optional[str] = None) -> Dict[str, Any]:
    """Retrieve walk-forward backtest summary and equity curve up to target_date."""
    with get_session() as session:
        run = session.query(BacktestRun).order_by(BacktestRun.id.desc()).first()
        if not run:
            return {"status": "NO_RUN", "message": "No backtest runs found."}

        trade_query = session.query(BacktestTrade).filter(BacktestTrade.run_id == run.id).order_by(BacktestTrade.exit_date.asc(), BacktestTrade.id.asc())
        if target_date:
            trade_query = trade_query.filter(BacktestTrade.exit_date <= target_date)
        trades = trade_query.all()

        if not trades:
            return {
                "run_name": f"Out-of-Sample Period (as of {target_date})",
                "total_trades": 0,
                "winning_trades": 0,
                "win_rate": 0.0,
                "total_return_pct": 0.0,
                "sharpe_ratio": 0.0,
                "max_drawdown_pct": 0.0,
                "cost_bps": 3.0,
                "equity_series": [],
                "is_insufficient_history": True,
                "message": f"Zero out-of-sample trades concluded prior to {target_date}."
            }

        # Build equity curve time series vs buy-and-hold gold
        daily_equity_map = {}
        running_equity = 100000.0  # Starting portfolio base INR 100k
        running_gold_equity = 100000.0

        first_gold = trades[0].entry_gold_price if trades else 7200.0
        pnl_series = []

        for t in trades:
            # Sizing: 100g position
            trade_pnl = t.net_pnl * 100.0
            running_equity += trade_pnl
            pnl_series.append(running_equity)

            # Gold buy-and-hold equivalent
            gold_ret = (t.exit_gold_price - first_gold) / max(1.0, first_gold)
            running_gold_equity = 100000.0 * (1.0 + gold_ret)

            d_str = t.exit_date.isoformat()
            daily_equity_map[d_str] = {
                "date": d_str,
                "strategy_equity": round(running_equity, 2),
                "gold_buy_and_hold": round(running_gold_equity, 2),
                "trade_pnl": round(trade_pnl, 2),
                "symbol": t.symbol,
                "direction": t.direction
            }

        equity_series = [daily_equity_map[d] for d in sorted(daily_equity_map.keys())]

        # Dynamically compute metrics for the subset
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t.net_pnl > 0)
        win_rate = winning_trades / max(1, total_trades)

        running_max = np.maximum.accumulate(pnl_series)
        drawdowns = np.array(pnl_series) - running_max
        max_dd = float(np.min(drawdowns)) if len(drawdowns) > 0 else 0.0
        max_dd_pct = abs(max_dd / max(1.0, float(np.max(pnl_series)))) * 100.0 if np.max(pnl_series) > 0 else 0.0

        ret_series = [t.return_pct for t in trades]
        mean_ret = float(np.mean(ret_series))
        std_ret = float(np.std(ret_series)) if np.std(ret_series) > 0 else 1.0
        sharpe = round(float((mean_ret / std_ret) * np.sqrt(252.0 / 5.0)), 2)

        return {
            "id": run.id,
            "run_name": f"Walk-Forward XGBoost (as of {target_date})" if target_date else run.run_name,
            "model_name": run.model_name,
            "start_date": trades[0].entry_date.isoformat(),
            "end_date": trades[-1].exit_date.isoformat(),
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "win_rate": round(win_rate, 4),
            "total_return_pct": round(sum(ret_series), 2),
            "sharpe_ratio": sharpe,
            "max_drawdown_pct": round(max_dd_pct, 2),
            "cost_bps": run.cost_bps,
            "equity_series": equity_series,
            "is_insufficient_history": total_trades < 10
        }


def get_backtest_trades(limit: int = 100, target_date: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve out-of-sample backtest trades list up to target_date."""
    with get_session() as session:
        query = session.query(BacktestTrade)
        if target_date:
            query = query.filter(BacktestTrade.exit_date <= target_date)
        trades = query.order_by(BacktestTrade.entry_date.desc()).limit(limit).all()
        return [t.to_dict() for t in trades]
