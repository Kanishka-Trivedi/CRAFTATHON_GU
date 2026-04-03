import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime, timezone

# Securely load the .env file variables into memory
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

# Establish cloud connection
try:
    client = MongoClient(MONGO_URI)
    db = client["ContinuousAuthDB"]
    logs_collection = db["behavior_logs"]
    print("✅ Successfully connected to MongoDB Atlas!")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")

def save_behavior_log(user_id, avg_typing, avg_mouse, risk_score, is_anomaly):
    """Saves the ML evaluation into MongoDB so we can graph it later."""
    doc = {
        "userId": user_id,
        "typingSpeed": avg_typing,
        "mouseSpeed": avg_mouse,
        "riskScore": risk_score,
        "isAnomaly": is_anomaly, # Boolean True/False
        "timestamp": datetime.now(timezone.utc)
    }
    logs_collection.insert_one(doc)

def get_user_analytics(user_id, limit=30):
    """Fetches the recent history for the React Recharts Dashboard."""
    # Find records, sort by newest, limit to 30 dots on the graph
    cursor = logs_collection.find({"userId": user_id}).sort("timestamp", -1).limit(limit)
    
    results = []
    for doc in cursor:
        results.append({
            "typingSpeed": doc.get("typingSpeed"),
            "mouseSpeed": doc.get("mouseSpeed"),
            "riskScore": doc.get("riskScore"),
            "isAnomaly": doc.get("isAnomaly"),
            # Format time for the frontend graph x-axis
            "time": doc.get("timestamp").strftime("%H:%M:%S") 
        })
    
    # Reverse it so newest is on the right side of the graph
    return results[::-1]
