"""
Single Source of Truth Configuration for Commodity Derivatives Intelligence (CDI).
Commodity Derivatives Intelligence
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env if present
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# -----------------------------------------------------------------------------
# CONTRACT SPECIFICATIONS (Single Source of Truth)
# -----------------------------------------------------------------------------
# Contract Size: Physical quantity delivered/settled per lot in grams (g)
# Quotation Base: Quantity in grams corresponding to the traded price quotation
# Tick Size: Minimum price movement per quotation unit
# Purity: Fineness standard (995 = 99.5%, 999 = 99.9%)
CONTRACT_SPECS = {
    "GOLDM": {
        "symbol": "GOLDM",
        "name": "Gold Mini Futures",
        "contract_size_g": 100.0,
        "quotation_base_g": 10.0,  # TODO: verify against MCX contract specs (quoted per 10 grams)
        "purity": 0.995,
        "tick_size": 1.0,
        "trading_unit": "100 grams",
        "quote_unit": "INR / 10g",
        "lot_size": 1,
        "delivery_type": "Compulsory Delivery / Cash Settled",
    },
    "GOLDTEN": {
        "symbol": "GOLDTEN",
        "name": "Gold Ten Futures",
        "contract_size_g": 10.0,
        "quotation_base_g": 1.0,   # TODO: verify against MCX contract specs (quoted per 1 gram)
        "purity": 0.995,
        "tick_size": 0.5,
        "trading_unit": "10 grams",
        "quote_unit": "INR / 1g",
        "lot_size": 1,
        "delivery_type": "Compulsory Delivery / Cash Settled",
    },
    "GOLDGUINEA": {
        "symbol": "GOLDGUINEA",
        "name": "Gold Guinea Futures",
        "contract_size_g": 8.0,
        "quotation_base_g": 8.0,   # TODO: verify against MCX contract specs (quoted per 8 grams / 1 guinea)
        "purity": 0.995,
        "tick_size": 1.0,
        "trading_unit": "8 grams",
        "quote_unit": "INR / 8g",
        "lot_size": 1,
        "delivery_type": "Compulsory Delivery / Cash Settled",
    },
    "GOLDPETAL": {
        "symbol": "GOLDPETAL",
        "name": "Gold Petal Futures",
        "contract_size_g": 1.0,
        "quotation_base_g": 1.0,   # TODO: verify against MCX contract specs (quoted per 1 gram)
        "purity": 0.999,
        "tick_size": 1.0,
        "trading_unit": "1 gram",
        "quote_unit": "INR / 1g",
        "lot_size": 1,
        "delivery_type": "Compulsory Delivery / Cash Settled",
    }
}

# Reference Benchmark Contract for Cross-Contract Analysis
REFERENCE_SYMBOL = "GOLDM"

# -----------------------------------------------------------------------------
# LIQUIDITY AND THRESHOLD PARAMETERS
# -----------------------------------------------------------------------------
# Thin-liquidity thresholds for flagging and signal suppression
THIN_LIQUIDITY_THRESHOLDS = {
    "GOLDM": {"min_volume": 100, "min_oi": 250},
    "GOLDTEN": {"min_volume": 50, "min_oi": 150},
    "GOLDGUINEA": {"min_volume": 30, "min_oi": 100},
    "GOLDPETAL": {"min_volume": 40, "min_oi": 120}
}

DEFAULT_THIN_VOLUME = 50
DEFAULT_THIN_OI = 100

# Roll window definition: days prior to expiry considered tender/roll period
ROLL_WINDOW_DAYS = 5

# Quant parameters
DEFAULT_ZSCORE_WINDOW = 30
DEFAULT_REVERSION_DAYS = 5
TRANSACTION_COST_BPS = 3.0  # 3 bps (0.03%) round-trip estimated cost

# ML Model confidence cutoff for actionable signals
ML_CONFIDENCE_THRESHOLD = 0.62

# -----------------------------------------------------------------------------
# DATABASE AND STORAGE CONFIGURATION
# -----------------------------------------------------------------------------
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SQLITE_PATH = DATA_DIR / "cdi_local.db"

# Automatic fallback: if SUPABASE_URL or DATABASE_URL is not set, use SQLite
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("DATABASE_URL")
if SUPABASE_URL and SUPABASE_URL.strip():
    DATABASE_URI = SUPABASE_URL.strip()
    DB_TYPE = "postgresql"
else:
    # Use SQLite URI
    DATABASE_URI = f"sqlite:///{SQLITE_PATH.as_posix()}"
    DB_TYPE = "sqlite"

# -----------------------------------------------------------------------------
# AI EXPLANATION ENGINE
# -----------------------------------------------------------------------------
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022").strip()

# Flask API settings
API_PORT = int(os.getenv("PORT", 5000))
API_DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
