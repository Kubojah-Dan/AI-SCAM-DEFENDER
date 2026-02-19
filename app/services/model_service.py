import logging
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from app.services.feature_extractors import (
    build_fraud_feature_frame,
    build_url_feature_frame,
    extract_pe_aggregate_features,
)

LOGGER = logging.getLogger(__name__)


class ModelServiceError(RuntimeError):
    pass


class ModelService:
    def __init__(self, model_dir: str | Path):
        self.model_dir = Path(model_dir)

        self._email_tokenizer = None
        self._email_model = None
        self._torch = None

        self._message_vectorizer = None
        self._message_model = None

        self._url_model = None
        self._url_label_encoder = None
        self._url_feature_names = None
        self._url_model_name = None

        self._file_xgb = None
        self._file_rf = None
        self._file_feature_cols = None

        self._fraud_xgb = None
        self._fraud_iso = None
        self._fraud_scaler = None
        self._fraud_ohe = None

    @staticmethod
    def _ensure_pickle_compat() -> None:
        try:
            import numpy.core as numpy_core

            sys.modules.setdefault("numpy._core", numpy_core)
        except Exception:
            pass

    def _safe_joblib_load(self, path: Path, optional: bool = False):
        self._ensure_pickle_compat()
        # These pickles were trained with numpy>=2 and scikit-learn>=1.6.
        # Guarding here prevents low-level interpreter crashes on incompatible runtimes.
        try:
            import sklearn

            sklearn_parts = tuple(int(part) for part in sklearn.__version__.split(".")[:2])
            numpy_major = int(np.__version__.split(".")[0])
            if sklearn_parts < (1, 6) or numpy_major < 2:
                if optional:
                    return None
                raise ModelServiceError(
                    "Incompatible runtime for model artifacts. Install dependencies from app/requirements.txt "
                    "(numpy>=2 and scikit-learn>=1.6)."
                )
        except ModelServiceError:
            raise
        except Exception:
            # If version parsing fails for any reason, continue and attempt load.
            pass

        try:
            return joblib.load(path)
        except Exception as exc:
            if optional:
                LOGGER.warning("Optional artifact failed to load (%s): %s", path.name, exc)
                return None

            raise ModelServiceError(
                f"Failed to load '{path.name}'. This usually means a dependency/version mismatch. "
                "Install dependencies from app/requirements.txt."
            ) from exc

    def _resolve_model_path(self, candidates: list[str]) -> Path:
        for candidate in candidates:
            path = self.model_dir / candidate
            if path.exists():
                return path
        raise ModelServiceError(f"None of the model files were found: {candidates}")

    def _load_email_bundle(self) -> None:
        if self._email_model is not None and self._email_tokenizer is not None:
            return

        model_path = self._resolve_model_path(["email_spam_distilbert_model", "email_spam_model"])

        try:
            from transformers import AutoModelForSequenceClassification, AutoTokenizer
            import torch

            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForSequenceClassification.from_pretrained(model_path)
            model.eval()

            self._email_tokenizer = tokenizer
            self._email_model = model
            self._torch = torch
        except Exception as exc:
            LOGGER.warning("Email model loading failed, heuristic fallback will be used: %s", exc)
            self._email_model = False
            self._email_tokenizer = False

    def _load_message_bundle(self) -> None:
        if self._message_model is not None and self._message_vectorizer is not None:
            return

        model_path = self.model_dir / "sms_rf_tfidf_model.pkl"
        vectorizer_path = self.model_dir / "sms_tfidf_vectorizer.pkl"
        if not model_path.exists() or not vectorizer_path.exists():
            raise ModelServiceError("Message model artifacts are missing from app/models")

        self._message_model = self._safe_joblib_load(model_path)
        self._message_vectorizer = self._safe_joblib_load(vectorizer_path)

    def _load_url_bundle(self) -> None:
        if self._url_model is not None:
            return

        import xgboost as xgb

        model_path = self._resolve_model_path([
            "url_xgboost_improved.json",
            "url_xgboost_malicious_detector.json",
        ])

        model = xgb.XGBClassifier()
        model.load_model(str(model_path))
        booster = model.get_booster()

        feature_names = booster.feature_names
        if not feature_names:
            feature_names = [f"f{index}" for index in range(model.n_features_in_)]

        self._url_model = model
        self._url_feature_names = feature_names
        self._url_model_name = model_path.name

        encoder_path = self.model_dir / "label_encoder.joblib"
        if encoder_path.exists():
            self._url_label_encoder = self._safe_joblib_load(encoder_path, optional=True)

    def _load_file_bundle(self) -> None:
        if self._file_xgb is not None and self._file_rf is not None and self._file_feature_cols is not None:
            return

        import xgboost as xgb

        xgb_path = self.model_dir / "file_malware_xgboost.json"
        rf_path = self.model_dir / "file_malware_rf.pkl"
        cols_path = self.model_dir / "feature_cols.pkl"

        if not xgb_path.exists() or not rf_path.exists() or not cols_path.exists():
            raise ModelServiceError("File malware model artifacts are missing from app/models")

        file_xgb = xgb.XGBClassifier()
        file_xgb.load_model(str(xgb_path))

        self._file_xgb = file_xgb
        self._file_rf = self._safe_joblib_load(rf_path)
        self._file_feature_cols = self._safe_joblib_load(cols_path)

    def _load_fraud_bundle(self) -> None:
        if (
            self._fraud_xgb is not None
            and self._fraud_iso is not None
            and self._fraud_scaler is not None
            and self._fraud_ohe is not None
        ):
            return

        import xgboost as xgb

        xgb_path = self.model_dir / "fraud_xgboost.json"
        iso_path = self.model_dir / "fraud_iso_forest.pkl"
        scaler_path = self.model_dir / "fraud_scaler.pkl"
        ohe_path = self.model_dir / "fraud_ohe.pkl"

        if not all(path.exists() for path in [xgb_path, iso_path, scaler_path, ohe_path]):
            raise ModelServiceError("Fraud model artifacts are missing from app/models")

        fraud_xgb = xgb.XGBClassifier()
        fraud_xgb.load_model(str(xgb_path))

        self._fraud_xgb = fraud_xgb
        self._fraud_iso = self._safe_joblib_load(iso_path)
        self._fraud_scaler = self._safe_joblib_load(scaler_path)
        self._fraud_ohe = self._safe_joblib_load(ohe_path)

    @staticmethod
    def _heuristic_email_score(text: str) -> float:
        flags = [
            "urgent",
            "verify",
            "account",
            "password",
            "wire transfer",
            "bank",
            "claim prize",
            "won",
            "bitcoin",
            "gift card",
            "suspended",
            "login now",
        ]
        lowered = text.lower()
        hits = sum(1 for keyword in flags if keyword in lowered)
        return min(0.95, 0.18 * hits)

    def predict_email(self, subject: str, message: str) -> dict:
        text = f"{subject or ''}\n{message or ''}".strip()
        if not text:
            raise ModelServiceError("Email scan requires at least subject or message text")

        self._load_email_bundle()

        if self._email_model is False:
            spam_prob = self._heuristic_email_score(text)
            source = "heuristic"
        else:
            try:
                inputs = self._email_tokenizer(
                    text,
                    return_tensors="pt",
                    truncation=True,
                    max_length=512,
                    padding=True,
                )
                # DistilBERT does not use token_type_ids.
                inputs.pop("token_type_ids", None)

                with self._torch.no_grad():
                    logits = self._email_model(**inputs).logits
                    probs = self._torch.softmax(logits, dim=-1)[0].cpu().numpy()
                spam_prob = float(probs[1] if len(probs) > 1 else probs[0])
                source = "distilbert"
            except Exception as exc:
                LOGGER.warning("Email inference fallback to heuristic: %s", exc)
                spam_prob = self._heuristic_email_score(text)
                source = "heuristic_fallback"

        verdict = "SPAM" if spam_prob >= 0.5 else "HAM"
        confidence = spam_prob if verdict == "SPAM" else 1.0 - spam_prob

        return {
            "verdict": verdict,
            "confidence": round(float(confidence), 4),
            "risk_score": round(float(spam_prob * 100.0), 2),
            "details": {
                "spam_probability": round(float(spam_prob), 6),
                "source": source,
            },
        }

    def predict_message(self, message_text: str) -> dict:
        if not str(message_text or "").strip():
            raise ModelServiceError("Message scan requires non-empty text")

        self._load_message_bundle()

        transformed = self._message_vectorizer.transform([message_text])
        prediction = int(self._message_model.predict(transformed)[0])

        probabilities = self._message_model.predict_proba(transformed)[0]
        classes = list(getattr(self._message_model, "classes_", [0, 1]))
        class_to_prob = {int(cls): float(probabilities[index]) for index, cls in enumerate(classes)}

        scam_probability = class_to_prob.get(1, float(max(probabilities)))
        verdict = "SCAM" if prediction == 1 else "SAFE"
        confidence = scam_probability if verdict == "SCAM" else 1.0 - scam_probability

        return {
            "verdict": verdict,
            "confidence": round(float(confidence), 4),
            "risk_score": round(float(scam_probability * 100.0), 2),
            "details": {
                "scam_probability": round(float(scam_probability), 6),
                "class_probabilities": {
                    "ham": round(class_to_prob.get(0, 0.0), 6),
                    "spam": round(class_to_prob.get(1, 0.0), 6),
                },
                "model": "sms_rf_tfidf_model",
            },
        }

    def predict_url(self, url: str) -> dict:
        if not str(url or "").strip():
            raise ModelServiceError("URL scan requires a URL string")

        self._load_url_bundle()

        feature_frame = build_url_feature_frame(url, self._url_feature_names)
        probabilities = self._url_model.predict_proba(feature_frame)[0]
        predicted_index = int(np.argmax(probabilities))

        if self._url_label_encoder is not None:
            labels = list(self._url_label_encoder.classes_)
        else:
            if len(probabilities) == 4:
                labels = ["benign", "defacement", "malware", "phishing"]
            else:
                labels = [f"class_{index}" for index in range(len(probabilities))]

        class_probabilities = {
            labels[index]: round(float(probabilities[index]), 6) for index in range(min(len(labels), len(probabilities)))
        }

        predicted_label = labels[predicted_index] if predicted_index < len(labels) else str(predicted_index)
        benign_probability = class_probabilities.get("benign", 0.0)
        malicious_probability = 1.0 - benign_probability if "benign" in class_probabilities else float(max(probabilities))

        verdict = "SAFE" if predicted_label == "benign" else "MALICIOUS"
        confidence = float(probabilities[predicted_index])

        return {
            "verdict": verdict,
            "confidence": round(confidence, 4),
            "risk_score": round(float(malicious_probability * 100.0), 2),
            "details": {
                "predicted_category": predicted_label,
                "class_probabilities": class_probabilities,
                "model": self._url_model_name,
            },
        }

    def predict_file(self, file_bytes: bytes, filename: str = "") -> dict:
        if not file_bytes:
            raise ModelServiceError("File scan requires non-empty binary content")

        self._load_file_bundle()
        feature_map = extract_pe_aggregate_features(file_bytes)

        if feature_map is None:
            return {
                "verdict": "NOT_PE_OR_INVALID",
                "confidence": 1.0,
                "risk_score": 10.0,
                "details": {
                    "reason": "The uploaded file is not a valid PE executable or could not be parsed.",
                    "filename": filename,
                },
            }

        frame = pd.DataFrame([{column: feature_map.get(column, 0.0) for column in self._file_feature_cols}])
        xgb_prob = float(self._file_xgb.predict_proba(frame)[0][1])
        rf_prob = float(self._file_rf.predict_proba(frame)[0][1])
        ensemble_prob = (xgb_prob + rf_prob) / 2.0

        verdict = "MALWARE" if ensemble_prob >= 0.5 else "GOODWARE"
        confidence = ensemble_prob if verdict == "MALWARE" else 1.0 - ensemble_prob

        return {
            "verdict": verdict,
            "confidence": round(float(confidence), 4),
            "risk_score": round(float(ensemble_prob * 100.0), 2),
            "details": {
                "xgboost_probability": round(xgb_prob, 6),
                "random_forest_probability": round(rf_prob, 6),
                "filename": filename,
            },
        }

    def predict_fraud(self, transaction: dict) -> dict:
        if not isinstance(transaction, dict):
            raise ModelServiceError("Fraud scan requires a JSON object payload")

        self._load_fraud_bundle()

        frame = build_fraud_feature_frame(transaction, self._fraud_ohe, self._fraud_scaler)

        iso_columns = list(getattr(self._fraud_iso, "feature_names_in_", []))
        if iso_columns:
            for column in iso_columns:
                if column not in frame.columns:
                    frame[column] = 0.0
            iso_input = frame[iso_columns]
        else:
            iso_input = frame

        iso_score = float(self._fraud_iso.decision_function(iso_input)[0])
        frame["iso_anomaly_score"] = iso_score

        xgb_columns = self._fraud_xgb.get_booster().feature_names
        if xgb_columns:
            for column in xgb_columns:
                if column not in frame.columns:
                    frame[column] = 0.0
            model_input = frame[xgb_columns]
        else:
            model_input = frame

        fraud_probability = float(self._fraud_xgb.predict_proba(model_input)[0][1])
        verdict = "FRAUD" if fraud_probability >= 0.5 else "LEGIT"
        confidence = fraud_probability if verdict == "FRAUD" else 1.0 - fraud_probability

        return {
            "verdict": verdict,
            "confidence": round(float(confidence), 4),
            "risk_score": round(float(fraud_probability * 100.0), 2),
            "details": {
                "fraud_probability": round(fraud_probability, 6),
                "iso_anomaly_score": round(iso_score, 6),
                "model": "fraud_xgboost + isolation_forest",
            },
        }

    def get_status(self) -> dict:
        expected = {
            "email": ["email_spam_distilbert_model"],
            "message": ["sms_rf_tfidf_model.pkl", "sms_tfidf_vectorizer.pkl"],
            "url": ["url_xgboost_improved.json", "url_xgboost_malicious_detector.json"],
            "file": ["file_malware_xgboost.json", "file_malware_rf.pkl", "feature_cols.pkl"],
            "fraud": ["fraud_xgboost.json", "fraud_iso_forest.pkl", "fraud_scaler.pkl", "fraud_ohe.pkl"],
        }

        status = {}
        for key, files in expected.items():
            status[key] = any((self.model_dir / file_name).exists() for file_name in files)

        status["model_dir"] = str(self.model_dir)
        return status
