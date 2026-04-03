import numpy as np
from sklearn.ensemble import IsolationForest

class BehaviorAnomalyDetector:
    def __init__(self):
        # Isolation Forest is perfect for outlier/anomaly detection!
        self.model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
        
        # Pre-training the model with "Normal User Base Behavior"
        # Features represent: [typingSpeed (WPM), mouseSpeed (px/sec), errorRate]
        # This simulates a user who types around 60 WPM, uses the mouse calmly, and has a 5% error rate.
        normal_data = np.array([
            [60, 200, 0.05],
            [65, 210, 0.04],
            [55, 190, 0.06],
            [62, 205, 0.05],
            [70, 220, 0.03],
            [50, 180, 0.08]
        ])
        
        self.model.fit(normal_data)

    def analyze_behavior(self, buffer_data):
        """
        Analyzes a 'window' of recent behavior and returns Risk Score & Anomaly Status
        """
        if not buffer_data:
            return 0.0, False
            
        # 1. Aggregate the 5 seconds of data into averages
        avg_typing = np.mean([item.get('typingSpeed', 60) for item in buffer_data])
        avg_mouse = np.mean([item.get('mouseSpeed', 200) for item in buffer_data])
        avg_error = np.mean([item.get('errorRate', 0.05) for item in buffer_data])
        
        # 2. Format for Scikit-Learn
        current_behavior = np.array([[avg_typing, avg_mouse, avg_error]])
        
        # 3. Predict: 1 = Normal, -1 = Anomaly (Hacker/Imposter)
        prediction = self.model.predict(current_behavior)[0]
        
        # 4. Generate a Smooth Risk Score based on how far out of bounds they are
        anomaly_score = self.model.decision_function(current_behavior)[0]
        risk_score = min(max(-anomaly_score + 0.5, 0.0), 1.0) 
        
        is_anomaly = bool(prediction == -1)
        
        return float(risk_score), is_anomaly
