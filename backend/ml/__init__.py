"""
ML and Walk-Forward Backtesting Engine.
Hack in Hills '26 - Team Holyknight
"""

from backend.ml.features import build_feature_dataset
from backend.ml.walk_forward import run_walk_forward_backtest, get_backtest_summary, get_backtest_trades
from backend.ml.signal_filter import evaluate_daily_signals, get_active_signals

__all__ = [
    "build_feature_dataset",
    "run_walk_forward_backtest",
    "get_backtest_summary",
    "get_backtest_trades",
    "evaluate_daily_signals",
    "get_active_signals"
]
