from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from ml_engine import BehaviorAnomalyDetector
import os
from collections import defaultdict

app = Flask(__name__)
app.config['SECRET_KEY'] = 'my_super_secret_key'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# 1. Initialize the Scikit-Learn ML Model
ml_detector = BehaviorAnomalyDetector()

# 2. Define the Rolling Memory Buffer
user_buffers = defaultdict(list)
BUFFER_SIZE_LIMIT = 5  # Evaluate data every 5 incoming events

@app.route('/')
def health_check():
    return jsonify({"status": "success", "message": "ML Authentication Backend is listening!"})

@socketio.on('connect')
def handle_connect():
    print("[Socket] Frontend Connected")

@socketio.on('behavior_event')
def handle_behavior_event(data):
    user_id = data.get('userId', 'anonymous_user')
    
    # 1. Add new action to the buffer queue
    user_buffers[user_id].append(data)
    print(f"[-] Received event. Buffer size: {len(user_buffers[user_id])}/{BUFFER_SIZE_LIMIT}")
    
    # 2. Once we collect enough data in this window, we evaluate it!
    if len(user_buffers[user_id]) >= BUFFER_SIZE_LIMIT:
        print("\n[ML Engine] Window full! Running Scikit-Learn evaluation...")
        
        # Run ML Prediction
        risk_score, is_anomaly = ml_detector.analyze_behavior(user_buffers[user_id])
        print(f"[ML Engine] Result -> Risk Score: {risk_score:.2f} | Anomaly: {is_anomaly}")
        
        # Decide Action based on Risk
        action = 'NONE'
        if risk_score >= 0.8:
            action = 'LOGOUT'
        elif risk_score >= 0.5:
            action = 'REQUIRE_OTP'

        # Send Adaptive Security Response back to frontend
        emit('security_action', {
            'riskScore': risk_score,
            'isAnomaly': is_anomaly,
            'action': action,
            'message': 'Suspicious Activity! Terminating Session.' if is_anomaly else 'Behavior verified.'
        })

        # Clear buffer to start the next tracking window
        print("--------------------------------------------------\n")
        user_buffers[user_id].clear()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    # debug=True allows hot-reloading when you change code locally
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
