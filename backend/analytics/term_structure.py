"""
Term Structure and Contract Calendar Analytics.
Calculates forward curve, calendar spreads, annualized carry, and roll-window lifecycles.
Hack in Hills '26 - Team Holyknight
"""

import logging
from datetime import date
from typing import Optional, List, Dict, Any
from sqlalchemy import func
from backend.config import CONTRACT_SPECS, ROLL_WINDOW_DAYS
from backend.database.connection import get_session
from backend.database.schema import NormalizedPrice, BhavcopyClean

logger = logging.getLogger(__name__)


def get_term_structure(
    symbol: str = "GOLDM",
    target_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compute the forward term structure curve and annualized carry for a given contract symbol.
    Also returns a comparison curve from 30 days prior if available.
    """
    with get_session() as session:
        # Determine latest trade date if unspecified
        if not target_date:
            latest_d = session.query(func.max(NormalizedPrice.trade_date)).filter(
                NormalizedPrice.symbol == symbol
            ).scalar()
            if not latest_d:
                return {"symbol": symbol, "curve": [], "comparison_curve": []}
            target_date = latest_d.isoformat() if hasattr(latest_d, "isoformat") else str(latest_d)

        # Query all active expiries on target_date
        records = session.query(NormalizedPrice).filter(
            NormalizedPrice.symbol == symbol,
            NormalizedPrice.trade_date == target_date
        ).order_by(NormalizedPrice.expiry_date.asc()).all()

        if not records:
            return {"symbol": symbol, "trade_date": target_date, "curve": [], "comparison_curve": []}

        curve = []
        front_price = records[0].norm_close
        front_expiry = records[0].expiry_date

        for idx, r in enumerate(records):
            days_to_exp = max(1, (r.expiry_date - r.trade_date).days if hasattr(r.expiry_date, "days") or isinstance(r.expiry_date, date) else (pd.to_datetime(r.expiry_date) - pd.to_datetime(r.trade_date)).days)
            cal_spread = round(r.norm_close - front_price, 2)

            # Annualized carry rate vs front contract
            if idx == 0:
                ann_carry = 0.0
            else:
                days_diff = (r.expiry_date - front_expiry).days if hasattr(r.expiry_date, "days") or isinstance(r.expiry_date, date) else (pd.to_datetime(r.expiry_date) - pd.to_datetime(front_expiry)).days
                if days_diff > 0 and front_price > 0:
                    ann_carry = round(((r.norm_close - front_price) / front_price) * (365.0 / days_diff) * 100.0, 2)
                else:
                    ann_carry = 0.0

            exp_str = r.expiry_date.isoformat() if hasattr(r.expiry_date, "isoformat") else str(r.expiry_date)
            curve.append({
                "expiry_date": exp_str,
                "price_per_gram": round(r.norm_close, 2),
                "calendar_spread_inr": cal_spread,
                "annualized_carry_pct": ann_carry,
                "days_to_expiry": days_to_exp,
                "is_roll_window": days_to_exp <= ROLL_WINDOW_DAYS,
                "volume_grams": r.volume_grams,
                "oi_grams": r.open_interest_grams,
                "is_thin_liquidity": r.is_thin_liquidity
            })

        # Fetch comparison curve from ~30 trading days prior
        prior_dates = session.query(func.distinct(NormalizedPrice.trade_date)).filter(
            NormalizedPrice.symbol == symbol,
            NormalizedPrice.trade_date < target_date
        ).order_by(NormalizedPrice.trade_date.desc()).limit(30).all()

        comparison_curve = []
        if prior_dates:
            prior_val = prior_dates[-1][0]
            prior_date = prior_val.isoformat() if hasattr(prior_val, "isoformat") else str(prior_val)
            prior_records = session.query(NormalizedPrice).filter(
                NormalizedPrice.symbol == symbol,
                NormalizedPrice.trade_date == prior_date
            ).order_by(NormalizedPrice.expiry_date.asc()).all()

            for r in prior_records:
                exp_str = r.expiry_date.isoformat() if hasattr(r.expiry_date, "isoformat") else str(r.expiry_date)
                d_exp = (r.expiry_date - r.trade_date).days if hasattr(r.expiry_date, "days") or isinstance(r.expiry_date, date) else (pd.to_datetime(r.expiry_date) - pd.to_datetime(r.trade_date)).days
                comparison_curve.append({
                    "expiry_date": exp_str,
                    "price_per_gram": round(r.norm_close, 2),
                    "days_to_expiry": max(1, d_exp)
                })

        return {
            "symbol": symbol,
            "trade_date": target_date,
            "curve": curve,
            "comparison_curve": comparison_curve,
            "is_contango": curve[-1]["price_per_gram"] >= curve[0]["price_per_gram"] if len(curve) > 1 else True
        }


def get_contract_calendar(target_date: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Return the active contract lifecycle calendar for target_date (or latest available session).
    Tracks all (symbol, expiry_date) pairs, days to expiry relative to replay date, roll alerts, and liquidity.
    """
    with get_session() as session:
        if target_date:
            active_date = target_date
        else:
            latest_date_val = session.query(func.max(NormalizedPrice.trade_date)).scalar()
            if not latest_date_val:
                return []
            active_date = latest_date_val.isoformat() if hasattr(latest_date_val, "isoformat") else str(latest_date_val)

        # Join NormalizedPrice with BhavcopyClean to get raw contract volumes
        query = session.query(
            NormalizedPrice.symbol,
            NormalizedPrice.trade_date,
            NormalizedPrice.expiry_date,
            NormalizedPrice.norm_close,
            NormalizedPrice.volume_grams,
            NormalizedPrice.open_interest_grams,
            NormalizedPrice.is_thin_liquidity,
            BhavcopyClean.volume,
            BhavcopyClean.open_interest,
            BhavcopyClean.close_price
        ).join(
            BhavcopyClean,
            (NormalizedPrice.symbol == BhavcopyClean.symbol) &
            (NormalizedPrice.trade_date == BhavcopyClean.trade_date) &
            (NormalizedPrice.expiry_date == BhavcopyClean.expiry_date)
        ).filter(
            NormalizedPrice.trade_date == active_date
        ).order_by(
            NormalizedPrice.expiry_date.asc(),
            NormalizedPrice.symbol.asc()
        )

        rows = query.all()
        calendar = []
        for r in rows:
            days_to_exp = max(0, (r.expiry_date - r.trade_date).days)
            spec = CONTRACT_SPECS.get(r.symbol, {})

            calendar.append({
                "symbol": r.symbol,
                "contract_name": spec.get("name", r.symbol),
                "trade_date": r.trade_date.isoformat(),
                "expiry_date": r.expiry_date.isoformat(),
                "days_to_expiry": days_to_exp,
                "is_roll_window": days_to_exp <= ROLL_WINDOW_DAYS,
                "roll_status": "ROLL_ACTIVE" if days_to_exp <= ROLL_WINDOW_DAYS else "NORMAL",
                "price_per_gram": round(r.norm_close, 2),
                "raw_close": r.close_price,
                "volume_contracts": int(r.volume),
                "oi_contracts": int(r.open_interest),
                "volume_grams": round(r.volume_grams, 1),
                "lot_size_g": spec.get("contract_size_g", 1.0),
                "is_thin_liquidity": r.is_thin_liquidity
            })

        # Sort by days_to_expiry ascending, then symbol
        calendar.sort(key=lambda x: (x["days_to_expiry"], x["symbol"]))
        return calendar
