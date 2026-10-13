"""
Unit Tests for Per-Gram Normalization Logic.
Commodity Derivatives Intelligence
"""

import pytest
from backend.config import CONTRACT_SPECS
from backend.analytics.normalizer import normalize_record


def test_goldm_normalization():
    """GOLDM: 100g contract, quoted per 10g."""
    # Raw price INR 72,000 per 10g -> INR 7,200 / gram
    res = normalize_record("GOLDM", open_p=71800, high_p=72200, low_p=71500, close_p=72000, volume=10, oi=50)
    assert res["norm_close"] == 7200.0
    assert res["norm_open"] == 7180.0
    assert res["norm_high"] == 7220.0
    assert res["norm_low"] == 7150.0
    # 10 contracts * 100g = 1,000 grams
    assert res["volume_grams"] == 1000.0
    # 50 contracts * 100g = 5,000 grams
    assert res["open_interest_grams"] == 5000.0


def test_goldten_normalization():
    """GOLDTEN: 10g contract, quoted per 1g."""
    # Raw price INR 7,205 per 1g -> INR 7,205 / gram
    res = normalize_record("GOLDTEN", open_p=7200, high_p=7220, low_p=7190, close_p=7205, volume=20, oi=100)
    assert res["norm_close"] == 7205.0
    # 20 contracts * 10g = 200 grams
    assert res["volume_grams"] == 200.0


def test_goldguinea_normalization():
    """GOLDGUINEA: 8g contract, quoted per 8g (1 guinea)."""
    # Raw price INR 57,680 per 8g -> INR 7,210 / gram
    res = normalize_record("GOLDGUINEA", open_p=57600, high_p=57800, low_p=57500, close_p=57680, volume=5, oi=40)
    assert res["norm_close"] == 7210.0
    # 5 contracts * 8g = 40 grams
    assert res["volume_grams"] == 40.0


def test_goldpetal_normalization():
    """GOLDPETAL: 1g contract, quoted per 1g."""
    # Raw price INR 7,235 per 1g -> INR 7,235 / gram
    res = normalize_record("GOLDPETAL", open_p=7220, high_p=7250, low_p=7210, close_p=7235, volume=30, oi=150)
    assert res["norm_close"] == 7235.0
    # 30 contracts * 1g = 30 grams
    assert res["volume_grams"] == 30.0


def test_unknown_symbol_raises():
    """Ensure invalid contract symbols raise ValueError."""
    with pytest.raises(ValueError):
        normalize_record("SILVERM", 70000, 71000, 69000, 70500, 10, 10)
