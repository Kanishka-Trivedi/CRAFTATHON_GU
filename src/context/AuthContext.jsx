import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { dummyUser } from '../data/dummy';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Real ML Engine State
  const [trustScore, setTrustScore] = useState(0.85); // 1.0 (safe) to 0.0 (danger)
  const [riskLevel, setRiskLevel] = useState('safe'); // 'safe', 'watch', 'danger'
  const [isEnrolled, setIsEnrolled] = useState(true);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [keystrokes, setKeystrokes] = useState([]);
  
  // Restore user session on reload if token exists
  useEffect(() => {
    const token = localStorage.getItem('behaveguard_token');
    if (token && !user) {
        setUser(dummyUser);
    }
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

  // 1. EVENT LISTENERS
  useEffect(() => {
    const handleKeyDown = (e) => {
      const now = Date.now();
      keyDownTime.current[e.key] = now;
      
      const flightTime = now - lastKeyTime.current;
      metricsBuffer.current.keyFlights.push(flightTime);
      metricsBuffer.current.charCount++;
      
      // Update general idle time tracking
      const idleTime = (now - lastActionTime.current) / 1000;
      if (idleTime > 0.5) metricsBuffer.current.idleTimes.push(idleTime);
      
      lastActionTime.current = now;
      lastKeyTime.current = now;
      
      // Visual feedback update
      setKeystrokes(prev => {
        const next = [...prev, { key: e.key, flightTime, timestamp: now }];
        return next.length > 50 ? next.slice(-50) : next;
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
        const dt = (now - lastTime) / 1000; // seconds
        if (dt > 0) {
            metricsBuffer.current.mouseSpeeds.push(dist / dt);
        }
      }
      
      const idleTime = (now - lastActionTime.current) / 1000;
      if (idleTime > 2.0) metricsBuffer.current.idleTimes.push(idleTime); // only log major idle times for mouse
      
      lastMousePos.current = { x: e.clientX, y: e.clientY, time: now };
      lastActionTime.current = now;
    };

    const handleScroll = () => {
        const now = Date.now();
        const dt = (now - lastScrollTime.current) / 1000;
        if (dt > 0.05) {
            // Rough approximation of scroll speed logging (could be tied to window.scrollY delta)
            // But to keep it simple and high-performing, we'll log frequency.
            metricsBuffer.current.scrollSpeeds.push(500); // placeholder value representing scroll intensity
            lastScrollTime.current = now;
        }
        lastActionTime.current = now;
    };

    const handleClick = (e) => {
        const now = Date.now();
        // Calculate deviation from center of the target element
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
  }, []);

  // 2. INTERVAL EVALUATION (Every 5 seconds)
  useEffect(() => {
    // Only send if the user is technically logged in to our fake system
    // (You can remove this user check if you want scoring on the login page too)
    
    let interval;
    if (user) {
        interval = setInterval(async () => {
            const b = metricsBuffer.current;
            
            // Average helper
            const avg = (arr, defaultVal) => arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : defaultVal;
            
            // Compile Payload for ML backend
            let payload = {
                user_id: user.id || "user_001",
                typing_speed: b.charCount / 5.0, // chars over the 5 second window
                key_hold_avg_ms: avg(b.keysHeld, 110),
                key_flight_avg_ms: avg(b.keyFlights, 150),
                mouse_velocity: avg(b.mouseSpeeds, 360),
                scroll_speed: avg(b.scrollSpeeds, 300), // Default to 300 if no scroll
                idle_time_s: avg(b.idleTimes, 5.0),
                click_deviation_px: avg(b.clickDeviations, 8)
            };

            // Reset Buffer
            metricsBuffer.current = {
                keysHeld: [], keyFlights: [], mouseSpeeds: [], scrollSpeeds: [],
                idleTimes: [], clickDeviations: [], charCount: 0
            };

            console.log("Sending payload to ML Engine:", payload);

            try {
                // Call FastAPI backend
                const response = await fetch("http://localhost:8001/score", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Invert risk_score (0-100) to trustScore (1.0-0.0)
                    const newTrust = 1.0 - (data.risk_score / 100);
                    setTrustScore(newTrust);

                    // Update UI Risk Level based on text from ML engine
                    // ML Engine returns LOW, MEDIUM, HIGH
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
                console.error("Failed to reach ML Engine. Is it running on port 8001?", error);
            }

        }, 5000);
    }

    return () => clearInterval(interval);
  }, [user]);

  const login = (email, password) => {
    localStorage.setItem('behaveguard_token', 'dummy_token');
    setUser(dummyUser);
  };

  const logout = () => {
    localStorage.removeItem('behaveguard_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, setUser, trustScore, setTrustScore, riskLevel, isEnrolled, setIsEnrolled,
      sessionEvents, setSessionEvents, keystrokes, login, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
