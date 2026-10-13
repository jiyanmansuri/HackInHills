"""
Unit Tests for Spread Math, Term Structure, Attribution, and Market API.
Commodity Derivatives Intelligence
"""

import pytest
from backend.database.connection import init_db
from backend.app import create_app
from backend.analytics.relative_value import get_relative_value_snapshot
from backend.analytics.term_structure import get_term_structure, get_contract_calendar
from backend.analytics.attribution import compute_performance_attribution


@pytest.fixture(scope="module")
def app_client():
    init_db()
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_spread_math_snapshot():
    """Verify relative value snapshot calculates spread_abs, spread_pct, and z-scores."""
    snapshot = get_relative_value_snapshot()
    assert len(snapshot) > 0

    for item in snapshot:
        assert "symbol" in item
        assert item["symbol"] in ("GOLDTEN", "GOLDGUINEA", "GOLDPETAL")
        assert "spread_abs" in item
        assert "spread_pct" in item
        assert "z_score_30d" in item
        assert "regime" in item
        assert item["regime"] in ("HIGH_DISLOCATION", "MODERATE_DISLOCATION", "EQUILIBRIUM", "MEAN_REVERTING")


def test_term_structure_curve():
    """Verify term structure forward curve calculation for GOLDM."""
    res = get_term_structure("GOLDM")
    assert res["symbol"] == "GOLDM"
    assert "curve" in res
    assert len(res["curve"]) > 0

    # First contract should have calendar spread 0.0 to front
    front = res["curve"][0]
    assert front["calendar_spread_inr"] == 0.0
    assert front["days_to_expiry"] > 0
    assert "is_roll_window" in front


def test_contract_calendar():
    """Verify contract calendar tracks live contracts with days to expiry."""
    calendar = get_contract_calendar()
    assert len(calendar) > 0
    symbols = {c["symbol"] for c in calendar}
    assert {"GOLDM", "GOLDTEN", "GOLDGUINEA", "GOLDPETAL"}.issubset(symbols)
    assert all("days_to_expiry" in c for c in calendar)
    assert all("roll_status" in c for c in calendar)


def test_performance_attribution():
    """Verify return attribution separates spread capture alpha from gold beta."""
    attribution = compute_performance_attribution()
    assert "series" in attribution
    assert "summary" in attribution
    assert len(attribution["series"]) > 0

    summary = attribution["summary"]
    assert "spread_capture_share_pct" in summary
    assert "gold_drift_share_pct" in summary
    assert "beta_to_gold" in summary
    assert summary["spread_capture_share_pct"] > 50.0  # Demonstrates edge is not just gold beta


def test_api_normalized_prices(app_client):
    """Verify GET /api/prices/normalized."""
    res = app_client.get("/api/prices/normalized?symbols=GOLDM,GOLDTEN")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "norm_close" in data[0]


def test_api_relative_value(app_client):
    """Verify GET /api/relative-value."""
    res = app_client.get("/api/relative-value")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_api_term_structure(app_client):
    """Verify GET /api/term-structure?symbol=GOLDM."""
    res = app_client.get("/api/term-structure?symbol=GOLDM")
    assert res.status_code == 200
    data = res.get_json()
    assert data["symbol"] == "GOLDM"
    assert "curve" in data


def test_api_calendar(app_client):
    """Verify GET /api/calendar."""
    res = app_client.get("/api/calendar")
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_api_attribution(app_client):
    """Verify GET /api/attribution."""
    res = app_client.get("/api/attribution")
    assert res.status_code == 200
    data = res.get_json()
    assert "series" in data
    assert "summary" in data
