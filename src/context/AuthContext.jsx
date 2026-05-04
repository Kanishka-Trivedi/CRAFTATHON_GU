"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/auth`;
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [trustScore, setTrustScore] = useState(1);
  const [riskLevel, setRiskLevel] = useState('safe');
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const [strikeCount, setStrikeCount] = useState(0);
  const currentSessionId = useRef(`sess-${Math.random().toString(36).substring(7)}-${Date.now()}`);

  const [liveMetrics, setLiveMetrics] = useState({
    typingSpeed: 0,
    mouseSpeed: 0,
    scrollSpeed: 0,
    keyHold: 0,
    keyFlight: 0
  });

  const [sessionEvents, setSessionEvents] = useState([]);

  const buffer = useRef({
    keysHeld: [],
    keyFlights: [],
    mouseSpeeds: [],
    scrollSpeeds: [],
    idleTimes: [],
    clickDeviations: [],
    touchSpeeds: [],
    charCount: 0
  });

  const lastKeyTime = useRef(Date.now());
  const keyDownTime = useRef({});
  const lastMouse = useRef({ x: null, y: null, time: Date.now() });
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const lastTouch = useRef({ y: null, time: Date.now() });
  const lastActionTime = useRef(Date.now());
  const intervalStart = useRef(Date.now());
  const sessionStart = useRef(Date.now());
  const peakMouseRef = useRef(0);

  const avg = (arr, d = 0) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : d;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Auth: check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${API_URL}/me`);
        if (response.data.success) {
          setUser(response.data.user);
          setStrikeCount(response.data.user.strikeCount || 0);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.success) { 
        setUser(res.data.user); 
        setStrikeCount(res.data.user.strikeCount || 0);
        return { success: true }; 
      }
    } catch (e) { return { success: false, message: e.response?.data?.message || 'Login failed' }; }
  };

  const signup = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/signup`, data);
      if (res.data.success) { 
        setUser(res.data.user); 
        setStrikeCount(0);
        return { success: true }; 
      }
    } catch (e) { return { success: false, message: e.response?.data?.message || 'Signup failed' }; }
  };

  const logout = async () => {
    try { 
      await axios.post(`${API_URL}/logout`); 
    } catch (e) { 
      console.error('Logout error', e); 
    } finally {
      setUser(null); 
      setStrikeCount(0);
    }
  };

  const updateProfile = async (data) => {
    try {
      const res = await axios.patch(`${API_URL}/profile`, data);
      if (res.data.success) { setUser(res.data.user); return { success: true }; }
    } catch (e) { return { success: false, message: 'Update failed' }; }
  };

  const updateAvatar = async (base64) => {
    try {
      const res = await axios.patch(`${API_URL}/profile/avatar`, { avatar: base64 });
      if (res.data.success) {
        setUser(prev => ({ ...prev, avatar: base64 }));
        return { success: true };
      }
    } catch (e) { return { success: false, message: 'Avatar upload failed' }; }
  };

  const lockAccount = async () => {
    try {
      const res = await axios.post(`${API_URL}/lock`);
      if (res.data.success) {
        setStrikeCount(res.data.strikeCount);
        setUser(prev => ({ ...prev, isLocked: true, strikeCount: res.data.strikeCount }));
      }
    } catch (e) { console.error('Lock sync failed'); }
  };

  const unlockAccount = async (pin) => {
    try {
      const res = await axios.post(`${API_URL}/verify-pin`, { pin });
      if (res.data.success) {
        setUser(prev => ({ ...prev, isLocked: false }));
        setTrustScore(1.0);
        setRiskLevel('safe');
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Verification failed' };
    }
  };

  // Data collection (keyboard, mouse, scroll)
  useEffect(() => {
    const keydown = (e) => {
      const now = Date.now();
      const flight = now - lastKeyTime.current;
      buffer.current.keyFlights.push(flight);
      buffer.current.charCount++;
      buffer.current.idleTimes.push((now - lastActionTime.current) / 1000);
      keyDownTime.current[e.key] = now;
      lastKeyTime.current = now;
      lastActionTime.current = now;
    };

    const keyup = (e) => {
      const now = Date.now();
      const start = keyDownTime.current[e.key];
      if (start) { buffer.current.keysHeld.push(now - start); delete keyDownTime.current[e.key]; }
    };

    const mouse = (e) => {
      const now = Date.now();
      const { x, y, time } = lastMouse.current;
      if (x !== null) {
        const dist = Math.hypot(e.clientX - x, e.clientY - y);
        const dt = (now - time) / 1000;
        if (dt > 0.001) {
          const speed = dist / dt;
          buffer.current.mouseSpeeds.push(speed);
          if (speed > peakMouseRef.current) peakMouseRef.current = speed; // Capture peak!
        }
      }
      lastMouse.current = { x: e.clientX, y: e.clientY, time: now };
      lastActionTime.current = now;
    };

    const scroll = () => {
      const now = Date.now();
      const dy = Math.abs(window.scrollY - lastScrollY.current);
      const dt = (now - lastScrollTime.current) / 1000;
      if (dt > 0) buffer.current.scrollSpeeds.push(dy / dt);
      lastScrollY.current = window.scrollY;
      lastScrollTime.current = now;
      lastActionTime.current = now;
    };

    const touchStart = (e) => {
      lastTouch.current = { y: e.touches[0].clientY, time: Date.now() };
    };

    const touchEnd = (e) => {
      const now = Date.now();
      const dy = Math.abs(e.changedTouches[0].clientY - lastTouch.current.y);
      const dt = (now - lastTouch.current.time) / 1000;
      if (dt > 0) buffer.current.touchSpeeds.push(dy / dt);
      lastActionTime.current = now;
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("mousemove", mouse);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchend", touchEnd, { passive: true });

    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("mousemove", mouse);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchend", touchEnd);
    };
  }, []);

  // Warmup window: 5s after login/user change
  useEffect(() => {
    if (!user) { setIsWarmingUp(true); return; }
    sessionStart.current = Date.now();
    setIsWarmingUp(true);
    const t = setTimeout(() => {
      setIsWarmingUp(false);
      setTrustScore(1.0);    
      setRiskLevel('safe');
    }, 5000);
    return () => clearTimeout(t);
  }, [user]);

  // ML evaluation and scoring (every 1s)
  useEffect(() => {
    if (!user) return;

    intervalStart.current = Date.now();
    const interval = setInterval(async () => {
      const now = Date.now();
      const duration = Math.max(0.001, (now - intervalStart.current) / 1000);
      intervalStart.current = now;

      const b = buffer.current;
      const avgOrZero = (arr) => arr.length ? arr.reduce((a, v) => a + v, 0) / arr.length : 0;

      const typingSpeed = clamp(b.charCount / duration, 0, 20);
      const keyHoldAvg = avgOrZero(b.keysHeld);
      const keyFlightAvg = avgOrZero(b.keyFlights);
      const mouseVelocity = peakMouseRef.current; // Read from the "Safe Box"
      const scrollSpeedVal = b.scrollSpeeds.length ? Math.max(...b.scrollSpeeds) : 0;
      const idleTimeVal = avgOrZero(b.idleTimes);
      const clickDevVal = avgOrZero(b.clickDeviations);

      // Determine if session is idle
      const isIdle = b.charCount === 0 && b.mouseSpeeds.length === 0 && b.scrollSpeeds.length === 0 && mouseVelocity === 0;

      // Reset buffer and PEAK tracker
      buffer.current = { keysHeld: [], keyFlights: [], mouseSpeeds: [], scrollSpeeds: [], idleTimes: [], clickDeviations: [], touchSpeeds: [], charCount: 0 };
      peakMouseRef.current = 0; 

      if (isIdle) return;

      const payload = {
        user_id: user?._id || user?.id || 'anon',
        typing_speed: clamp(typingSpeed, 0, 100),
        key_hold_avg_ms: keyHoldAvg > 0 ? clamp(keyHoldAvg, 0, 2000) : 110,
        key_flight_avg_ms: keyFlightAvg > 0 ? clamp(keyFlightAvg, 0, 3000) : 150,
        mouse_velocity: mouseVelocity,
        scroll_speed: scrollSpeedVal,
        idle_time_s: clamp(idleTimeVal, 0, 300),
        click_deviation_px: clamp(clickDevVal, 0, 5000),
        baseline: user?.behavioralBaseline || {}
      };

      // Score evaluation logic

      try {
        const mlUrl = process.env.NEXT_PUBLIC_ML_ENGINE_URL || "http://localhost:8001";
        const res = await fetch(`${mlUrl}/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();

          if (typeof data.risk_score === 'number') {
            setTrustScore(prev => {
              const instantTrust = 1 - (data.risk_score / 100);
              if (prev === null) return instantTrust;

              const alpha = 0.3; // Stable Production Smoothing
              const newTrust = (alpha * instantTrust) + (1 - alpha) * prev;

              if (newTrust >= 0.6) setRiskLevel("safe");
              else if (newTrust >= 0.2) setRiskLevel("watch");
              else setRiskLevel("danger");

              return parseFloat(newTrust.toFixed(2));
            });
          }
          // Track anomaly messages from backend regardless of threshold logic
          if (data.anomalies?.length > 0) {
            setSessionEvents(prev => [
              { timestamp: new Date().toISOString(), type: 'anomaly', message: data.anomalies[0] },
              ...prev.slice(0, 49)
            ]);
          }
        }
      } catch (e) { 
        console.error('ML Fetch Error:', e); 
      }
    }, 1000);

    // High-frequency UI update (100ms) for Typing/Mouse meters
    let lastCharCount = 0;
    const uiInterval = setInterval(() => {
      const b = buffer.current;
      const avgOrZero = (arr) => arr.length ? arr.reduce((a, v) => a + v, 0) / arr.length : 0;

      setLiveMetrics(prev => {
        const currentMouse = avgOrZero(b.mouseSpeeds);
        const charsTyped = b.charCount - lastCharCount;
        lastCharCount = b.charCount;
        const currentTyping = charsTyped / 0.1; // true cps in this 100ms window

        return {
          ...prev,
          mouseSpeed: currentMouse > 0 ? parseFloat(currentMouse.toFixed(0)) : parseFloat((prev.mouseSpeed * 0.8).toFixed(0)), // smooth decay
          typingSpeed: currentTyping > 0 ? parseFloat(currentTyping.toFixed(2)) : parseFloat((prev.typingSpeed * 0.9).toFixed(2)),
          keyHold: avgOrZero(b.keysHeld) || prev.keyHold,
          keyFlight: avgOrZero(b.keyFlights) || prev.keyFlight,
          scrollSpeed: avgOrZero(b.scrollSpeeds) || prev.scrollSpeed
        };
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(uiInterval);
    };
  }, [user]);

  // Background sync (every 30s) — sends latest metrics snapshot to Node backend
  useEffect(() => {
    if (!user) return;
    const syncInterval = setInterval(async () => {
      const syncPayload = {
        sessionId: currentSessionId.current,
        trustScore,
        riskLevel,
        strikeCount,
        metrics: {
          typingSpeed: liveMetrics.typingSpeed,
          keyHold: liveMetrics.keyHold,
          keyFlight: liveMetrics.keyFlight,
          mouseVelocity: liveMetrics.mouseSpeed,
          scrollSpeed: liveMetrics.scrollSpeed,
          idleTime: 0
        }
      };
      try {
        await axios.post('http://localhost:5000/api/behavioral/sync-session', syncPayload);
        console.log('[SYNC] Session snapshot saved:', currentSessionId.current);
      } catch (e) { }
    }, 30000);
    return () => clearInterval(syncInterval);
  }, [user, trustScore, riskLevel, liveMetrics, strikeCount]);

  const resetTrustScore = () => {
    setTrustScore(1.0);
    setRiskLevel('safe');
  };

  const addStrike = () => {
    setStrikeCount(prev => prev + 1);
  };

  // Auto-logout is handled directly by the dashboard to prevent ghost modals

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loading,
      trustScore,
      setTrustScore,
      riskLevel,
      setRiskLevel,
      strikeCount,
      addStrike,
      isWarmingUp,
      liveMetrics,
      sessionEvents,
      login,
      signup,
      logout,
      updateProfile,
      updateAvatar,
      resetTrustScore,
      lockAccount,
      unlockAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
