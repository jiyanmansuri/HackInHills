"""Data ingestion module for Bhavcopy parsing, synthetic generation, and validation."""
from backend.ingest.synthetic import generate_synthetic_bhavcopy
from backend.ingest.csv_loader import load_bhavcopy_csv, ingest_dataframe
from backend.ingest.validator import validate_and_clean_bhavcopy, get_data_quality_report

__all__ = [
    "generate_synthetic_bhavcopy",
    "load_bhavcopy_csv",
    "ingest_dataframe",
    "validate_and_clean_bhavcopy",
    "get_data_quality_report"
]
