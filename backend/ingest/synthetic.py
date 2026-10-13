"""
Realistic Synthetic MCX Gold Futures Bhavcopy Data Generator.
Commodity Derivatives Intelligence

Features:
- ~12 months (252 trading days) of multi-contract settlement data
- 4 Symbols: GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL
- Expiry-aware: 3 active monthly expiries per trade date (Near, Mid, Far)
- Underlying Gold Spot modeled via Geometric Brownian Motion (GBM) with drift
- Cost-of-carry term structure (annualized interest financing minus convenience yield)
- Mean-reverting basis (Ornstein-Uhlenbeck process) per contract
- Expiry convergence (basis compression as days to expiry -> 0)
- Thin-liquidity regimes (low volume/OI on GOLDPETAL and GOLDGUINEA)
- Injected market dislocations (festive retail surges, liquidity drops, basis shocks)
- Output respects MCX quotation rules and tick sizes
"""

import numpy as np
import pandas as pd
from datetime import date, timedelta
from typing import Optional
from backend.config import CONTRACT_SPECS


def _get_active_expiries(current_date: date, count: int = 3) -> list[date]:
    """
    Generate the next `count` monthly MCX Gold expiry dates.
    MCX gold contracts typically expire on the 5th calendar day of the expiry month.
    """
    expiries = []
    # Check current month
    year = current_date.year
    month = current_date.month

    # Search forward up to 12 months
    for i in range(12):
        target_month = month + i
        target_year = year + (target_month - 1) // 12
        target_month = ((target_month - 1) % 12) + 1

        exp_date = date(target_year, target_month, 5)
        if exp_date > current_date:
            expiries.append(exp_date)
            if len(expiries) == count:
                break
    return expiries


def generate_synthetic_bhavcopy(
    start_date: Optional[date] = None,
    num_days: int = 252,
    seed: int = 42
) -> pd.DataFrame:
    """
    Generate a 12-month synthetic MCX Bhavcopy DataFrame.

    Returns:
        pd.DataFrame with columns: [Symbol, Date, ExpiryDate, Open, High, Low, Close, Volume, OpenInterest]
    """
    np.random.seed(seed)

    if start_date is None:
        # Default: 12 months ending around October 2026
        start_date = date(2025, 10, 6)

    # 1. Generate trading business days (excluding weekends)
    dates = []
    cur = start_date
    while len(dates) < num_days:
        if cur.weekday() < 5:  # Monday to Friday
            dates.append(cur)
        cur += timedelta(days=1)

    # 2. Simulate underlying Spot Gold price (INR/gram) using GBM
    # Gold spot in India ~INR 7,150/g (equiv to ~INR 71,500 / 10g)
    initial_spot = 7150.0
    annual_drift = 0.09     # 9% annualized drift
    annual_vol = 0.135      # 13.5% annualized volatility
    dt = 1.0 / 252.0

    spot_prices = np.zeros(num_days)
    spot_prices[0] = initial_spot

    # Generate correlated Brownian increments
    dW = np.random.normal(0, np.sqrt(dt), num_days)
    for t in range(1, num_days):
        spot_prices[t] = spot_prices[t - 1] * np.exp(
            (annual_drift - 0.5 * (annual_vol ** 2)) * dt + annual_vol * dW[t]
        )

    # Annual carry rate: 6.5% interest - 1.5% convenience yield = 5.0% net carry
    net_carry_rate = 0.050

    # Mean-reverting basis states (Ornstein-Uhlenbeck)
    # Basis = contract per-gram price minus benchmark GOLDM per-gram price
    # Equilibrium mean basis (INR/g):
    # GOLDM: 0.0 (reference)
    # GOLDTEN: +0.50 INR/g (slight packaging friction)
    # GOLDGUINEA: +12.0 INR/g (~0.16% coin premium)
    # GOLDPETAL: +28.0 INR/g (~0.39% retail 1g minted tamper-proof card premium)
    ou_theta = 0.25  # Speed of mean reversion (~4 days half-life)
    basis_mean = {
        "GOLDM": 0.0,
        "GOLDTEN": 0.50,
        "GOLDGUINEA": 12.0,
        "GOLDPETAL": 28.0
    }
    basis_vol = {
        "GOLDM": 0.30,
        "GOLDTEN": 1.20,
        "GOLDGUINEA": 3.50,
        "GOLDPETAL": 5.00
    }

    current_basis = {s: basis_mean[s] for s in CONTRACT_SPECS.keys()}

    # Dislocation injection schedules (day indices and shocks in INR/g)
    # Day ~45: Dhanteras / Diwali retail rush -> GOLDPETAL basis surges +75 INR/g (+1.0%)
    # Day ~115: Delivery tender margin hike -> GOLDTEN temporarily trades at discount (-25 INR/g)
    # Day ~170: Illiquidity shock in GOLDGUINEA -> basis gaps down -50 INR/g
    # Day ~220: Geopolitical safe-haven jump -> wide spread dislocation across all retail contracts
    dislocations = {
        45: {"GOLDPETAL": 85.0, "GOLDGUINEA": 30.0},
        46: {"GOLDPETAL": 90.0, "GOLDGUINEA": 32.0},
        47: {"GOLDPETAL": 70.0, "GOLDGUINEA": 22.0},
        115: {"GOLDTEN": -22.0},
        116: {"GOLDTEN": -18.0},
        170: {"GOLDGUINEA": -45.0},
        171: {"GOLDGUINEA": -40.0},
        220: {"GOLDPETAL": 65.0, "GOLDGUINEA": 45.0, "GOLDTEN": 15.0},
        221: {"GOLDPETAL": 55.0, "GOLDGUINEA": 35.0, "GOLDTEN": 10.0},
    }

    rows = []

    for t_idx, trade_date in enumerate(dates):
        spot = spot_prices[t_idx]
        active_expiries = _get_active_expiries(trade_date, count=3)

        # Update basis states via Ornstein-Uhlenbeck step
        for sym in CONTRACT_SPECS.keys():
            mu = basis_mean[sym]
            sigma = basis_vol[sym]
            current_basis[sym] += ou_theta * (mu - current_basis[sym]) + sigma * np.random.normal(0, 1)

            # Apply injected dislocation if active on this day
            if t_idx in dislocations and sym in dislocations[t_idx]:
                current_basis[sym] += dislocations[t_idx][sym]

        for exp_idx, expiry_date in enumerate(active_expiries):
            days_to_expiry = max(1, (expiry_date - trade_date).days)
            year_fraction = days_to_expiry / 365.0

            # Forward carry price for theoretical gold on this expiry
            forward_spot = spot * np.exp(net_carry_rate * year_fraction)

            # Expiry convergence factor: basis variance shrinks as days to expiry -> 0
            # Within 10 days of expiry, basis strongly converges toward fundamental purity parity
            convergence_factor = np.sqrt(min(1.0, days_to_expiry / 45.0))

            for sym, spec in CONTRACT_SPECS.items():
                purity_multiplier = spec["purity"] / 0.995  # Standardize vs 995 benchmark

                # Base per-gram settlement price
                basis_component = current_basis[sym] * convergence_factor
                contract_noise = np.random.normal(0, 0.5 * spec["tick_size"] / spec["quotation_base_g"])
                norm_close = (forward_spot * purity_multiplier) + basis_component + contract_noise

                # Quotation multiplier: convert per-gram back to MCX quoted unit
                quote_mult = spec["quotation_base_g"]
                raw_close_unrounded = norm_close * quote_mult

                # Round to contract tick size
                tick = spec["tick_size"]
                raw_close = round(raw_close_unrounded / tick) * tick

                # Intraday Open, High, Low generation
                intraday_vol_pct = np.random.uniform(0.003, 0.009)
                daily_range = raw_close * intraday_vol_pct

                open_offset = np.random.uniform(-0.4, 0.4) * daily_range
                raw_open = round((raw_close + open_offset) / tick) * tick

                raw_high = round((max(raw_open, raw_close) + np.random.uniform(0.1, 0.6) * daily_range) / tick) * tick
                raw_low = round((min(raw_open, raw_close) - np.random.uniform(0.1, 0.6) * daily_range) / tick) * tick

                # Ensure strict high/low bounds
                raw_high = max(raw_high, raw_open, raw_close)
                raw_low = min(raw_low, raw_open, raw_close)

                # Realistic liquidity dynamics:
                # - Near month has 75% volume, mid-month has 20%, far month has 5%
                # - GOLDM has institutional scale volume; GOLDPETAL and GOLDGUINEA have lower retail volume
                expiry_liquidity_weights = [1.0, 0.28, 0.08]
                exp_weight = expiry_liquidity_weights[min(exp_idx, 2)]

                if sym == "GOLDM":
                    base_vol = np.random.randint(600, 2200)
                    base_oi = np.random.randint(4500, 14000)
                elif sym == "GOLDTEN":
                    base_vol = np.random.randint(150, 650)
                    base_oi = np.random.randint(1200, 3500)
                elif sym == "GOLDGUINEA":
                    # Occasional thin liquidity days
                    is_thin = np.random.rand() < 0.12 or t_idx in (170, 171)
                    base_vol = np.random.randint(10, 35) if is_thin else np.random.randint(40, 160)
                    base_oi = np.random.randint(80, 220) if is_thin else np.random.randint(300, 950)
                else:  # GOLDPETAL
                    is_thin = np.random.rand() < 0.10
                    base_vol = np.random.randint(15, 45) if is_thin else np.random.randint(60, 220)
                    base_oi = np.random.randint(90, 250) if is_thin else np.random.randint(400, 1200)

                final_volume = max(1, int(base_vol * exp_weight))
                final_oi = max(5, int(base_oi * exp_weight))

                rows.append({
                    "Symbol": sym,
                    "Date": trade_date.isoformat(),
                    "ExpiryDate": expiry_date.isoformat(),
                    "Open": float(raw_open),
                    "High": float(raw_high),
                    "Low": float(raw_low),
                    "Close": float(raw_close),
                    "Volume": float(final_volume),
                    "OpenInterest": float(final_oi)
                })

    df = pd.DataFrame(rows)
    return df
