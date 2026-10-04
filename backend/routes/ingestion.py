"""
Ingestion, Health, and Data Quality Endpoints.
Hack in Hills '26 - Team Holyknight
"""

import io
from datetime import datetime
from flask import Blueprint, jsonify, request
import pandas as pd
from backend.config import DB_TYPE
from backend.database.connection import get_session
from backend.database.schema import ContractSpec
from backend.ingest.csv_loader import load_bhavcopy_csv, ingest_dataframe
from backend.ingest.validator import validate_and_clean_bhavcopy, get_data_quality_report

ingestion_bp = Blueprint("ingestion", __name__)


@ingestion_bp.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint providing DB status and system timestamp."""
    return jsonify({
        "status": "healthy",
        "app": "Commodity Derivatives Intelligence",
        "version": "1.0.0",
        "database": DB_TYPE,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }), 200


@ingestion_bp.route("/api/contracts", methods=["GET"])
def get_contracts():
    """Return all configured MCX contract specifications."""
    with get_session() as session:
        specs = session.query(ContractSpec).all()
        return jsonify([s.to_dict() for s in specs]), 200


@ingestion_bp.route("/api/data-quality", methods=["GET"])
def data_quality():
    """Return data health report for ingested and validated Bhavcopy records."""
    try:
        report = get_data_quality_report()
        return jsonify(report), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@ingestion_bp.route("/api/upload-bhavcopy", methods=["POST"])
def upload_bhavcopy():
    """
    Accept an uploaded MCX Bhavcopy CSV file or JSON body,
    ingest to bhavcopy_raw, and automatically trigger validation to bhavcopy_clean.
    """
    try:
        if "file" in request.files:
            file = request.files["file"]
            if file.filename == "":
                return jsonify({"error": "No selected file"}), 400

            content = file.read()
            df = pd.read_csv(io.BytesIO(content))
            source_name = file.filename
        elif request.is_json:
            data = request.get_json()
            if not isinstance(data, list) or len(data) == 0:
                return jsonify({"error": "Expected JSON array of records"}), 400
            df = pd.DataFrame(data)
            source_name = "json_payload"
        else:
            return jsonify({"error": "Please provide a file under form field 'file' or JSON body"}), 400

        # Ingest to raw
        inserted = ingest_dataframe(df, source_file=source_name)

        # Validate and clean
        validation_res = validate_and_clean_bhavcopy()
        report = get_data_quality_report()

        return jsonify({
            "status": "success",
            "message": f"Successfully processed {inserted} records from {source_name}",
            "inserted_raw": inserted,
            "validation": validation_res,
            "quality_report": report
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
