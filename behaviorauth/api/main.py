"""
main.py — Behavioral Authentication ML API v2
----------------------------------------------
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

# Import our MongoDB integration
from api.database import save_behavior_log, get_user_analytics

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="BehaviorAuth ML Engine",
    description="Continuous behavioral authentication scoring API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model loading ─────────────────────────────────────────────────────────────

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
    user_id: str = Field(..., example="user_001")
    typing_speed:       float = Field(..., ge=0, le=20,   example=4.1)
    key_hold_avg_ms:    float = Field(..., ge=0, le=500,  example=108)
    key_flight_avg_ms:  float = Field(..., ge=0, le=800,  example=148)
    mouse_velocity:     float = Field(..., ge=0, le=2000, example=355)
    scroll_speed:       float = Field(..., ge=0, le=2000, example=295)
    idle_time_s:        float = Field(..., ge=0, le=60,   example=5.2)
    click_deviation_px: float = Field(..., ge=0, le=200,  example=7.5)
    baseline: dict = Field(default=None)

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
    risk_score: int
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    action: Literal["NONE", "STEP_UP_AUTH", "RESTRICT_SESSION", "LOGOUT"]
    anomalies: list[str]
    raw_score: float
    features_received: dict


# ── Core Scoring Logic ────────────────────────────────────────────────────────
#
# DESIGN: Simple point-based system. Each metric adds risk points proportional
# to how far it deviates from "relaxed human browsing". The system is tuned so:
#
#   Just mouse movement (300 px/s)          →  ~3 points  → 97% health
#   Normal typing (3 cps) + mouse (300)     →  ~9 points  → 91% health
#   Active typing (5 cps) + mouse (500)     → ~15 points  → 85% health
#   Fast typing (7 cps) + fast mouse (700)  → ~28 points  → 72% health
#   Keyboard mash (12 cps) + wild mouse     → ~70 points  → 30% health → MODAL
#

def compute_risk_score(data: BehaviorInput) -> int:
    points = 0.0

    # ── Typing speed ─────────────────────────────────────────────
    ts = data.typing_speed
    if ts > 0:
        if ts <= 5:
            points += ts * 1.6           # 3→4.8, 5→8
        elif ts <= 8:
            points += 8 + (ts - 5) * 7   # 6→15, 8→29
        else:
            points += 29 + (ts - 8) * 8  # 10→45, 14→77

    # ── Mouse velocity ───────────────────────────────────────────
    mv = data.mouse_velocity
    if mv > 0:
        if mv <= 500:
            points += mv / 100           # 200→2, 400→4
        elif mv <= 800:
            points += 5 + (mv - 500) / 300 * 7    # 650→8.5
        else:
            points += 12 + (mv - 800) / 200 * 10  # 1000→22

    # ── Key hold time ────────────────────────────────────────────
    kh = data.key_hold_avg_ms
    if kh > 0:
        if kh < 40:
            points += 20     # Bot scripting
        elif kh < 70:
            points += 8      # Very fast, suspicious
        elif kh <= 200:
            points += 2      # Normal human
        elif kh <= 350:
            points += 5      # Slow but OK
        else:
            points += 12     # Very slow, unusual

    # ── Scroll speed ─────────────────────────────────────────────
    ss = data.scroll_speed
    if ss > 0:
        if ss <= 400:
            points += ss / 200           # 200→1, 400→2
        elif ss <= 800:
            points += 2 + (ss - 400) / 400 * 5    # 600→4.5
        else:
            points += 7 + (ss - 800) / 200 * 8    # 1000→15

    # ── Key flight time ──────────────────────────────────────────
    kf = data.key_flight_avg_ms
    if kf > 0:
        if kf < 30:
            points += 15     # Automated inter-key timing
        elif kf <= 250:
            points += 1      # Normal
        else:
            points += 3      # Slow

    return max(0, min(100, int(points)))


def risk_score_to_level(score: int) -> tuple[str, str]:
    if score < 25:
        return "LOW", "NONE"
    elif score < 50:
        return "MEDIUM", "STEP_UP_AUTH"
    elif score < 75:
        return "HIGH", "RESTRICT_SESSION"
    else:
        return "HIGH", "LOGOUT"


def get_anomaly_reasons(data: BehaviorInput, risk_score: int) -> list[str]:
    if risk_score < 15:
        return []

    reasons = []

    if data.typing_speed > 8.0:
        reasons.append(f"Typing speed critically high ({data.typing_speed:.1f} cps — possible automated input)")
    elif data.typing_speed > 5.0:
        reasons.append(f"Elevated typing cadence ({data.typing_speed:.1f} cps)")

    if data.mouse_velocity > 800:
        reasons.append(f"Erratic cursor movement ({data.mouse_velocity:.0f} px/s)")

    if data.key_hold_avg_ms > 0 and data.key_hold_avg_ms < 40:
        reasons.append(f"Key hold duration unnaturally short ({data.key_hold_avg_ms:.0f}ms)")

    if data.scroll_speed > 800:
        reasons.append(f"Abnormal scroll acceleration ({data.scroll_speed:.0f} px/s)")

    if data.key_flight_avg_ms > 0 and data.key_flight_avg_ms < 30:
        reasons.append("Inter-key timing below human threshold")

    baseline = data.baseline or {}
    b_typing = baseline.get("typingSpeedAvg", 0)
    if b_typing > 0 and data.typing_speed > b_typing * 2.5:
        reasons.append(f"Typing 2.5x above your baseline ({data.typing_speed:.1f} vs {b_typing:.1f})")

    return reasons


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_loaded": pipeline is not None,
        "version": "2.0.0",
    }


@app.get("/api/user/{user_id}/analytics")
def fetch_analytics(user_id: str):
    try:
        data = get_user_analytics(user_id)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score", response_model=ScoreResponse)
def score_behavior(data: BehaviorInput):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Run: python model/train.py")

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
    risk_score = compute_risk_score(data)

    risk_level, action = risk_score_to_level(risk_score)
    anomalies  = get_anomaly_reasons(data, risk_score)
    is_anomaly = risk_level == "HIGH"

    try:
        save_behavior_log(
            user_id=data.user_id,
            avg_typing=data.typing_speed,
            avg_mouse=data.mouse_velocity,
            risk_score=risk_score,
            is_anomaly=is_anomaly
        )
    except Exception as e:
        print(f"MongoDB save failed: {e}")

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


import random
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
MESSAGING_SERVICE_SID = os.getenv("MESSAGING_SERVICE_SID")
TO_PHONE = os.getenv("TO_PHONE")

@app.get("/send-otp")
def send_otp():
    try:
        code = str(random.randint(100000, 999999))
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            messaging_service_sid=MESSAGING_SERVICE_SID,
            body=f"Ahoy 👋 {code}",
            to=TO_PHONE
        )
        print(f"Twilio SMS sent! SID: {message.sid}")
        return {"status": "success", "otp": code, "sid": message.sid}
    except Exception as e:
        print(f"Twilio API Error: {str(e)}")
        return {"status": "error", "otp": "123456", "detail": str(e)}
