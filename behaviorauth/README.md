# ML Engine — Behavioral Authentication

> Continuous behavioral authentication scoring API using Isolation Forest anomaly detection.

## Project Structure

```
behaviorauth/
├── data/
│   ├── generate.py            ← Generate synthetic training data
│   ├── normal_sessions.csv    ← (auto-created) 600 normal sessions
│   └── anomaly_sessions.csv   ← (auto-created) 50 anomaly sessions
├── model/
│   ├── train.py               ← Train + save the model
│   └── model.pkl              ← (auto-created) trained pipeline
├── api/
│   └── main.py                ← FastAPI server (what teammates call)
├── requirements.txt
└── README.md
```

## Setup (do this once)

```bash
pip install -r requirements.txt
```

## Run in order

```bash
# 1. Generate training data
python data/generate.py

# 2. Train the model
python model/train.py

# 3. Start the API server
uvicorn api.main:app --reload --port 8001
```

## Test it

Open **http://localhost:8001/docs** in your browser.  
Full Swagger UI — test `/score`, `/demo/normal`, `/demo/anomaly` interactively.

---

## API for teammates

### POST /score
Called by frontend every 5 seconds with behavioral data.

**Request:**
```json
{
  "user_id": "user_001",
  "typing_speed": 4.1,
  "key_hold_avg_ms": 108,
  "key_flight_avg_ms": 148,
  "mouse_velocity": 355,
  "scroll_speed": 295,
  "idle_time_s": 5.2,
  "click_deviation_px": 7.5
}
```

**Response:**
```json
{
  "user_id": "user_001",
  "risk_score": 12,
  "risk_level": "LOW",
  "action": "NONE",
  "anomalies": [],
  "raw_score": -0.0612,
  "features_received": { "..." }
}
```

### GET /demo/normal → LOW risk (green state, score ~5)
### GET /demo/anomaly → HIGH risk (red state, score ~90)
### GET /health → Server + model status

---

## Risk levels

| Score | Level  | Action           | Meaning                     |
|-------|--------|------------------|-----------------------------|
| 0–34  | LOW    | NONE             | Normal user, no action      |
| 35–64 | MEDIUM | STEP_UP_AUTH     | Ask for PIN / soft re-auth  |
| 65–84 | HIGH   | RESTRICT_SESSION | Block sensitive operations  |
| 85+   | HIGH   | LOGOUT           | End session immediately     |

---

## Demo scenario (for judges)

```
1. Call  GET /demo/normal  → score ~5, GREEN — "session secure"
2. Call  GET /demo/anomaly → score ~90, RED — session freezes
3. Show the `anomalies` array:
   "Typing speed 10.5 chars/sec vs normal ~4 — may indicate scripted input"
   "No idle time between actions (0.3s) — navigation too mechanical"
```
