import os
from pathlib import Path

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from sqlalchemy import inspect, text

from app.models_db import db
from app.services.model_service import ModelService

load_dotenv()

jwt = JWTManager()


class AppConfig:
    BASE_DIR = Path(__file__).resolve().parent
    DATA_DIR = BASE_DIR / "data"

    SECRET_KEY = os.getenv("SECRET_KEY", "4c1f4cb047eb93d72412a37a5b592d8427c2d2e86170f222528d953da60d16fb")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{(DATA_DIR / 'scam_defender.db').as_posix()}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MODEL_DIR = os.getenv("MODEL_DIR", str(BASE_DIR / "models"))

    raw_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173",
    )
    CORS_ORIGINS = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def _ensure_legacy_schema_compat(app: Flask) -> None:
    """
    Patch legacy schemas in-place for existing installations that used older
    versions of the project without full migration tooling.
    """
    inspector = inspect(db.engine)
    tables = set(inspector.get_table_names())
    if "users" not in tables:
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = db.engine.dialect.name

    statements: list[str] = []
    if "full_name" not in columns:
        if dialect == "mysql":
            statements.append(
                "ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT 'Scam Defender User'"
            )
        else:
            statements.append("ALTER TABLE users ADD COLUMN full_name VARCHAR(120) DEFAULT 'Scam Defender User'")

    if "is_active" not in columns:
        if dialect == "mysql":
            statements.append("ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE")
        else:
            statements.append("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")

    if "updated_at" not in columns:
        if dialect == "mysql":
            statements.append("ALTER TABLE users ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP")
        else:
            statements.append("ALTER TABLE users ADD COLUMN updated_at DATETIME")

    if not statements:
        return

    with db.engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

        now_expr = "NOW()" if dialect == "mysql" else "CURRENT_TIMESTAMP"
        connection.execute(
            text("UPDATE users SET full_name = 'Scam Defender User' WHERE full_name IS NULL OR full_name = ''")
        )
        connection.execute(text("UPDATE users SET is_active = 1 WHERE is_active IS NULL"))
        connection.execute(text(f"UPDATE users SET updated_at = {now_expr} WHERE updated_at IS NULL"))

    app.logger.info("Applied legacy schema compatibility patches for users table.")



def create_app(config_overrides: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(AppConfig)

    if config_overrides:
        app.config.update(config_overrides)

    AppConfig.DATA_DIR.mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    app.extensions["model_service"] = ModelService(app.config["MODEL_DIR"])

    from app.api import api_bp

    app.register_blueprint(api_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()
        _ensure_legacy_schema_compat(app)

    return app
