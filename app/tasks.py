import os
from datetime import datetime, timedelta

from celery import Celery


def create_celery() -> Celery:
    celery_app = Celery(
        "scam_defender_tasks",
        broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
        backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1"),
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
    )

    return celery_app


celery = create_celery()


@celery.task(name="scam_defender.cleanup_old_scans")
def cleanup_old_scans(retention_days: int = 90) -> int:
    from app import create_app
    from app.models_db import ScanRecord, ThreatAlert, db

    app = create_app()
    with app.app_context():
        cutoff = datetime.utcnow() - timedelta(days=max(7, int(retention_days)))

        stale_alerts = ThreatAlert.query.filter(ThreatAlert.created_at < cutoff).all()
        for alert in stale_alerts:
            db.session.delete(alert)

        stale_scans = ScanRecord.query.filter(ScanRecord.created_at < cutoff).all()
        deleted = len(stale_scans)
        for scan in stale_scans:
            db.session.delete(scan)

        db.session.commit()
        return deleted


@celery.task(name="scam_defender.model_health_snapshot")
def model_health_snapshot() -> dict:
    from app import create_app

    app = create_app()
    with app.app_context():
        service = app.extensions["model_service"]
        return service.get_status()
