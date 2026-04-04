# BehaveGuard: Continuous Behavioral Authentication for Banking

![BehaveGuard Banner](https://img.shields.io/badge/Security-FinTech-accent) 
![Architecture](https://img.shields.io/badge/Stack-Next.js%20|%20FastAPI%20|%20Express%20|%20MongoDB-blue)

## 🎯 Problem Statement
**Problem Statement 16: Behaviour Based Continuous Authentication For Banking**  
**Theme:** FinTech

### Objective
The objective of this project is to design an intelligent authentication system that continuously validates a user’s identity based on behavioral biometrics such as typing patterns, touch interactions, navigation habits, and device usage. The system leverages machine learning to learn normal user behavior, detect anomalies in real time, and trigger adaptive security responses when suspicious activity is identified.

---

## 🚀 Core Features & Implementation

### 1. Behavioral Data Collection
*   **Keystroke Dynamics**: Captures typing speed (CPS), key hold times (ms), and flight times between keys.
*   **Mouse/Touch Flow**: Monitors velocity, acceleration, and click deviation patterns.
*   **Navigation Habits**: Tracks scroll depth and page interaction frequency to build a unique user "DNA".

### 2. Continuous Authentication Engine
*   **Real-Time Monitoring**: A high-frequency telemetry hook stream that syncs user behavior with our AI backend every 5 seconds.
*   **ML-Based Profiling**: Uses a **StandardScaler + Isolation Forest** pipeline to create a mathematical representation of the genuine owner.

### 3. Anomaly Detection System
*   **AI-Driven Analysis**: Differentiates between normal fluctuations and malicious fraud using anomaly scoring.
*   **3-Second Security Window**: Detects deviations in real-time and pauses the session before sensitive actions can occur.

### 4. Adaptive Security Response
*   **Active Defense**: Triggers a **Behavioral PIN Challenge** or a mandatory **Session Termination** based on the severity of the anomaly.
*   **Persistent Lockdown**: Syncs the lock state to the database, ensuring security persists even after a page refresh.

### 5. User Transparency & Control
*   **Behavioral Audit Ledger**: An interactive dashboard showing every transaction tied to its specific authentication score.
*   **Security Passport**: A visual representation of the user's "Security Node" and session health.

---

## 🛠️ Technology Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion (Glassmorphism UI)
- **Security API**: FastAPI (Python 3.10)
- **Auth & Database Backend**: Express.js, Node.js, MongoDB Atlas (Mongoose)
- **Machine Learning**: Scikit-Learn (Isolation Forest Algorithm), NumPy, Pandas

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js & npm
- Python 3.10+
- MongoDB Atlas account (or local MongoDB)

### 2. Environment Setup
Create a `.env` file in the root and `backend/` folders:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_security_secret
NEXT_PUBLIC_ML_ENGINE_URL=http://localhost:8001
```

### 3. Installation & Execution

#### **Backend (Express)**
```bash
cd backend
npm install
node server.js
```

#### **ML Engine (FastAPI)**
```bash
cd behaviorauth
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8001
```

#### **Frontend (Next.js)**
```bash
npm install
npm run dev
```

---

## 🛡️ Security Philosophy
BehaveGuard operates on a **Zero-Storage Philosophy** for biometrics. We do not store images or recordings; instead, we store the **mathematical rhythm** of your interaction. This ensures maximum privacy while providing bank-grade security.

---
**Developed for CRAFTATHON_GU**  
*Final Production State - 2026*