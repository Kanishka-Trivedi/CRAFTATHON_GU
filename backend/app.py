from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
from collections import defaultdict
import numpy as np

# Import our custom modules
from ml_engine import BehaviorAnomalyDetector
from database import save_behavior_log, get_user_analytics

app = Flask(__name__)
app.config['SECRET_KEY'] = 'my_super_secret_key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# 1. Initialize ML Model & Memory Buffer
ml_detector = BehaviorAnomalyDetector()
user_buffers = defaultdict(list)
BUFFER_SIZE_LIMIT = 5 

# --- REST API ROUTES ---
@app.route('/')
def health_check():
    return jsonify({"status": "success", "message": "ML Engine connected to MongoDB."})

@app.route('/api/user/<user_id>/analytics', methods=['GET'])
def fetch_analytics(user_id):
    """ This endpoint allows the frontend Recharts dashboard to fetch historical Risk Scores! """
    try:
        data = get_user_analytics(user_id)
        return jsonify({"status": "success", "data": data}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

# --- SOCKET.IO CONTINUOUS TRACKING ---
@socketio.on('connect')
def handle_connect():
    print("[Socket] Frontend Connected")

@socketio.on('behavior_event')
def handle_behavior_event(data):
    user_id = data.get('userId', 'anonymous_user')
    user_buffers[user_id].append(data)
    
    if len(user_buffers[user_id]) >= BUFFER_SIZE_LIMIT:
        buffer_data = user_buffers[user_id]
        
        # 1. Run ML Prediction
        risk_score, is_anomaly = ml_detector.analyze_behavior(buffer_data)
        
        # 2. Extract averages to save to database
        avg_typing = float(np.mean([item.get('typingSpeed', 60) for item in buffer_data]))
        avg_mouse = float(np.mean([item.get('mouseSpeed', 200) for item in buffer_data]))
        
        # 3. Permanently save to MongoDB Atlas!
        save_behavior_log(user_id, avg_typing, avg_mouse, risk_score, is_anomaly)
        
        # 4. Determine Auth Action
        action = 'NONE'
        if risk_score >= 0.8:
            action = 'LOGOUT'
        elif risk_score >= 0.5:
            action = 'REQUIRE_OTP'

        # 5. Emit security response back to frontend
        emit('security_action', {
            'riskScore': risk_score,
            'isAnomaly': is_anomaly,
            'action': action,
            'message': 'Suspicious Activity Detected!' if is_anomaly else 'Behavior verified.'
        })

        user_buffers[user_id].clear()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
