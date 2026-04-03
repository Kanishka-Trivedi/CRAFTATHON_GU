"""
generate.py — Synthetic behavioral data generator
---------------------------------------------------
Generates realistic "normal user" sessions for training.
A normal user has consistent but slightly varied behavior.
Run: python data/generate.py
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)


def generate_normal_sessions(n=600):
    """
    Simulate 600 normal banking sessions.
    Each row = one session window (5-second snapshot).

    All values are based on real behavioral biometric research ranges.
    Normal users are NOT perfectly consistent — we add natural variation.
    """
    data = {
        # Typing speed: chars per second. Normal humans: 3–5 cps
        "typing_speed": np.random.normal(4.0, 0.7, n).clip(1.5, 7.5),

        # How long a key is held before release (ms). Normal: 80–140ms
        "key_hold_avg_ms": np.random.normal(110, 18, n).clip(50, 200),

        # Time between releasing one key and pressing next (ms). Normal: 100–200ms
        "key_flight_avg_ms": np.random.normal(150, 25, n).clip(60, 300),

        # Mouse movement velocity in px/sec. Normal: 250–500
        "mouse_velocity": np.random.normal(360, 70, n).clip(80, 650),

        # Scroll speed in px/sec. Normal users scroll moderately
        "scroll_speed": np.random.normal(300, 60, n).clip(50, 600),

        # Idle time between actions in seconds. Normal: 2–8s (user is reading)
        "idle_time_s": np.random.normal(5.0, 1.8, n).clip(0.5, 18),

        # Click accuracy — how far from center of element (px). Normal: <15px
        "click_deviation_px": np.random.normal(8, 3, n).clip(1, 25),
    }

    df = pd.DataFrame(data)
    return df


def generate_anomaly_sessions(n=50):
    """
    Generate clearly anomalous sessions for testing only.
    NOT used in training — only to verify the model catches them.
    Represents a bot or someone who just grabbed the phone.
    """
    data = {
        "typing_speed":       np.random.normal(9.5, 1.0, n).clip(7, 15),
        "key_hold_avg_ms":    np.random.normal(40,  10,  n).clip(20, 65),
        "key_flight_avg_ms":  np.random.normal(30,  10,  n).clip(10, 55),
        "mouse_velocity":     np.random.normal(850, 120, n).clip(600, 1200),
        "scroll_speed":       np.random.normal(900, 150, n).clip(600, 1400),
        "idle_time_s":        np.random.normal(0.4, 0.2, n).clip(0.1, 1.0),
        "click_deviation_px": np.random.normal(28,  6,   n).clip(18, 50),
    }
    return pd.DataFrame(data)


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)

    normal = generate_normal_sessions(600)
    normal.to_csv("data/normal_sessions.csv", index=False)
    print(f"Generated {len(normal)} normal sessions  →  data/normal_sessions.csv")

    anomaly = generate_anomaly_sessions(50)
    anomaly.to_csv("data/anomaly_sessions.csv", index=False)
    print(f"Generated {len(anomaly)} anomaly sessions →  data/anomaly_sessions.csv")

    print("\nNormal session stats:")
    print(normal.describe().round(2).to_string())
