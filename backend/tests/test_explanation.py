"""
Unit Tests for AI Explanation Layer and POST /api/explain.
Commodity Derivatives Intelligence
"""

import pytest
from backend.database.connection import init_db
from backend.app import create_app
from backend.explain.claude_client import explain_signal


@pytest.fixture(scope="module")
def app_client():
    init_db()
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_explain_signal_function():
    """Verify explain_signal returns structured commentary with decision-support disclaimer."""
    payload = {
        "symbol": "GOLDTEN",
        "expiry_date": "2026-11-05",
        "spread_abs": 12.5,
        "spread_pct": 0.17,
        "z_score": 2.15,
        "confidence": 0.74,
        "days_to_expiry": 22,
        "is_thin_liquidity": False,
        "regime": "HIGH_DISLOCATION",
        "signal_type": "SELL_SPREAD"
    }

    res = explain_signal(payload)
    assert "explanation" in res
    assert "model_used" in res
    assert len(res["explanation"]) > 100
    # Mandatory disclaimer check
    assert "decision-support" in res["explanation"].lower() or "not investment advice" in res["explanation"].lower()


def test_api_explain_endpoint(app_client):
    """Verify POST /api/explain endpoint returns 200 with structured commentary."""
    payload = {
        "symbol": "GOLDPETAL",
        "expiry_date": "2026-11-05",
        "spread_abs": 45.0,
        "spread_pct": 0.62,
        "z_score": 2.45,
        "confidence": 0.81,
        "days_to_expiry": 18,
        "is_thin_liquidity": False,
        "regime": "HIGH_DISLOCATION",
        "signal_type": "SELL_SPREAD"
    }

    res = app_client.post("/api/explain", json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert "explanation" in data
    assert "model_used" in data
