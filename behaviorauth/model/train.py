"""
train.py — Train the Isolation Forest anomaly detection model
-------------------------------------------------------------
Trains on normal sessions only.
Saves trained pipeline (scaler + model) to model/model.pkl
Run: python model/train.py
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline


# These are the exact 7 features the model uses.
# IMPORTANT: M2 (frontend) must send these exact field names.
FEATURES = [
    "typing_speed",
    "key_hold_avg_ms",
    "key_flight_avg_ms",
    "mouse_velocity",
    "scroll_speed",
    "idle_time_s",
    "click_deviation_px",
]


def to_risk(raw: float) -> int:
    """
    Convert Isolation Forest score_samples output to 0–100 risk score.

    Calibrated from actual model output range on our dataset:
      - Normal sessions:  -0.35 to -0.58  → should be LOW risk (0–34)
      - Anomaly sessions: -0.75 and below  → should be HIGH risk (65+)

    Mapping: -0.35 (most normal) → 0 risk, -0.80 (most anomalous) → 100 risk
    """
    NORMAL_BOUND  = -0.35
    ANOMALY_BOUND = -0.80
    clamped = max(ANOMALY_BOUND, min(NORMAL_BOUND, raw))
    risk = int((clamped - NORMAL_BOUND) / (ANOMALY_BOUND - NORMAL_BOUND) * 100)
    return max(0, min(100, risk))


def train_model():
    print("=" * 50)
    print("STEP 1 — Loading training data")
    print("=" * 50)

    df = pd.read_csv("data/normal_sessions.csv")
    print(f"Loaded {len(df)} normal sessions")
    print(f"Features: {FEATURES}\n")

    X_train = df[FEATURES]

    print("=" * 50)
    print("STEP 2 — Building pipeline (Scaler + Isolation Forest)")
    print("=" * 50)

    # Pipeline ensures scaler parameters learned on training data are
    # automatically applied the same way during inference.
    # No data leakage. No mismatch. One .pkl file contains both.
    pipeline = Pipeline([
        ("scaler", StandardScaler()),        # normalise all features to same scale
        ("model", IsolationForest(
            n_estimators=200,               # 200 trees — more = more accurate
            max_samples="auto",             # use all training samples per tree
            contamination=0.05,             # expect ~5% of data to be borderline
            max_features=1.0,               # use all features per tree
            random_state=42,               # reproducible results
            n_jobs=-1,                      # use all CPU cores
        ))
    ])

    print("Training... (this takes <2 seconds)\n")
    pipeline.fit(X_train)
    print("Training complete.\n")

    print("=" * 50)
    print("STEP 3 — Evaluating on test samples")
    print("=" * 50)

    # Test 1: clearly normal session
    normal_sample = pd.DataFrame([{
        "typing_speed": 4.1,
        "key_hold_avg_ms": 108,
        "key_flight_avg_ms": 148,
        "mouse_velocity": 355,
        "scroll_speed": 295,
        "idle_time_s": 5.2,
        "click_deviation_px": 7.5,
    }])

    # Test 2: clearly anomalous session (bot / attacker)
    anomaly_sample = pd.DataFrame([{
        "typing_speed": 10.2,
        "key_hold_avg_ms": 38,
        "key_flight_avg_ms": 22,
        "mouse_velocity": 920,
        "scroll_speed": 950,
        "idle_time_s": 0.3,
        "click_deviation_px": 32,
    }])

    # Test 3: medium suspicion session
    medium_sample = pd.DataFrame([{
        "typing_speed": 6.5,
        "key_hold_avg_ms": 72,
        "key_flight_avg_ms": 85,
        "mouse_velocity": 580,
        "scroll_speed": 520,
        "idle_time_s": 1.5,
        "click_deviation_px": 20,
    }])

    n_score = pipeline.score_samples(normal_sample[FEATURES])[0]
    a_score = pipeline.score_samples(anomaly_sample[FEATURES])[0]
    m_score = pipeline.score_samples(medium_sample[FEATURES])[0]

    print(f"Normal session  → raw: {n_score:.4f}  risk score: {to_risk(n_score):>3}/100  ✓ Should be LOW")
    print(f"Medium session  → raw: {m_score:.4f}  risk score: {to_risk(m_score):>3}/100  ✓ Should be MEDIUM")
    print(f"Anomaly session → raw: {a_score:.4f}  risk score: {to_risk(a_score):>3}/100  ✓ Should be HIGH")

    if to_risk(n_score) < 30 and to_risk(a_score) > 60:
        print("\n✅ Model is working correctly.")
    else:
        print("\n⚠️  WARNING: Scores don't look right. Check generate.py data ranges.")

    print("\n" + "=" * 50)
    print("STEP 4 — Saving model")
    print("=" * 50)

    os.makedirs("model", exist_ok=True)
    joblib.dump(pipeline, "model/model.pkl")
    print("Saved → model/model.pkl")
    print(f"File size: {os.path.getsize('model/model.pkl') / 1024:.1f} KB")
    print("\n✅ Done! Run: uvicorn api.main:app --reload --port 8001")


if __name__ == "__main__":
    train_model()
