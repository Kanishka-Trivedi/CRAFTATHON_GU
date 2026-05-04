"use client";
import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GlobalSecurityGate = () => {
  const { user, trustScore, riskLevel, sessionEvents, isWarmingUp, resetTrustScore, lockAccount, unlockAccount, setUser, strikeCount, addStrike, logout } = useAuth();
  
  const [warning, setWarning] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');

  const pinLockActive = useRef(false);
  const lastVerifiedTime = useRef(0);
  const lastWarningTime = useRef(0);
  const sessionStartTime = useRef(Date.now());

  // ── Unified Security Hub — Only ONE instance of lockdown possible ──
  useEffect(() => {
    // 0. Grace Period: Allow session to settle for 10s after login
    const isSessionNew = (Date.now() - sessionStartTime.current) < 3000;

    // A. Priority: Database Lockdown (Persistence)
    // If the DB says we are locked, show the modal.
    if (user?.isLocked && !pinLockActive.current && !isSessionNew) {
      pinLockActive.current = true;
      setShowPinModal(true);
      return;
    }

    // B. Incident: Real-time Behavioral Breach
    if (riskLevel === 'danger' && trustScore < 0.2 && !isWarmingUp && !pinLockActive.current && !user?.isLocked) {
      if (strikeCount >= 3) {
        logout();
        return;
      }
      pinLockActive.current = true;
      lockAccount();
      setWarning(null);
      setShowPinModal(true);
    }
  }, [riskLevel, isWarmingUp, user?.isLocked, user, strikeCount, trustScore]);

  // ── Security — WATCH banner only <50% score, throttled 45 s ──────────────
  useEffect(() => {
    if (isWarmingUp) return;
    const now = Date.now();
    if (
      riskLevel === 'watch' &&
      trustScore !== null &&
      trustScore < 0.5 &&
      !showPinModal &&
      now - lastWarningTime.current > 45000
    ) {
      const msg = sessionEvents?.length > 0
        ? sessionEvents[0].message
        : `Unusual pattern detected — session health at ${Math.round(trustScore * 100)}%`;
      setWarning(msg);
      lastWarningTime.current = now;
      const t = setTimeout(() => setWarning(null), 4000);
      return () => clearTimeout(t);
    }
    if (riskLevel === 'safe') setWarning(null);
  }, [riskLevel, trustScore, showPinModal, sessionEvents, isWarmingUp]);

  // ── PIN submit ────────────────────────────────────────────────────────────
  const handlePinSubmit = async () => {
    setPinError('');
    const pin = pinInput.join('');
    if (pin.length !== 6) { setPinError('Enter all 6 digits.'); return; }
    
    const res = await unlockAccount(pin);
    if (!res.success) {
      setPinError(res.message || 'Wrong PIN.');
      addStrike();
    } else {
      setShowPinModal(false);
      setPinInput(['', '', '', '', '', '']);
      setPinError('');
      pinLockActive.current = false;
      lastVerifiedTime.current = Date.now();
    }
  };

  // If no user is logged in, do not render security gate UI
  if (!user) return null;

  return (
    <>
      {/* ── Amber warning banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {warning && !showPinModal && (
          <motion.div
            key="warn-banner"
            initial={{ opacity: 0, y: -28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-3 px-8 py-4 rounded-2xl border border-amber-400/30 bg-amber-500/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-xl w-[92%]"
          >
            <AlertCircle size={20} className="text-amber-400 shrink-0 animate-pulse" />
            <span className="text-amber-100 text-sm font-semibold leading-snug">{warning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PIN modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            key="pin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/75 backdrop-blur-lg"
          >
            <motion.div
              initial={{ scale: 0.94, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-[#0E0C1E] border border-white/10 rounded-[32px] p-10 text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <Lock size={30} className="text-red-400" />
              </div>
              <h3 className="font-sora font-bold text-2xl mb-2 text-white">Confirm Your PIN</h3>
              <p className="text-white/40 text-xs leading-relaxed mb-1">
                Enter your <span className="text-white/80 font-semibold">6-digit security PIN</span> to resume.
              </p>
              <p className={clsx(
                "text-[10px] font-bold uppercase tracking-widest mb-4",
                strikeCount >= 3 ? "text-orange-400" : "text-red-400/70"
              )}>
                {strikeCount === 0 ? 'Security Check: Strike 1/3' : (strikeCount >= 3 ? 'FINAL WARNING: STRIKE 3/3' : `Security Check: Strike ${strikeCount}/3`)}
              </p>

              {strikeCount >= 3 && (
                <p className="text-orange-300/80 text-[9px] font-black uppercase tracking-[0.2em] mb-4 bg-orange-500/10 py-2 rounded-lg border border-orange-500/20">
                  Next Anomaly = Auto-Logout
                </p>
              )}

              <div className="flex justify-center gap-2 mb-5">
                {pinInput.map((val, idx) => (
                  <input
                    key={idx}
                    id={`global-pin-${idx}`}
                    value={val}
                    inputMode="numeric"
                    maxLength={1}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 1);
                      const next = [...pinInput]; next[idx] = v; setPinInput(next);
                      if (v && idx < 5) document.getElementById(`global-pin-${idx + 1}`)?.focus();
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !pinInput[idx] && idx > 0)
                        document.getElementById(`global-pin-${idx - 1}`)?.focus();
                    }}
                    className="w-11 h-13 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-white"
                  />
                ))}
              </div>

              <AnimatePresence>
                {pinError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-xs font-semibold mb-4"
                  >
                    {pinError}
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                onClick={handlePinSubmit}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent to-accent/70 text-white font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-all duration-300"
              >
                Verify &amp; Resume
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
