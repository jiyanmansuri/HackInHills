"""
Quant Analytics Engine: Normalization, Relative Value, Term Structure, and Attribution.
Hack in Hills '26 - Team Holyknight
"""

from backend.analytics.normalizer import compute_and_store_normalized_prices
from backend.analytics.relative_value import compute_and_store_spreads
from backend.analytics.term_structure import get_term_structure, get_contract_calendar
from backend.analytics.attribution import compute_performance_attribution

__all__ = [
    "compute_and_store_normalized_prices",
    "compute_and_store_spreads",
    "get_term_structure",
    "get_contract_calendar",
    "compute_performance_attribution"
]
