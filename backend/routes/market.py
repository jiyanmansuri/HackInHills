"""
Market and Quant Analytics REST Endpoints.
Commodity Derivatives Intelligence
"""

import logging
from flask import Blueprint, jsonify, request
from backend.analytics.normalizer import get_normalized_prices
from backend.analytics.relative_value import get_relative_value_snapshot
from backend.analytics.term_structure import get_term_structure, get_contract_calendar
from backend.analytics.attribution import compute_performance_attribution

logger = logging.getLogger(__name__)
market_bp = Blueprint("market", __name__)


@market_bp.route("/api/prices/normalized", methods=["GET"])
def normalized_prices_route():
    """
    Query normalized per-gram prices across contracts.
    Query params:
        symbols: Comma-separated symbols (e.g. 'GOLDM,GOLDTEN,GOLDGUINEA,GOLDPETAL')
        from: Start date YYYY-MM-DD
        to: End date YYYY-MM-DD
        expiry: Specific contract expiry date YYYY-MM-DD
    """
    try:
        symbols_raw = request.args.get("symbols")
        symbols = [s.strip().upper() for s in symbols_raw.split(",")] if symbols_raw else None
        from_date = request.args.get("from")
        to_date = request.args.get("to")
        expiry = request.args.get("expiry")

        data = get_normalized_prices(
            symbols=symbols,
            from_date=from_date,
            to_date=to_date,
            expiry_date=expiry
        )
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in /api/prices/normalized: {e}")
        return jsonify({"error": str(e)}), 500


@market_bp.route("/api/relative-value", methods=["GET"])
def relative_value_route():
    """
    Get relative-value snapshot for each contract vs benchmark GOLDM.
    Query params:
        date: Target trade date (optional, defaults to latest)
    """
    try:
        target_date = request.args.get("date")
        snapshot = get_relative_value_snapshot(target_date=target_date)
        return jsonify(snapshot), 200
    except Exception as e:
        logger.error(f"Error in /api/relative-value: {e}")
        return jsonify({"error": str(e)}), 500


@market_bp.route("/api/term-structure", methods=["GET"])
def term_structure_route():
    """
    Get forward term structure curve and annualized carry for a contract.
    Query params:
        symbol: Contract symbol (e.g. 'GOLDM', 'GOLDTEN', default 'GOLDM')
        date: Target trade date (optional, defaults to latest)
    """
    try:
        symbol = request.args.get("symbol", "GOLDM").strip().upper()
        target_date = request.args.get("date")
        curve_data = get_term_structure(symbol=symbol, target_date=target_date)
        return jsonify(curve_data), 200
    except Exception as e:
        logger.error(f"Error in /api/term-structure: {e}")
        return jsonify({"error": str(e)}), 500


@market_bp.route("/api/calendar", methods=["GET"])
def contract_calendar_route():
    """
    Get contract calendar with days to expiry, roll alerts, and liquidity.
    Query params:
        date: Target trade date (optional, defaults to latest)
    """
    try:
        target_date = request.args.get("date")
        calendar = get_contract_calendar(target_date=target_date)
        return jsonify(calendar), 200
    except Exception as e:
        logger.error(f"Error in /api/calendar: {e}")
        return jsonify({"error": str(e)}), 500


@market_bp.route("/api/attribution", methods=["GET"])
def attribution_route():
    """
    Get return attribution decomposing spread alpha vs gold beta.
    Query params:
        date: Target trade date (optional, defaults to latest)
    """
    try:
        target_date = request.args.get("date")
        attribution = compute_performance_attribution(target_date=target_date)
        return jsonify(attribution), 200
    except Exception as e:
        logger.error(f"Error in /api/attribution: {e}")
        return jsonify({"error": str(e)}), 500
