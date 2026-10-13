"""
MCX Bhavcopy CSV Ingestion and Raw Storage.
Commodity Derivatives Intelligence
"""

import io
import logging
from datetime import datetime, date
from pathlib import Path
from typing import Union, BinaryIO
import pandas as pd
from backend.database.connection import get_session
from backend.database.schema import BhavcopyRaw

logger = logging.getLogger(__name__)

# Standard column mapping to handle variations in MCX Bhavcopy files
COLUMN_ALIASES = {
    "symbol": ["symbol", "inst_identifier", "contract_descriptor", "sym"],
    "trade_date": ["date", "trade_date", "tradedate", "timestamp", "session_date"],
    "expiry_date": ["expirydate", "expiry_date", "expiry", "exp_date"],
    "open_price": ["open", "open_price", "openprice"],
    "high_price": ["high", "high_price", "highprice"],
    "low_price": ["low", "low_price", "lowprice"],
    "close_price": ["close", "close_price", "closeprice", "settle_price", "settlementprice"],
    "volume": ["volume", "vol", "qty", "traded_quantity", "volume_contracts"],
    "open_interest": ["openinterest", "open_interest", "oi"]
}


def _standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names regardless of case, underscores, or spaces."""
    clean_cols = {col: col.strip().lower().replace(" ", "").replace("_", "") for col in df.columns}
    normalized_mapping = {}

    for target_col, aliases in COLUMN_ALIASES.items():
        found = False
        alias_clean = [a.replace("_", "").lower() for a in aliases]
        for original_col, clean_name in clean_cols.items():
            if clean_name in alias_clean:
                normalized_mapping[original_col] = target_col
                found = True
                break
        if not found and target_col in ("symbol", "trade_date", "expiry_date", "close_price"):
            raise ValueError(f"Required Bhavcopy column '{target_col}' not found in file headers: {list(df.columns)}")

    return df.rename(columns=normalized_mapping)


def _parse_flexible_date(val: Union[str, date, datetime]) -> date:
    """Parse multiple common date formats into datetime.date."""
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()

    val_str = str(val).strip()
    # Try common formats
    for fmt in ("%Y-%m-%d", "%d-%b-%Y", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d-%B-%Y"):
        try:
            return datetime.strptime(val_str, fmt).date()
        except ValueError:
            continue
    # Fallback to pandas to_datetime
    try:
        return pd.to_datetime(val_str).date()
    except Exception as e:
        raise ValueError(f"Could not parse date string: '{val_str}' - {e}")


def ingest_dataframe(df: pd.DataFrame, source_file: str = "upload") -> int:
    """
    Standardize, validate, and write a DataFrame into bhavcopy_raw table.

    Returns:
        int: Number of raw rows inserted.
    """
    df_std = _standardize_columns(df.copy())

    # Filter to known gold contracts if applicable
    valid_symbols = {"GOLDM", "GOLDTEN", "GOLDGUINEA", "GOLDPETAL"}
    df_std["symbol"] = df_std["symbol"].astype(str).str.strip().str.upper()
    df_std = df_std[df_std["symbol"].isin(valid_symbols)].copy()

    if df_std.empty:
        logger.warning("No recognized gold contract rows found in provided DataFrame.")
        return 0

    records = []
    for _, row in df_std.iterrows():
        try:
            trade_d = _parse_flexible_date(row["trade_date"])
            exp_d = _parse_flexible_date(row["expiry_date"])

            # Clean numeric values
            close_p = float(str(row["close_price"]).replace(",", ""))
            open_p = float(str(row.get("open_price", close_p)).replace(",", "")) if pd.notna(row.get("open_price")) else close_p
            high_p = float(str(row.get("high_price", close_p)).replace(",", "")) if pd.notna(row.get("high_price")) else close_p
            low_p = float(str(row.get("low_price", close_p)).replace(",", "")) if pd.notna(row.get("low_price")) else close_p
            vol = float(str(row.get("volume", 0.0)).replace(",", "")) if pd.notna(row.get("volume")) else 0.0
            oi = float(str(row.get("open_interest", 0.0)).replace(",", "")) if pd.notna(row.get("open_interest")) else 0.0

            record = BhavcopyRaw(
                symbol=row["symbol"],
                trade_date=trade_d,
                expiry_date=exp_d,
                open_price=open_p,
                high_price=high_p,
                low_price=low_p,
                close_price=close_p,
                volume=vol,
                open_interest=oi,
                source_file=source_file
            )
            records.append(record)
        except Exception as e:
            logger.debug(f"Skipping unparseable row: {row.to_dict()} - {e}")
            continue

    # Bulk insert
    with get_session() as session:
        session.bulk_save_objects(records)
        session.commit()

    logger.info(f"Ingested {len(records)} rows into bhavcopy_raw from {source_file}")
    return len(records)


def load_bhavcopy_csv(file_input: Union[str, Path, BinaryIO], source_name: str = "") -> int:
    """Load Bhavcopy from a file path or file stream into bhavcopy_raw."""
    if isinstance(file_input, (str, Path)):
        path = Path(file_input)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        df = pd.read_csv(path)
        source_name = source_name or path.name
    else:
        df = pd.read_csv(file_input)
        source_name = source_name or "stream_upload.csv"

    return ingest_dataframe(df, source_file=source_name)
