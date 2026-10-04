"""
Unit Tests for Data Ingestion, Validation, and Ingestion Routes.
Hack in Hills '26 - Team Holyknight
"""

import pytest
import pandas as pd
from datetime import date
from backend.config import CONTRACT_SPECS
from backend.database.connection import get_session, init_db
from backend.database.schema import ContractSpec, BhavcopyClean
from backend.ingest.synthetic import generate_synthetic_bhavcopy
from backend.ingest.validator import get_data_quality_report, validate_and_clean_bhavcopy
from backend.app import create_app


@pytest.fixture(scope="module")
def app_client():
    init_db()
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_contract_specs_exist():
    """Verify all 4 symbols exist in config and DB with expected specs."""
    assert "GOLDM" in CONTRACT_SPECS
    assert "GOLDTEN" in CONTRACT_SPECS
    assert "GOLDGUINEA" in CONTRACT_SPECS
    assert "GOLDPETAL" in CONTRACT_SPECS

    with get_session() as session:
        specs = {s.symbol: s for s in session.query(ContractSpec).all()}
        assert len(specs) == 4
        assert specs["GOLDM"].contract_size_g == 100.0
        assert specs["GOLDM"].quotation_base_g == 10.0
        assert specs["GOLDTEN"].contract_size_g == 10.0
        assert specs["GOLDTEN"].quotation_base_g == 1.0
        assert specs["GOLDGUINEA"].contract_size_g == 8.0
        assert specs["GOLDGUINEA"].quotation_base_g == 8.0
        assert specs["GOLDPETAL"].contract_size_g == 1.0
        assert specs["GOLDPETAL"].quotation_base_g == 1.0


def test_synthetic_data_generation_structure():
    """Verify synthetic generator generates multi-contract data with required columns."""
    df = generate_synthetic_bhavcopy(num_days=20, seed=123)
    expected_cols = {"Symbol", "Date", "ExpiryDate", "Open", "High", "Low", "Close", "Volume", "OpenInterest"}
    assert expected_cols.issubset(set(df.columns))
    assert set(df["Symbol"].unique()) == {"GOLDM", "GOLDTEN", "GOLDGUINEA", "GOLDPETAL"}

    # Verify high >= max(open, close) and low <= min(open, close)
    assert (df["High"] >= df["Open"]).all()
    assert (df["High"] >= df["Close"]).all()
    assert (df["Low"] <= df["Open"]).all()
    assert (df["Low"] <= df["Close"]).all()

    # Verify expiry date is always >= trade date
    t_dates = pd.to_datetime(df["Date"])
    e_dates = pd.to_datetime(df["ExpiryDate"])
    assert (e_dates >= t_dates).all()


def test_data_quality_report():
    """Verify data quality report returns healthy metrics."""
    report = get_data_quality_report()
    assert report["status"] in ("HEALTHY", "WARNING")
    assert report["health_score"] >= 70.0
    assert report["total_clean_rows"] > 0
    assert "symbols" in report
    assert "GOLDM" in report["symbols"]


def test_api_health(app_client):
    """Verify GET /api/health."""
    res = app_client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert "database" in data


def test_api_contracts(app_client):
    """Verify GET /api/contracts."""
    res = app_client.get("/api/contracts")
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) == 4
    symbols = [item["symbol"] for item in data]
    assert "GOLDM" in symbols


def test_api_data_quality(app_client):
    """Verify GET /api/data-quality."""
    res = app_client.get("/api/data-quality")
    assert res.status_code == 200
    data = res.get_json()
    assert "health_score" in data
    assert data["total_clean_rows"] > 0
