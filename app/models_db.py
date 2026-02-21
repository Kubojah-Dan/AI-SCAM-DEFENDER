from datetime import datetime

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class TimestampMixin:
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False, default="Scam Defender User")
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    profile = db.relationship("UserProfile", uselist=False, backref="user", cascade="all, delete-orphan")
    privacy = db.relationship("PrivacySetting", uselist=False, backref="user", cascade="all, delete-orphan")
    scans = db.relationship("ScanRecord", backref="user", lazy=True, cascade="all, delete-orphan")
    feedback_entries = db.relationship("Feedback", backref="user", lazy=True, cascade="all, delete-orphan")


class UserProfile(TimestampMixin, db.Model):
    __tablename__ = "user_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    avatar_url = db.Column(db.String(500), nullable=False, default="")
    role = db.Column(db.String(120), nullable=False, default="Security Analyst")
    company = db.Column(db.String(150), nullable=False, default="Independent")
    location = db.Column(db.String(150), nullable=False, default="")
    phone = db.Column(db.String(40), nullable=False, default="")
    bio = db.Column(db.Text, nullable=False, default="")


class PrivacySetting(TimestampMixin, db.Model):
    __tablename__ = "privacy_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    two_factor_enabled = db.Column(db.Boolean, nullable=False, default=False)
    email_alerts = db.Column(db.Boolean, nullable=False, default=True)
    sms_alerts = db.Column(db.Boolean, nullable=False, default=False)
    share_anonymized_analytics = db.Column(db.Boolean, nullable=False, default=True)
    data_retention_days = db.Column(db.Integer, nullable=False, default=90)
    profile_visibility = db.Column(db.String(30), nullable=False, default="private")


class ScanRecord(TimestampMixin, db.Model):
    __tablename__ = "scan_records"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)

    scan_type = db.Column(db.String(30), nullable=False, index=True)
    input_excerpt = db.Column(db.Text, nullable=False, default="")
    verdict = db.Column(db.String(30), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    confidence = db.Column(db.Float, nullable=False, default=0.0)
    risk_score = db.Column(db.Float, nullable=False, default=0.0)
    details = db.Column(db.JSON, nullable=False, default=dict)

    alert = db.relationship("ThreatAlert", uselist=False, backref="scan_record", cascade="all, delete-orphan")


class ThreatAlert(TimestampMixin, db.Model):
    __tablename__ = "threat_alerts"

    id = db.Column(db.Integer, primary_key=True)
    scan_record_id = db.Column(db.Integer, db.ForeignKey("scan_records.id"), nullable=False, unique=True)
    severity = db.Column(db.String(20), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    acknowledged = db.Column(db.Boolean, nullable=False, default=False)


class Feedback(TimestampMixin, db.Model):
    __tablename__ = "feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    category = db.Column(db.String(60), nullable=False, default="general")
    rating = db.Column(db.Integer, nullable=False, default=5)
    subject = db.Column(db.String(160), nullable=False, default="")
    message = db.Column(db.Text, nullable=False)
    contact_email = db.Column(db.String(255), nullable=False, default="")


class ThreatReport(TimestampMixin, db.Model):
    __tablename__ = "threat_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    
    # Content details
    content_type = db.Column(db.String(30), nullable=False)  # url, email, message, file
    content = db.Column(db.Text, nullable=False)
    original_result = db.Column(db.JSON, nullable=True)
    
    # Report details
    status = db.Column(db.String(30), nullable=False, default="pending")  # pending, confirmed, false_positive
    report_count = db.Column(db.Integer, nullable=False, default=1)
    is_urgent = db.Column(db.Boolean, nullable=False, default=False)
    
    # User feedback
    comment = db.Column(db.Text, nullable=True)
    reporter_name = db.Column(db.String(255), nullable=False, default="Anonymous User")
    
    # Review details
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text, nullable=True)
    
    # ML training data
    added_to_training = db.Column(db.Boolean, nullable=False, default=False)
    training_data_quality = db.Column(db.Integer, nullable=True)  # 1-5 rating
    
    # Relationships
    reviewer = db.relationship("User", foreign_keys=[reviewed_by], backref="reviewed_reports")


class UserFeedback(TimestampMixin, db.Model):
    __tablename__ = "user_feedback"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    
    # Original scan/result
    scan_type = db.Column(db.String(30), nullable=False)
    original_result = db.Column(db.JSON, nullable=False)
    
    # User feedback
    feedback_type = db.Column(db.String(30), nullable=False)  # mark_safe, confirm_threat
    comment = db.Column(db.Text, nullable=True)
    
    # System response
    processed = db.Column(db.Boolean, nullable=False, default=False)
    action_taken = db.Column(db.String(100), nullable=True)
    
    # ML improvement
    added_to_training_queue = db.Column(db.Boolean, nullable=False, default=False)
    training_priority = db.Column(db.Integer, nullable=False, default=1)  # 1-5
