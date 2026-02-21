import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.sandbox_service import SandboxService
from app.models_db import db, ScanRecord

LOGGER = logging.getLogger(__name__)

sandbox_bp = Blueprint('sandbox_api', __name__)
sandbox_service = SandboxService()

def _current_user():
    identity = get_jwt_identity()
    if identity is None:
        return None
    return int(identity)

@sandbox_bp.route("/analyze-email", methods=["POST"])
@jwt_required()
def analyze_email():
    """Analyze email content in secure sandbox."""
    try:
        data = request.get_json()
        email_content = data.get("content", "")
        email_headers = data.get("headers", {})
        
        if not email_content.strip():
            return jsonify({
                "status": "error",
                "error": "Email content is required"
            }), 400
        
        # Perform sandbox analysis
        with sandbox_service as sandbox:
            result = sandbox.analyze_email(email_content, email_headers)
            
            # Save scan record to database
            user_id = _current_user()
            if user_id:
                scan_record = ScanRecord(
                    user_id=user_id,
                    scan_type="email",
                    input_excerpt=email_content[:500] + "..." if len(email_content) > 500 else email_content,
                    verdict=result['status'],
                    severity='high' if result['risk_score'] >= 70 else 'medium' if result['risk_score'] >= 40 else 'low',
                    confidence=0.85,
                    risk_score=result['risk_score'],
                    details=str(result['explanation'])[:1000]
                )
                db.session.add(scan_record)
                db.session.commit()
            
            return jsonify(result), 200
            
    except Exception as e:
        LOGGER.error(f"Email analysis error: {e}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@sandbox_bp.route("/analyze-file", methods=["POST"])
@jwt_required()
def analyze_file():
    """Analyze uploaded file in secure sandbox."""
    try:
        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "error": "No file uploaded"
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                "status": "error",
                "error": "No file selected"
            }), 400
        
        # Perform sandbox analysis
        with sandbox_service as sandbox:
            # Save uploaded file temporarily
            import tempfile
            temp_path = sandbox.temp_dir / secure_filename(file.filename)
            file.save(str(temp_path))
            
            result = sandbox.analyze_file(str(temp_path), file.filename)
            
            # Save scan record to database
            user_id = _current_user()
            if user_id:
                scan_record = ScanRecord(
                    user_id=user_id,
                    scan_type="file",
                    input_excerpt=f"File: {file.filename}",
                    verdict=result['status'],
                    severity='high' if result['risk_score'] >= 70 else 'medium' if result['risk_score'] >= 40 else 'low',
                    confidence=0.85,
                    risk_score=result['risk_score'],
                    details=str(result['explanation'])[:1000]
                )
                db.session.add(scan_record)
                db.session.commit()
            
            return jsonify(result), 200
            
    except Exception as e:
        LOGGER.error(f"File analysis error: {e}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@sandbox_bp.route("/sandbox-status", methods=["GET"])
@jwt_required()
def sandbox_status():
    """Get sandbox service status."""
    try:
        return jsonify({
            "status": "active",
            "service": "secure_sandbox",
            "capabilities": [
                "email_analysis",
                "file_analysis",
                "url_scanning",
                "static_analysis",
                "dynamic_analysis",
                "ml_scoring"
            ]
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

@sandbox_bp.route("/analysis-history", methods=["GET"])
@jwt_required()
def analysis_history():
    """Get user's analysis history."""
    try:
        user_id = _current_user()
        if not user_id:
            return jsonify({
                "status": "error",
                "error": "Authentication required"
            }), 401
        
        # Get user's scan records
        scans = ScanRecord.query.filter_by(user_id=user_id).order_by(ScanRecord.created_at.desc()).limit(50).all()
        
        history = []
        for scan in scans:
            history.append({
                "id": scan.id,
                "scan_type": scan.scan_type,
                "verdict": scan.verdict,
                "severity": scan.severity,
                "risk_score": scan.risk_score,
                "input_excerpt": scan.input_excerpt,
                "created_at": scan.created_at.isoformat()
            })
        
        return jsonify({
            "status": "success",
            "history": history,
            "total": len(history)
        }), 200
        
    except Exception as e:
        LOGGER.error(f"Analysis history error: {e}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500
