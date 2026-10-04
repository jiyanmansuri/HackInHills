"""
Database Seed and Synthetic Pipeline Orchestrator.
Usage: python -m backend.seed or python backend/seed.py
Hack in Hills '26 - Team Holyknight
"""

import sys
import logging
from pathlib import Path

# Ensure repo root is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.database.connection import init_db
from backend.ingest.synthetic import generate_synthetic_bhavcopy
from backend.ingest.csv_loader import ingest_dataframe
from backend.ingest.validator import validate_and_clean_bhavcopy, get_data_quality_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("seed")


def run_seed():
    """Execute complete initial seeding and data ingestion."""
    logger.info("==================================================")
    logger.info("SEEDING COMMODITY DERIVATIVES INTELLIGENCE ENGINE")
    logger.info("==================================================")

    # 1. Initialize tables and static specs
    init_db()

    # 2. Generate 12 months of synthetic Bhavcopy data
    logger.info("Generating ~12 months (252 trading days) of multi-contract MCX gold futures data...")
    df_synthetic = generate_synthetic_bhavcopy(num_days=252, seed=42)
    logger.info(f"Generated {len(df_synthetic)} total contract settlement rows across 4 symbols.")

    # Save to data/seed/ for reproducibility
    seed_dir = ROOT_DIR / "data" / "seed"
    seed_dir.mkdir(parents=True, exist_ok=True)
    seed_csv_path = seed_dir / "mcx_gold_synthetic_bhavcopy.csv"
    df_synthetic.to_csv(seed_csv_path, index=False)
    logger.info(f"Saved baseline Bhavcopy dataset to: {seed_csv_path}")

    # 3. Ingest into bhavcopy_raw
    logger.info("Ingesting generated records into bhavcopy_raw table...")
    raw_count = ingest_dataframe(df_synthetic, source_file="synthetic_generator_v1")
    logger.info(f"Ingested {raw_count} records into bhavcopy_raw.")

    # 4. Run validation and clean to bhavcopy_clean
    logger.info("Validating expiries, deduplicating, and tagging thin-liquidity regimes...")
    val_stats = validate_and_clean_bhavcopy()
    logger.info(f"Validation statistics: {val_stats}")

    # 5. Normalize all prices to per-gram basis
    from backend.analytics.normalizer import compute_and_store_normalized_prices
    from backend.analytics.relative_value import compute_and_store_spreads

    logger.info("Normalizing all contracts to INR per gram baseline...")
    norm_count = compute_and_store_normalized_prices()
    logger.info(f"Stored {norm_count} normalized price records.")

    # 6. Compute pairwise relative value spreads and rolling z-scores vs GOLDM
    logger.info("Computing cross-contract relative value spreads and rolling 30d z-scores...")
    spread_count = compute_and_store_spreads()
    logger.info(f"Stored {spread_count} relative-value spread records.")

    # 7. Run Walk-Forward Out-of-Sample Backtesting Engine
    from backend.ml.walk_forward import run_walk_forward_backtest
    from backend.ml.signal_filter import evaluate_daily_signals

    logger.info("Executing Walk-Forward backtest (Strictly out-of-sample expanding windows)...")
    bt_res = run_walk_forward_backtest(train_window_days=80, test_window_days=20, model_type="xgboost")
    logger.info(f"Backtest completed: {bt_res.get('total_trades', 0)} OOS trades | Win Rate: {bt_res.get('win_rate', 0):.1%} | Sharpe: {bt_res.get('sharpe_ratio', 0)}")

    # 8. Evaluate Today's ML Signals with Signal Discipline
    logger.info("Evaluating daily ML signals and permission-to-stay-quiet regimes...")
    sig_count = evaluate_daily_signals()
    logger.info(f"Generated {sig_count} contract signals for latest session.")

    # 9. Output Data Quality Audit
    quality = get_data_quality_report()
    logger.info("---------------- DATA QUALITY AUDIT ----------------")
    logger.info(f"Health Score: {quality['health_score']}% ({quality['status']})")
    logger.info(f"Clean Records: {quality['total_clean_rows']} across {quality['trading_days']} trading days")
    logger.info(f"Date Range: {quality['start_date']} to {quality['end_date']}")
    logger.info(f"Thin Liquidity Tagged: {quality['thin_liquidity_count']} ({quality['thin_liquidity_pct']}%)")
    for sym, stats in quality["symbols"].items():
        logger.info(f"  [{sym}] Records: {stats['records']} | Avg Vol: {stats['avg_volume']} | Avg OI: {stats['avg_oi']} | Thin: {stats['thin_pct']}%")
    logger.info("==================================================")
    logger.info("PHASE 3 SEED COMPLETED SUCCESSFULLY.")
    logger.info("==================================================")


if __name__ == "__main__":
    run_seed()
