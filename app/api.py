import datetime as dt
import json
import time

from flask import Blueprint, Response, current_app, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    decode_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import func
from werkzeug.security import check_password_hash, generate_password_hash

from app.models_db import Feedback, PrivacySetting, ScanRecord, ThreatAlert, User, UserProfile, ThreatReport, UserFeedback, db
from app.services.model_service import ModelServiceError

api_bp = Blueprint("api", __name__)


def _get_model_service():
    return current_app.extensions["model_service"]


def _identity_to_int(identity):
    if identity is None:
        return None
    try:
        return int(identity)
    except Exception:
        return None


def _current_user(optional: bool = False):
    identity = _identity_to_int(get_jwt_identity())
    if identity is None:
        if optional:
            return None
        return None
    return User.query.get(identity)


def _severity_from_risk(risk_score: float) -> str:
    score = float(risk_score)
    if score >= 85:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def _excerpt(value: str, max_len: int = 240) -> str:
    text = str(value or "").strip()
    if len(text) <= max_len:
        return text
    return f"{text[:max_len]}..."


def _serialize_user(user: User) -> dict:
    profile = user.profile or UserProfile(user_id=user.id)
    privacy = user.privacy or PrivacySetting(user_id=user.id)

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat(),
        "profile": {
            "avatar_url": profile.avatar_url,
            "role": profile.role,
            "company": profile.company,
            "location": profile.location,
            "phone": profile.phone,
            "bio": profile.bio,
        },
        "privacy": {
            "two_factor_enabled": privacy.two_factor_enabled,
            "email_alerts": privacy.email_alerts,
            "sms_alerts": privacy.sms_alerts,
            "share_anonymized_analytics": privacy.share_anonymized_analytics,
            "data_retention_days": privacy.data_retention_days,
            "profile_visibility": privacy.profile_visibility,
        },
    }


def _save_scan(user_id: int | None, scan_type: str, input_excerpt: str, result: dict) -> ScanRecord:
    severity = _severity_from_risk(result.get("risk_score", 0.0))

    record = ScanRecord(
        user_id=user_id,
        scan_type=scan_type,
        input_excerpt=_excerpt(input_excerpt),
        verdict=result.get("verdict", "UNKNOWN"),
        severity=severity,
        confidence=float(result.get("confidence", 0.0)),
        risk_score=float(result.get("risk_score", 0.0)),
        details=result.get("details", {}),
    )

    db.session.add(record)
    db.session.flush()

    if severity in {"high", "critical"}:
        alert = ThreatAlert(
            scan_record_id=record.id,
            severity=severity,
            title=f"{scan_type.upper()} Threat Detected",
            message=f"{scan_type.upper()} scan flagged {record.verdict} with {record.risk_score:.2f}% risk.",
        )
        db.session.add(alert)

    db.session.commit()
    return record


def _scan_response(record: ScanRecord) -> dict:
    return {
        "id": record.id,
        "scan_type": record.scan_type,
        "verdict": record.verdict,
        "severity": record.severity,
        "confidence": round(record.confidence, 4),
        "risk_score": round(record.risk_score, 2),
        "details": record.details,
        "input_excerpt": record.input_excerpt,
        "created_at": record.created_at.isoformat(),
    }


@api_bp.errorhandler(ModelServiceError)
def handle_model_error(exc: ModelServiceError):
    return jsonify({"error": str(exc)}), 400


@api_bp.route("/health", methods=["GET"])
def health_check():
    model_status = _get_model_service().get_status()
    return jsonify(
        {
            "status": "ok",
            "timestamp": dt.datetime.utcnow().isoformat(),
            "models": model_status,
        }
    )


@api_bp.route("/auth/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))
    full_name = str(payload.get("full_name", "")).strip() or "Scam Defender User"

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "password must be at least 8 characters"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "user already exists"}), 409

    user = User(email=email, password_hash=generate_password_hash(password), full_name=full_name)
    db.session.add(user)
    db.session.flush()

    db.session.add(UserProfile(user_id=user.id))
    db.session.add(PrivacySetting(user_id=user.id))
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": _serialize_user(user)}), 201


@api_bp.route("/auth/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": _serialize_user(user)})


@api_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def me():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"user": _serialize_user(user)})


@api_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404
    return jsonify({"profile": _serialize_user(user)["profile"], "full_name": user.full_name})


@api_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    payload = request.get_json(silent=True) or {}
    profile = user.profile or UserProfile(user_id=user.id)

    user.full_name = str(payload.get("full_name", user.full_name)).strip() or user.full_name
    profile.avatar_url = str(payload.get("avatar_url", profile.avatar_url))
    profile.role = str(payload.get("role", profile.role))
    profile.company = str(payload.get("company", profile.company))
    profile.location = str(payload.get("location", profile.location))
    profile.phone = str(payload.get("phone", profile.phone))
    profile.bio = str(payload.get("bio", profile.bio))

    db.session.add(profile)
    db.session.commit()

    return jsonify({"user": _serialize_user(user)})


@api_bp.route("/settings/privacy", methods=["GET"])
@jwt_required()
def get_privacy_settings():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    privacy = user.privacy or PrivacySetting(user_id=user.id)
    db.session.add(privacy)
    db.session.commit()

    return jsonify({"privacy": _serialize_user(user)["privacy"]})


@api_bp.route("/settings/privacy", methods=["PUT"])
@jwt_required()
def update_privacy_settings():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    payload = request.get_json(silent=True) or {}
    privacy = user.privacy or PrivacySetting(user_id=user.id)

    privacy.two_factor_enabled = bool(payload.get("two_factor_enabled", privacy.two_factor_enabled))
    privacy.email_alerts = bool(payload.get("email_alerts", privacy.email_alerts))
    privacy.sms_alerts = bool(payload.get("sms_alerts", privacy.sms_alerts))
    privacy.share_anonymized_analytics = bool(
        payload.get("share_anonymized_analytics", privacy.share_anonymized_analytics)
    )
    privacy.profile_visibility = str(payload.get("profile_visibility", privacy.profile_visibility))

    retention_days = int(payload.get("data_retention_days", privacy.data_retention_days))
    privacy.data_retention_days = max(7, min(3650, retention_days))

    db.session.add(privacy)
    db.session.commit()

    return jsonify({"privacy": _serialize_user(user)["privacy"]})


@api_bp.route("/feedback", methods=["POST"])
@jwt_required(optional=True)
def submit_feedback():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()
    if not message:
        return jsonify({"error": "feedback message is required"}), 400

    identity = _identity_to_int(get_jwt_identity())

    entry = Feedback(
        user_id=identity,
        category=str(payload.get("category", "general")),
        rating=max(1, min(5, int(payload.get("rating", 5)))),
        subject=str(payload.get("subject", "")),
        message=message,
        contact_email=str(payload.get("contact_email", "")),
    )

    db.session.add(entry)
    db.session.commit()

    return jsonify({"message": "feedback submitted", "feedback_id": entry.id}), 201


@api_bp.route("/feedback", methods=["GET"])
@jwt_required()
def list_feedback():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    entries = (
        Feedback.query.filter_by(user_id=user.id).order_by(Feedback.created_at.desc()).limit(100).all()
    )

    return jsonify(
        {
            "items": [
                {
                    "id": entry.id,
                    "category": entry.category,
                    "rating": entry.rating,
                    "subject": entry.subject,
                    "message": entry.message,
                    "created_at": entry.created_at.isoformat(),
                }
                for entry in entries
            ]
        }
    )


@api_bp.route("/scan/email", methods=["POST"])
@jwt_required(optional=True)
def scan_email():
    payload = request.get_json(silent=True) or {}
    subject = str(payload.get("subject", ""))
    message = str(payload.get("message", ""))

    result = _get_model_service().predict_email(subject, message)
    identity = _identity_to_int(get_jwt_identity())
    record = _save_scan(identity, "email", f"{subject}\n{message}", result)
    return jsonify(_scan_response(record)), 200


@api_bp.route("/scan/message", methods=["POST"])
@jwt_required(optional=True)
def scan_message():
    payload = request.get_json(silent=True) or {}
    message_text = str(payload.get("message", ""))

    result = _get_model_service().predict_message(message_text)
    identity = _identity_to_int(get_jwt_identity())
    record = _save_scan(identity, "message", message_text, result)
    return jsonify(_scan_response(record)), 200


@api_bp.route("/scan/url", methods=["POST"])
@jwt_required(optional=True)
def scan_url():
    payload = request.get_json(silent=True) or {}
    url = str(payload.get("url", ""))

    result = _get_model_service().predict_url(url)
    identity = _identity_to_int(get_jwt_identity())
    record = _save_scan(identity, "url", url, result)
    return jsonify(_scan_response(record)), 200


@api_bp.route("/scan/file", methods=["POST"])
@jwt_required(optional=True)
def scan_file():
    if "file" not in request.files:
        return jsonify({"error": "multipart form file is required under key 'file'"}), 400

    uploaded = request.files["file"]
    raw = uploaded.read() if uploaded else b""

    result = _get_model_service().predict_file(raw, filename=getattr(uploaded, "filename", ""))
    identity = _identity_to_int(get_jwt_identity())
    record = _save_scan(identity, "file", getattr(uploaded, "filename", "uploaded_file"), result)
    return jsonify(_scan_response(record)), 200


@api_bp.route("/scan/fraud", methods=["POST"])
@jwt_required(optional=True)
def scan_fraud():
    payload = request.get_json(silent=True) or {}

    result = _get_model_service().predict_fraud(payload)
    identity = _identity_to_int(get_jwt_identity())
    excerpt = json.dumps({
        "type": payload.get("type"),
        "amount": payload.get("amount"),
        "nameOrig": payload.get("nameOrig"),
        "nameDest": payload.get("nameDest"),
    })

    record = _save_scan(identity, "fraud", excerpt, result)
    return jsonify(_scan_response(record)), 200


@api_bp.route("/dashboard/summary", methods=["GET"])
@jwt_required()
def dashboard_summary():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    now = dt.datetime.utcnow()
    seven_days_ago = now - dt.timedelta(days=7)

    base_query = ScanRecord.query.filter_by(user_id=user.id)

    total_scans = base_query.count()
    threat_scans = base_query.filter(ScanRecord.severity.in_(["high", "critical"])).count()
    recent_scans = base_query.filter(ScanRecord.created_at >= seven_days_ago).count()

    by_type_rows = (
        db.session.query(ScanRecord.scan_type, func.count(ScanRecord.id))
        .filter(ScanRecord.user_id == user.id)
        .group_by(ScanRecord.scan_type)
        .all()
    )

    by_severity_rows = (
        db.session.query(ScanRecord.severity, func.count(ScanRecord.id))
        .filter(ScanRecord.user_id == user.id)
        .group_by(ScanRecord.severity)
        .all()
    )

    unresolved_alerts = (
        ThreatAlert.query.join(ScanRecord)
        .filter(ScanRecord.user_id == user.id, ThreatAlert.acknowledged.is_(False))
        .count()
    )

    return jsonify(
        {
            "totals": {
                "total_scans": total_scans,
                "threat_scans": threat_scans,
                "recent_scans_7d": recent_scans,
                "open_alerts": unresolved_alerts,
            },
            "by_type": {key: value for key, value in by_type_rows},
            "by_severity": {key: value for key, value in by_severity_rows},
        }
    )


@api_bp.route("/dashboard/history", methods=["GET"])
@jwt_required()
def dashboard_history():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    limit = max(1, min(200, int(request.args.get("limit", 50))))

    items = (
        ScanRecord.query.filter_by(user_id=user.id)
        .order_by(ScanRecord.created_at.desc())
        .limit(limit)
        .all()
    )

    return jsonify({"items": [_scan_response(item) for item in items]})


@api_bp.route("/alerts", methods=["GET"])
@jwt_required()
def list_alerts():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    alerts = (
        ThreatAlert.query.join(ScanRecord)
        .filter(ScanRecord.user_id == user.id)
        .order_by(ThreatAlert.created_at.desc())
        .limit(100)
        .all()
    )

    return jsonify(
        {
            "items": [
                {
                    "id": alert.id,
                    "scan_record_id": alert.scan_record_id,
                    "severity": alert.severity,
                    "title": alert.title,
                    "message": alert.message,
                    "acknowledged": alert.acknowledged,
                    "created_at": alert.created_at.isoformat(),
                }
                for alert in alerts
            ]
        }
    )


@api_bp.route("/alerts/<int:alert_id>/ack", methods=["PATCH"])
@jwt_required()
def acknowledge_alert(alert_id: int):
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found"}), 404

    alert = (
        ThreatAlert.query.join(ScanRecord)
        .filter(ThreatAlert.id == alert_id, ScanRecord.user_id == user.id)
        .first()
    )

    if alert is None:
        return jsonify({"error": "alert not found"}), 404

    alert.acknowledged = True
    db.session.commit()

    return jsonify({"message": "alert acknowledged", "alert_id": alert.id})


@api_bp.route("/stream/alerts", methods=["GET"])
def stream_alerts():
    token = request.args.get("token", "")
    user_id = None

    if token:
        try:
            decoded = decode_token(token)
            user_id = _identity_to_int(decoded.get("sub"))
        except Exception:
            return jsonify({"error": "invalid stream token"}), 401

    since_id = int(request.args.get("since", 0))

    def event_generator(last_seen_id: int):
        cursor = last_seen_id
        while True:
            query = ThreatAlert.query.join(ScanRecord).filter(ThreatAlert.id > cursor)
            if user_id is not None:
                query = query.filter(ScanRecord.user_id == user_id)

            batch = query.order_by(ThreatAlert.id.asc()).limit(20).all()
            if batch:
                for alert in batch:
                    payload = {
                        "id": alert.id,
                        "scan_record_id": alert.scan_record_id,
                        "severity": alert.severity,
                        "title": alert.title,
                        "message": alert.message,
                        "acknowledged": alert.acknowledged,
                        "created_at": alert.created_at.isoformat(),
                    }
                    yield f"event: alert\ndata: {json.dumps(payload)}\n\n"
                cursor = batch[-1].id
            else:
                yield "event: ping\ndata: {}\n\n"

            time.sleep(3)

    return Response(event_generator(since_id), mimetype="text/event-stream")


@api_bp.route("/models/status", methods=["GET"])
def model_status():
    return jsonify({"models": _get_model_service().get_status()})


# Threat Reporting and Feedback Endpoints

@api_bp.route("/report-threat", methods=["POST"])
@jwt_required()
def report_threat():
    user = _current_user()
    data = request.get_json()
    
    if not data:
        return jsonify({"msg": "No data provided"}), 400
    
    # Extract required fields
    content_type = data.get("contentType")
    comment = data.get("comment", "")
    is_urgent = data.get("isUrgent", False)
    original_result = data.get("originalResult", {})
    scan_type = data.get("scanType")
    
    if not content_type:
        return jsonify({"msg": "Content type is required"}), 400
    
    # Extract content from original result
    content = ""
    if scan_type == "url" and original_result.get("url"):
        content = original_result["url"]
    elif scan_type == "email" and original_result.get("subject"):
        content = f"Subject: {original_result['subject']}"
        if original_result.get("message"):
            content += f"\n{original_result['message']}"
    elif scan_type == "message" and original_result.get("message_text"):
        content = original_result["message_text"]
    elif scan_type == "file" and original_result.get("filename"):
        content = original_result["filename"]
    
    # Check if this content has already been reported
    existing_report = ThreatReport.query.filter_by(
        content_type=content_type,
        content=content
    ).first()
    
    if existing_report:
        # Increment report count
        existing_report.report_count += 1
        if is_urgent:
            existing_report.is_urgent = True
        if comment:
            existing_report.comment = f"{existing_report.comment or ''}\n\nAdditional report: {comment}"
        db.session.commit()
        
        return jsonify({
            "msg": "Threat report added to existing report",
            "report_id": existing_report.id,
            "report_count": existing_report.report_count
        })
    
    # Create new threat report
    report = ThreatReport(
        user_id=user.id if user else None,
        content_type=content_type,
        content=content,
        original_result=original_result,
        comment=comment,
        is_urgent=is_urgent,
        reporter_name=user.full_name if user else "Anonymous User"
    )
    
    db.session.add(report)
    db.session.commit()
    
    return jsonify({
        "msg": "Threat report submitted successfully",
        "report_id": report.id
    })


@api_bp.route("/feedback/mark-safe", methods=["POST"])
@jwt_required()
def mark_as_safe():
    user = _current_user()
    data = request.get_json()
    
    if not data:
        return jsonify({"msg": "No data provided"}), 400
    
    scan_type = data.get("scanType")
    original_result = data.get("originalResult", {})
    
    if not scan_type or not original_result:
        return jsonify({"msg": "Scan type and original result are required"}), 400
    
    # Create user feedback entry
    feedback = UserFeedback(
        user_id=user.id,
        scan_type=scan_type,
        original_result=original_result,
        feedback_type="mark_safe",
        comment="User marked this as safe",
        training_priority=3  # Medium priority for ML improvement
    )
    
    db.session.add(feedback)
    db.session.commit()
    
    return jsonify({
        "msg": "Feedback recorded. Thank you for helping improve Scam Defender!",
        "feedback_id": feedback.id
    })


@api_bp.route("/community/threats", methods=["GET"])
def community_threats():
    # Get query parameters
    status_filter = request.args.get("status", "all")
    limit = min(int(request.args.get("limit", 50)), 100)
    
    # Build query
    query = ThreatReport.query
    
    if status_filter != "all":
        query = query.filter_by(status=status_filter)
    
    # Get recent threats
    threats = query.order_by(ThreatReport.created_at.desc()).limit(limit).all()
    
    # Calculate stats
    today = dt.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    stats = {
        "reportedToday": ThreatReport.query.filter(ThreatReport.created_at >= today).count(),
        "confirmedThreats": ThreatReport.query.filter_by(status="confirmed").count(),
        "underReview": ThreatReport.query.filter_by(status="pending").count()
    }
    
    # Format threats
    threat_data = []
    for threat in threats:
        threat_data.append({
            "id": threat.id,
            "contentType": threat.content_type,
            "content": threat.content,
            "status": threat.status,
            "reportCount": threat.report_count,
            "isUrgent": threat.is_urgent,
            "reportedAt": threat.created_at.isoformat(),
            "reporter": threat.reporter_name,
            "comment": threat.comment
        })
    
    return jsonify({
        "threats": threat_data,
        "stats": stats
    })


@api_bp.route("/admin/review-reports", methods=["GET"])
@jwt_required()
def review_reports():
    user = _current_user()
    
    # Check if user is admin (you might want to add an admin role to User model)
    if not user or not user.email.endswith("@admin.com"):  # Simple admin check
        return jsonify({"msg": "Admin access required"}), 403
    
    # Get pending reports
    pending_reports = ThreatReport.query.filter_by(status="pending").order_by(
        ThreatReport.is_urgent.desc(),
        ThreatReport.report_count.desc(),
        ThreatReport.created_at.desc()
    ).limit(20).all()
    
    reports_data = []
    for report in pending_reports:
        reports_data.append({
            "id": report.id,
            "contentType": report.content_type,
            "content": report.content,
            "reportCount": report.report_count,
            "isUrgent": report.is_urgent,
            "reportedAt": report.created_at.isoformat(),
            "reporter": report.reporter_name,
            "comment": report.comment,
            "originalResult": report.original_result
        })
    
    return jsonify({
        "reports": reports_data
    })


@api_bp.route("/admin/review-report/<int:report_id>", methods=["POST"])
@jwt_required()
def review_report(report_id):
    user = _current_user()
    
    # Check if user is admin
    if not user or not user.email.endswith("@admin.com"):
        return jsonify({"msg": "Admin access required"}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({"msg": "No data provided"}), 400
    
    action = data.get("action")  # "confirm" or "mark_false_positive"
    notes = data.get("notes", "")
    
    report = ThreatReport.query.get_or_404(report_id)
    
    if action == "confirm":
        report.status = "confirmed"
        report.reviewed_by = user.id
        report.reviewed_at = dt.datetime.utcnow()
        report.review_notes = notes
        report.added_to_training = True
        report.training_data_quality = 4  # Good quality data
    elif action == "mark_false_positive":
        report.status = "false_positive"
        report.reviewed_by = user.id
        report.reviewed_at = dt.datetime.utcnow()
        report.review_notes = notes
    else:
        return jsonify({"msg": "Invalid action"}), 400
    
    db.session.commit()
    
    return jsonify({
        "msg": f"Report marked as {report.status}",
        "status": report.status
    })


if __name__ == "__main__":
    from app import create_app

    flask_app = create_app()
    flask_app.run(host="0.0.0.0", port=5000, debug=True)
