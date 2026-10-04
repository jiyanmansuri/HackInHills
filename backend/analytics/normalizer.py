"""
Per-Gram Normalization Engine.
Converts MCX contract quotations to a unified INR per gram (INR/g) baseline.
Hack in Hills '26 - Team Holyknight
"""

import logging
from datetime import date
from typing import Optional, List, Dict, Any
import pandas as pd
from backend.config import CONTRACT_SPECS
from backend.database.connection import get_session
from backend.database.schema import BhavcopyClean, NormalizedPrice

logger = logging.getLogger(__name__)


def normalize_record(
    symbol: str,
    open_p: float,
    high_p: float,
    low_p: float,
    close_p: float,
    volume: float,
    oi: float
) -> Dict[str, float]:
    """
    Apply contract quotation and lot size specs to calculate per-gram values.

    Formula:
        PricePerGram = RawPrice / quotation_base_g
        VolumeGrams = Volume * contract_size_g
        OIGrams = OpenInterest * contract_size_g
    """
    if symbol not in CONTRACT_SPECS:
        raise ValueError(f"Unknown contract symbol: {symbol}")

    spec = CONTRACT_SPECS[symbol]
    base_g = spec["quotation_base_g"]
    lot_g = spec["contract_size_g"]

    return {
        "norm_open": open_p / base_g,
        "norm_high": high_p / base_g,
        "norm_low": low_p / base_g,
        "norm_close": close_p / base_g,
        "volume_grams": volume * lot_g,
        "open_interest_grams": oi * lot_g,
    }


def compute_and_store_normalized_prices() -> int:
    """
    Load all records from bhavcopy_clean, compute per-gram prices,
    and persist into normalized_prices table.

    Returns:
        int: Total normalized records saved.
    """
    with get_session() as session:
        clean_rows = session.query(BhavcopyClean).all()
        if not clean_rows:
            logger.warning("No clean bhavcopy rows available to normalize.")
            return 0

        norm_objects = []
        for r in clean_rows:
            norm = normalize_record(
                r.symbol,
                r.open_price,
                r.high_price,
                r.low_price,
                r.close_price,
                r.volume,
                r.open_interest
            )
            norm_objects.append(
                NormalizedPrice(
                    symbol=r.symbol,
                    trade_date=r.trade_date,
                    expiry_date=r.expiry_date,
                    norm_open=norm["norm_open"],
                    norm_high=norm["norm_high"],
                    norm_low=norm["norm_low"],
                    norm_close=norm["norm_close"],
                    volume_grams=norm["volume_grams"],
                    open_interest_grams=norm["open_interest_grams"],
                    is_thin_liquidity=r.is_thin_liquidity
                )
            )

        session.query(NormalizedPrice).delete()
        session.bulk_save_objects(norm_objects)
        session.commit()

    logger.info(f"Successfully computed and stored {len(norm_objects)} normalized price rows.")
    return len(norm_objects)


def get_normalized_prices(
    symbols: Optional[List[str]] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    expiry_date: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Query normalized prices with optional filtering.
    """
    with get_session() as session:
        query = session.query(NormalizedPrice)

        if symbols:
            query = query.filter(NormalizedPrice.symbol.in_(symbols))
        if from_date:
            query = query.filter(NormalizedPrice.trade_date >= from_date)
        if to_date:
            query = query.filter(NormalizedPrice.trade_date <= to_date)
        if expiry_date:
            query = query.filter(NormalizedPrice.expiry_date == expiry_date)

        query = query.order_by(NormalizedPrice.trade_date.asc(), NormalizedPrice.symbol.asc())
        records = query.all()
        return [r.to_dict() for r in records]
