# AI Scam Defender

AI Scam Defender is a full-stack cybersecurity platform for real-time scam detection across:
- emails
- messages (SMS/chat)
- URLs
- files (PE malware analysis)
- financial transactions (fraud detection)

It now includes end-to-end backend APIs, persistent database models, and a modern frontend with live alert streaming.

## Architecture

- Backend: Flask + JWT + SQLAlchemy + model-serving layer
- Database: SQLite by default (PostgreSQL ready via `DATABASE_URL`)
- ML Inference: DistilBERT, XGBoost, Random Forest, Isolation Forest, TF-IDF models from `app/models`
- Frontend: React + Vite + GSAP + Lenis + Three.js + DaisyUI components (via CDN)
- Streaming: Server-Sent Events endpoint for live alert feeds (`/api/stream/alerts`)

## Core Features

- Secure auth (`register`, `login`, `me`)
- Profile management
- Settings & privacy controls
- Feedback submission and history
- Scan APIs for all five detection pipelines
- Dashboard analytics and scan history
- Real-time threat alerts with acknowledgment flow

## Backend Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r app/requirements.txt
python -m app.api
```

Backend runs at `http://localhost:5000`.

### Environment Variables

- `DATABASE_URL` (default: sqlite file under `app/data/scam_defender.db`)
- `JWT_SECRET_KEY`
- `ALLOWED_ORIGINS`
- `MODEL_DIR` (default: `app/models`)
- `CELERY_BROKER_URL`
- `CELERY_RESULT_BACKEND`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

Set `VITE_API_BASE_URL` only if backend is not on `http://localhost:5000/api`.

## Docker Compose

```bash
docker compose up --build
```

Services:
- `backend` (Flask API)
- `frontend` (Vite dev server)
- `postgres`
- `redis`

## API Surface

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|PUT /api/profile`
- `GET|PUT /api/settings/privacy`
- `POST|GET /api/feedback`
- `POST /api/scan/email`
- `POST /api/scan/message`
- `POST /api/scan/url`
- `POST /api/scan/file`
- `POST /api/scan/fraud`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/history`
- `GET /api/alerts`
- `PATCH /api/alerts/<id>/ack`
- `GET /api/stream/alerts?token=<JWT>`
- `GET /api/models/status`

## Notes

- `app/processors/` currently contains model training notebooks/scripts used to generate artifacts.
- Inference runtime is now centralized in `app/services/model_service.py`.
- Fill in your own production secrets and integration API keys in environment variables or `config.yaml`.
