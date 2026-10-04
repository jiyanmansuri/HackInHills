"""
Flask Application Factory for Commodity Derivatives Intelligence.
Hack in Hills '26 - Team Holyknight
"""

import logging
from flask import Flask, jsonify
from flask_cors import CORS
from backend.database.connection import init_db
from backend.routes.ingestion import ingestion_bp
from backend.routes.market import market_bp
from backend.routes.intelligence import intelligence_bp
from backend.routes.explanation import explanation_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app():
    """Create and configure the Flask REST application."""
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize database tables and seed static specs
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error initializing database during startup: {e}")

    # Register Blueprints
    app.register_blueprint(ingestion_bp)
    app.register_blueprint(market_bp)
    app.register_blueprint(intelligence_bp)
    app.register_blueprint(explanation_bp)

    # Global JSON error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "status_code": 404}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "status_code": 500}), 500

    return app


app = create_app()

if __name__ == "__main__":
    from backend.config import API_PORT, API_DEBUG
    logger.info(f"Starting Commodity Derivatives Intelligence API on port {API_PORT}...")
    app.run(host="0.0.0.0", port=API_PORT, debug=API_DEBUG)
