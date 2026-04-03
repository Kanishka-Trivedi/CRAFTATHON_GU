import socketio
import time
import random

sio = socketio.Client()

@sio.event
def connect():
    print("[Test Client] Connected to ML Server!")

@sio.event
def security_action(data):
    print("\n🚨 [ALERT FROM SERVER] 🚨")
    print(f"Received Command: {data}")
    print("--------------------------\n")

sio.connect('http://127.0.0.1:5000')

print("🟢 SIMULATING: THE REAL USER IS LOGGED IN")
print("Sending 5 'Normal' Behavior events (60 WPM, slow mouse)...")
for _ in range(5):
    sio.emit('behavior_event', {
        'userId': 'user_123',
        'typingSpeed': random.randint(55, 65),
        'mouseSpeed': random.randint(180, 210),
        'errorRate': 0.05
    })
    time.sleep(0.5)

time.sleep(3)

print("\n🔴 SIMULATING: AN IMPOSTER TOOK OVER The DEVICE!")
print("Sending 5 'Abnormal' Behavior events (Extremely fast, spastic mouse, high errors)...")
for _ in range(5):
    sio.emit('behavior_event', {
        'userId': 'user_123',
        'typingSpeed': random.randint(150, 180), # Unnaturally fast
        'mouseSpeed': random.randint(800, 1000), # Spastic/Bot mouse movements
        'errorRate': 0.20
    })
    time.sleep(0.5)

# Wait just long enough for the final packet to log
time.sleep(2)
sio.disconnect()
