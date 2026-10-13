"""
AI Signal Explanation REST Endpoint.
Commodity Derivatives Intelligence
"""

import logging
from flask import Blueprint, jsonify, request
from backend.explain.claude_client import explain_signal

logger = logging.getLogger(__name__)
explanation_bp = Blueprint("explanation", __name__)


@explanation_bp.route("/api/explain", methods=["POST"])
def explain_route():
    """
    Generate trader-friendly qualitative explanation, risks, and invalidation rules for a signal.
    Accepts JSON payload of signal parameters.
    """
    try:
        payload = request.get_json(force=True, silent=True) or {}
        if not payload:
            return jsonify({"error": "Missing JSON signal payload"}), 400

        result = explain_signal(payload)
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error in /api/explain: {e}")
        return jsonify({"error": str(e)}), 500
