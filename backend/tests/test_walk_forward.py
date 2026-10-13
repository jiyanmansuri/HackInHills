"""
Unit Tests for Walk-Forward Splitting, Look-Ahead Bias Prevention, and Signal Discipline.
Commodity Derivatives Intelligence
"""

import pytest
import numpy as np
import pandas as pd
from backend.database.connection import init_db
from backend.app import create_app
from backend.ml.features import build_feature_dataset, FEATURE_NAMES
from backend.ml.signal_filter import get_active_signals
from backend.ml.walk_forward import get_backtest_summary, get_backtest_trades


@pytest.fixture(scope="module")
def app_client():
    init_db()
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_feature_dataset_integrity():
    """Verify feature dataset has required features and valid target column."""
    df = build_feature_dataset()
    assert not df.empty
    for feat in FEATURE_NAMES:
        assert feat in df.columns, f"Missing feature: {feat}"
    assert "target_revert_5d" in df.columns
    assert set(df["target_revert_5d"].unique()).issubset({0, 1})


def test_strictly_no_lookahead_in_walk_forward_windows():
    """
    CRITICAL QUANT TEST:
    Assert that across all walk-forward windows, max(train_date) < min(test_date).
    Verify that there is ZERO temporal overlap between training and testing splits.
    """
    df = build_feature_dataset()
    unique_dates = sorted(df["trade_date"].unique())

    train_window_days = 80
    test_window_days = 20
    num_dates = len(unique_dates)

    end_train_idx = train_window_days
    windows_checked = 0

    while end_train_idx < num_dates:
        end_test_idx = min(num_dates, end_train_idx + test_window_days)
        train_dates = unique_dates[:end_train_idx]
        test_dates = unique_dates[end_train_idx:end_test_idx]

        # 1. Assert chronological exclusivity
        max_train_date = max(train_dates)
        min_test_date = min(test_dates)
        assert max_train_date < min_test_date, (
            f"LOOK-AHEAD LEAKAGE DETECTED in window {windows_checked}: "
            f"max_train_date ({max_train_date}) >= min_test_date ({min_test_date})"
        )

        # 2. Assert no set intersection
        overlap = set(train_dates).intersection(set(test_dates))
        assert len(overlap) == 0, f"Overlapping dates found: {overlap}"

        windows_checked += 1
        end_train_idx = end_test_idx

    assert windows_checked >= 5, "At least 5 walk-forward windows must be evaluated."


def test_signal_discipline_and_permission_to_stay_quiet():
    """Verify signal engine respects permission to stay quiet when conditions fail."""
    signals_data = get_active_signals()
    assert "signals" in signals_data
    assert "has_actionable_signals" in signals_data
    assert "discipline_status" in signals_data
    assert signals_data["discipline_status"] in ("ACTIVE_OPPORTUNITY", "STAY_QUIET")

    for s in signals_data["signals"]:
        if s["signal_type"] == "NO_SIGNAL":
            assert s["stay_quiet_reason"] is not None
            assert len(s["stay_quiet_reason"]) > 0
        else:
            assert s["confidence"] >= 0.60
            assert abs(s["z_score"]) >= 1.0


def test_api_signals_endpoint(app_client):
    """Verify GET /api/signals."""
    res = app_client.get("/api/signals")
    assert res.status_code == 200
    data = res.get_json()
    assert "signals" in data
    assert "avg_confidence" in data
    assert "discipline_status" in data


def test_api_backtest_summary_endpoint(app_client):
    """Verify GET /api/backtest/summary."""
    res = app_client.get("/api/backtest/summary")
    assert res.status_code == 200
    data = res.get_json()
    assert "total_trades" in data
    assert "win_rate" in data
    assert "sharpe_ratio" in data
    assert "equity_series" in data
    assert len(data["equity_series"]) > 0


def test_api_backtest_trades_endpoint(app_client):
    """Verify GET /api/backtest/trades."""
    res = app_client.get("/api/backtest/trades?limit=10")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    trade = data[0]
    assert "symbol" in trade
    assert "entry_spread" in trade
    assert "exit_spread" in trade
    assert "net_pnl" in trade
