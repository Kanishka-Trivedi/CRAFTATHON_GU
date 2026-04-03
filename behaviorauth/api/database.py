import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone

# Load variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

try:
    client = MongoClient(MONGO_URI)
    db = client["behaveguard"]
    logs_collection = db["behavior_logs"]
    print("✅ Connected to BehaveGuard Cloud Storage!")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")

def save_behavior_log(user_id, avg_typing, avg_mouse, risk_score, is_anomaly):
    """Saves the ML evaluation into MongoDB so we can graph it later."""
    doc = {
        "userId": user_id,
        "typingSpeed": avg_typing,
        "mouseSpeed": avg_mouse,
        "riskScore": risk_score,
        "isAnomaly": is_anomaly,
        "timestamp": datetime.now(timezone.utc)
    }
    logs_collection.insert_one(doc)

def get_user_analytics(user_id, limit=30):
    """Fetches the recent history for the React Recharts Dashboard."""
    cursor = logs_collection.find({"userId": user_id}).sort("timestamp", -1).limit(limit)
    
    results = []
    for doc in cursor:
        results.append({
            "typingSpeed": doc.get("typingSpeed"),
            "mouseSpeed": doc.get("mouseSpeed"),
            "riskScore": doc.get("riskScore"),
            "isAnomaly": doc.get("isAnomaly"),
            "time": doc.get("timestamp").strftime("%H:%M:%S") 
        })
    return results[::-1]
