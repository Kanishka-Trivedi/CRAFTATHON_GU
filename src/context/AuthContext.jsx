import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';
axios.defaults.withCredentials = true;

const AuthContext = createContext();

const dummyUser = {
  id: "user_001",
  name: "Rahul Mehta",
  email: "rahul.mehta@gmail.com",
  avatar: "👤",
  balance: 124500,
  isEnrolled: true,
  trustScore: 0.85
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Real ML Engine State
  const [trustScore, setTrustScore] = useState(0.85); // 1.0 (safe) to 0.0 (danger)
  const [riskLevel, setRiskLevel] = useState('safe'); // 'safe', 'watch', 'danger'
  
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [keystrokes, setKeystrokes] = useState([]);
  
  // Restore user session on reload (Checks backend for real cookie)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`);
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Not logged in yet
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);
  
  // Buffers for 5-second aggregation
  const metricsBuffer = useRef({
    keysHeld: [],
    keyFlights: [],
    mouseSpeeds: [],
    scrollSpeeds: [],
    idleTimes: [],
    clickDeviations: [],
    charCount: 0
  });

  // Tracking state refs
  const lastActionTime = useRef(Date.now());
  const keyDownTime = useRef({});
  const lastKeyTime = useRef(Date.now());
  const lastMousePos = useRef({ x: null, y: null, time: Date.now() });
  const lastScrollTime = useRef(Date.now());

  // 1. EVENT LISTENERS (Behavioural Core)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const now = Date.now();
      keyDownTime.current[e.key] = now;
      
      const flightTime = now - lastKeyTime.current;
      metricsBuffer.current.keyFlights.push(flightTime);
      metricsBuffer.current.charCount++;
      
      const idleTime = (now - lastActionTime.current) / 1000;
      if (idleTime > 0.5) metricsBuffer.current.idleTimes.push(idleTime);
      
      lastActionTime.current = now;
      lastKeyTime.current = now;
      
      setKeystrokes(prev => {
        const updatedKeys = [...prev, { key: e.key, flightTime, timestamp: now }];
        return updatedKeys.length > 50 ? updatedKeys.slice(-50) : updatedKeys;
      });
    };

    const handleKeyUp = (e) => {
      const now = Date.now();
      const startTime = keyDownTime.current[e.key];
      if (startTime) {
        const holdTime = now - startTime;
        metricsBuffer.current.keysHeld.push(holdTime);
        delete keyDownTime.current[e.key];
        
        setKeystrokes(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.key === e.key) {
            last.holdTime = holdTime;
          }
          return updated;
        });
      }
    };

    const handleMouseMove = (e) => {
      const now = Date.now();
      const { x: lastX, y: lastY, time: lastTime } = lastMousePos.current;
      
      if (lastX !== null && lastY !== null && now - lastTime > 50) {
        const dist = Math.sqrt(Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2));
        const dt = (now - lastTime) / 1000;
        if (dt > 0) metricsBuffer.current.mouseSpeeds.push(dist / dt);
      }
      
      lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      lastActionTime.current = now;
    };

    const handleScroll = () => {
        const now = Date.now();
        metricsBuffer.current.scrollSpeeds.push(500);
        lastActionTime.current = now;
    };

    const handleClick = (e) => {
        const now = Date.now();
        const rect = e.target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2));
        metricsBuffer.current.clickDeviations.push(dist);
        lastActionTime.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, [user]);

  // 2. ML ENGINE EVALUATION (Every 5 seconds)
  useEffect(() => {
    let interval;
    if (user) {
        interval = setInterval(async () => {
            const b = metricsBuffer.current;
            const avg = (arr, defaultVal) => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : defaultVal;
            
            let payload = {
                user_id: user.id || user._id || "user_001",
                typing_speed: b.charCount / 5.0,
                key_hold_avg_ms: avg(b.keysHeld, 110),
                key_flight_avg_ms: avg(b.keyFlights, 150),
                mouse_velocity: avg(b.mouseSpeeds, 360),
                scroll_speed: avg(b.scrollSpeeds, 300),
                idle_time_s: avg(b.idleTimes, 5.0),
                click_deviation_px: avg(b.clickDeviations, 8)
            };

            metricsBuffer.current = {
                keysHeld: [], keyFlights: [], mouseSpeeds: [], scrollSpeeds: [],
                idleTimes: [], clickDeviations: [], charCount: 0
            };

            try {
                const response = await fetch("http://localhost:8001/score", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const newTrust = 1.0 - (data.risk_score / 100);
                    setTrustScore(parseFloat(newTrust.toFixed(2)));

                    if (data.risk_level === 'LOW') setRiskLevel('safe');
                    else if (data.risk_level === 'MEDIUM') setRiskLevel('watch');
                    else setRiskLevel('danger');
                    
                    if (data.anomalies && data.anomalies.length > 0) {
                        setSessionEvents(prev => [
                            { timestamp: new Date().toISOString(), type: 'anomaly', message: data.anomalies[0]},
                            ...prev
                        ]);
                    }
                }
            } catch (error) {
                // Drift Simulation (Demo Fallback)
                setTrustScore(prev => {
                    const drift = (Math.random() - 0.48) * 0.04;
                    return parseFloat(Math.max(0, Math.min(1, prev + drift)).toFixed(2));
                });
            }
        }, 5000);
    }
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/signup`, userData);
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Signup failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, trustScore, setTrustScore, riskLevel, isEnrolled, setIsEnrolled,
      sessionEvents, setSessionEvents, keystrokes, login, signup, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
