"""
main.py — Behavioral Authentication ML API
------------------------------------------
FastAPI server that receives behavioral events and returns risk scores.
Run: uvicorn api.main:app --reload --port 8001

Endpoints:
  GET  /health          → server status check
  POST /score           → score a behavioral session
  GET  /demo/normal     → returns a pre-built normal session score (for demo)
  GET  /demo/anomaly    → returns a pre-built anomaly score (for demo)
"""

import os
import sys
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="BehaviorAuth ML Engine",
    description="Continuous behavioral authentication scoring API",
    version="1.0.0",
)

# Allow all origins — teammates' frontends on different ports can call this freely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model loading ─────────────────────────────────────────────────────────────

# Support running from project root OR from inside /api folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "model.pkl")

try:
    pipeline = joblib.load(MODEL_PATH)
    print(f"✅ Model loaded from {MODEL_PATH}")
except FileNotFoundError:
    print(f"❌ ERROR: model not found at {MODEL_PATH}")
    print("Run: python model/train.py first")
    pipeline = None

FEATURES = [
    "typing_speed",
    "key_hold_avg_ms",
    "key_flight_avg_ms",
    "mouse_velocity",
    "scroll_speed",
    "idle_time_s",
    "click_deviation_px",
]

# ── Input / Output schemas ────────────────────────────────────────────────────

class BehaviorInput(BaseModel):
    """
    Behavioral event data sent by the frontend every ~5 seconds.
    All fields are required. M2 must send all 7 features.
    """
    user_id: str = Field(..., example="user_001")

    # Keystroke dynamics
    typing_speed:      float = Field(..., ge=0, le=20,   example=4.1,   description="Characters per second")
    key_hold_avg_ms:   float = Field(..., ge=0, le=500,  example=108,   description="Avg key hold duration in ms")
    key_flight_avg_ms: float = Field(..., ge=0, le=800,  example=148,   description="Avg time between keystrokes in ms")

    # Mouse behaviour
    mouse_velocity:    float = Field(..., ge=0, le=2000, example=355,   description="Mouse movement speed px/sec")

    # Scroll behaviour
    scroll_speed:      float = Field(..., ge=0, le=2000, example=295,   description="Scroll speed in px/sec")

    # Session context
    idle_time_s:       float = Field(..., ge=0, le=60,   example=5.2,   description="Seconds idle between actions")

    # Click precision
    click_deviation_px: float = Field(..., ge=0, le=200, example=7.5,  description="Avg px distance from element center")

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_001",
                "typing_speed": 4.1,
                "key_hold_avg_ms": 108,
                "key_flight_avg_ms": 148,
                "mouse_velocity": 355,
                "scroll_speed": 295,
                "idle_time_s": 5.2,
                "click_deviation_px": 7.5,
            }
        }


class ScoreResponse(BaseModel):
    user_id: str
    risk_score: int                                    # 0 (safe) to 100 (definite fraud)
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    action: Literal["NONE", "STEP_UP_AUTH", "RESTRICT_SESSION", "LOGOUT"]
    anomalies: list[str]                               # human-readable reasons
    raw_score: float                                   # raw Isolation Forest output
    features_received: dict                            # echo back what was received


# ── Core logic ────────────────────────────────────────────────────────────────

def raw_to_risk_score(raw: float) -> int:
    """
    Convert Isolation Forest score_samples output to 0–100 risk score.

    Calibrated from actual model output range on our dataset:
      - Normal sessions:  -0.35 to -0.58  → LOW risk  (0–34)
      - Anomaly sessions: -0.75 and below  → HIGH risk (65+)

    Mapping: -0.35 (most normal) → 0 risk, -0.80 (most anomalous) → 100 risk
    """
    NORMAL_BOUND  = -0.35
    ANOMALY_BOUND = -0.80
    clamped = max(ANOMALY_BOUND, min(NORMAL_BOUND, raw))
    risk = int((clamped - NORMAL_BOUND) / (ANOMALY_BOUND - NORMAL_BOUND) * 100)
    return max(0, min(100, risk))


def risk_score_to_level(score: int) -> tuple[str, str]:
    """Map numeric risk score to level + action."""
    if score < 35:
        return "LOW", "NONE"
    elif score < 65:
        return "MEDIUM", "STEP_UP_AUTH"
    elif score < 85:
        return "HIGH", "RESTRICT_SESSION"
    else:
        return "HIGH", "LOGOUT"


def get_anomaly_reasons(data: BehaviorInput, risk_score: int) -> list[str]:
    """
    Generate human-readable explanations for why risk score is elevated.
    Compares each feature to its known baseline.
    """
    if risk_score < 20:
        return []

    reasons = []

    thresholds = {
        "typing_speed":       (data.typing_speed,       7.0,  None, "Unusually fast typing speed ({:.1f} chars/sec vs normal ~4) — may indicate scripted input"),
        "key_hold_avg_ms":    (data.key_hold_avg_ms,    None, 65,   "Key hold time too short ({:.0f}ms vs normal ~110ms) — may indicate bot behavior"),
        "key_flight_avg_ms":  (data.key_flight_avg_ms,  None, 55,   "Typing rhythm abnormal — keypresses too rapid ({:.0f}ms gap vs normal ~150ms)"),
        "mouse_velocity":     (data.mouse_velocity,     680,  None, "Mouse movement unusually fast ({:.0f}px/sec vs normal ~360)"),
        "scroll_speed":       (data.scroll_speed,       650,  None, "Scrolling too fast ({:.0f}px/sec) — unusual for a reading user"),
        "idle_time_s":        (data.idle_time_s,        None, 1.0,  "No idle time between actions ({:.1f}s) — navigation too mechanical"),
        "click_deviation_px": (data.click_deviation_px, 22,   None, "Click precision poor ({:.0f}px offset) — inconsistent with established user pattern"),
    }

    for feature, (val, high_thresh, low_thresh, msg_template) in thresholds.items():
        if high_thresh is not None and val > high_thresh:
            reasons.append(msg_template.format(val))
        elif low_thresh is not None and val < low_thresh:
            reasons.append(msg_template.format(val))

    if not reasons and risk_score > 35:
        reasons.append(
            "Overall combination of behavioral metrics deviates from your established baseline pattern"
        )

    return reasons


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": pipeline is not None,
        "model_path": MODEL_PATH,
        "features": FEATURES,
        "version": "1.0.0",
    }


@app.post("/score", response_model=ScoreResponse)
def score_behavior(data: BehaviorInput):
    """
    Main endpoint. Called by frontend every 5 seconds.
    Returns risk score + level + action + human-readable reasons.
    """
    if pipeline is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run: python model/train.py"
        )

    features_df = pd.DataFrame([{
        "typing_speed":       data.typing_speed,
        "key_hold_avg_ms":    data.key_hold_avg_ms,
        "key_flight_avg_ms":  data.key_flight_avg_ms,
        "mouse_velocity":     data.mouse_velocity,
        "scroll_speed":       data.scroll_speed,
        "idle_time_s":        data.idle_time_s,
        "click_deviation_px": data.click_deviation_px,
    }])

    raw_score  = float(pipeline.score_samples(features_df[FEATURES])[0])
    risk_score = raw_to_risk_score(raw_score)
    risk_level, action = risk_score_to_level(risk_score)
    anomalies  = get_anomaly_reasons(data, risk_score)

    return ScoreResponse(
        user_id=data.user_id,
        risk_score=risk_score,
        risk_level=risk_level,
        action=action,
        anomalies=anomalies,
        raw_score=round(raw_score, 4),
        features_received={
            "typing_speed":       data.typing_speed,
            "key_hold_avg_ms":    data.key_hold_avg_ms,
            "key_flight_avg_ms":  data.key_flight_avg_ms,
            "mouse_velocity":     data.mouse_velocity,
            "scroll_speed":       data.scroll_speed,
            "idle_time_s":        data.idle_time_s,
            "click_deviation_px": data.click_deviation_px,
        }
    )


@app.get("/demo/normal", response_model=ScoreResponse)
def demo_normal():
    """Pre-built normal session. Frontend uses this for the green/safe demo state."""
    return score_behavior(BehaviorInput(
        user_id="demo_user",
        typing_speed=4.0,
        key_hold_avg_ms=112,
        key_flight_avg_ms=152,
        mouse_velocity=350,
        scroll_speed=290,
        idle_time_s=5.5,
        click_deviation_px=7.0,
    ))


@app.get("/demo/anomaly", response_model=ScoreResponse)
def demo_anomaly():
    """Pre-built attacker session. Frontend uses this to show the HIGH RISK / red alert state."""
    return score_behavior(BehaviorInput(
        user_id="demo_user",
        typing_speed=10.5,
        key_hold_avg_ms=38,
        key_flight_avg_ms=22,
        mouse_velocity=940,
        scroll_speed=980,
        idle_time_s=0.3,
        click_deviation_px=34,
    ))
