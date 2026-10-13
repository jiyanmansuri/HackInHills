"""
Machine Learning Signals and Walk-Forward Backtesting REST Endpoints.
Commodity Derivatives Intelligence
"""

import logging
from flask import Blueprint, jsonify, request
from backend.ml.signal_filter import get_active_signals
from backend.ml.walk_forward import get_backtest_summary, get_backtest_trades, run_walk_forward_backtest

logger = logging.getLogger(__name__)
intelligence_bp = Blueprint("intelligence", __name__)


@intelligence_bp.route("/api/signals", methods=["GET"])
def signals_route():
    """
    Get active daily ML relative-value signals and disciplined stay-quiet status.
    Query params:
        date: Target trade date (optional, defaults to latest)
    """
    try:
        target_date = request.args.get("date")
        data = get_active_signals(target_date=target_date)
        return jsonify(data), 200
    except Exception as e:
        logger.error(f"Error in /api/signals: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route("/api/backtest/summary", methods=["GET"])
def backtest_summary_route():
    """
    Get out-of-sample walk-forward backtest summary, performance metrics, and equity curve.
    Query params:
        date: Target trade date (optional, defaults to full period)
    """
    try:
        target_date = request.args.get("date")
        summary = get_backtest_summary(target_date=target_date)
        return jsonify(summary), 200
    except Exception as e:
        logger.error(f"Error in /api/backtest/summary: {e}")
        return jsonify({"error": str(e)}), 500


@intelligence_bp.route("/api/backtest/trades", methods=["GET"])
def backtest_trades_route():
    """
    Get out-of-sample simulated trades list.
    Query params:
        limit: Max trades to return (default 100)
        date: Target trade date (optional)
    """
    try:
        limit = int(request.args.get("limit", 100))
        target_date = request.args.get("date")
        trades = get_backtest_trades(limit=limit, target_date=target_date)
        return jsonify(trades), 200
    except Exception as e:
        logger.error(f"Error in /api/backtest/trades: {e}")
        return jsonify({"error": str(e)}), 500
