"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldAlert, CheckCircle2, AlertCircle, Activity, ArrowRight, User, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, NavBar, TrustBadge, RiskBar } from '../../components/Shared';
import { GlobalSpotlight } from '../../components/MagicSpotlight';
import { useRef } from 'react';

import { clsx } from 'clsx';

const TransferPage = () => {
  const { user, trustScore, riskLevel } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const gridRef = useRef(null);
  const [formData, setFormData] = useState({
    account: '',
    amount: '',
    note: '',
    cardNumber: '',
    cardExpiry: '',
    cvv: ''
  });
  const [balance, setBalance] = useState(50000);
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPinChallenge, setShowPinChallenge] = useState(false);
  const [pinInput, setPinInput] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');

  // 1. Fetch current telemetry and financial state
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/transfer/history', {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
          setHistory(data.history);
        }
      } catch (err) {
        console.error('Telecommunications failure with ledger.');
      }
    };
    if (user) fetchData();
  }, [user]);

  // 2. Continuous security monitor
  useEffect(() => {
    if (trustScore < 0.3 && formData.account.length > 3) {
      router.push('/reauth', { state: { returnPath: '/transfer', reason: 'High-risk keystroke signature' } });
    }
  }, [trustScore, formData.account, router]);

  const handleSubmit = async (e) => {
    console.log('[DEBUG] handleSubmit triggered. Amount:', formData.amount, 'TrustScore:', trustScore);
    if (e) e.preventDefault();
    setPinError('');

    if (!formData.account || !formData.amount || !formData.cardNumber || !formData.cvv) {
      setPinError('Recipient Email, Amount, Card Number and CVV are all required for behavioral analysis.');
      console.error('[DEBUG] Form validation failed: Mandatory fields missing.');
      return;
    }

    // Security Gate: Check if we need PIN verification
    // Trigger if trustScore is low OR for large amounts (> 10000)
    if ((trustScore < 0.6 || Number(formData.amount) > 10000) && !showPinChallenge) {
      setShowPinChallenge(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        recipientEmail: formData.account,
        amount: Number(formData.amount),
        note: formData.note,
        cardDetails: {
          number: formData.cardNumber,
          expiry: formData.cardExpiry,
          cvv: formData.cvv
        },
        pin: pinInput.join('')
      };

      const res = await fetch('http://localhost:5000/api/transfer/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setBalance(prev => prev - Number(formData.amount));
        setShowPinChallenge(false);
      } else {
        setPinError(data.message || 'Transaction rejected by security protocol.');
        if (data.message.includes('PIN')) {
          // If PIN fails, we keep the modal open to retry
        } else {
          setShowPinChallenge(false);
        }
      }
    } catch (err) {
      setPinError('Telecommunication error with ledger node.');
    }
    setIsSubmitting(false);
  };

  const [metrics, setMetrics] = useState({
    typingSpeed: 65,
    holdTime: 142,
    rhythm: 88,
    swipe: 92
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        typingSpeed: Math.max(40, Math.min(100, metrics.typingSpeed + (Math.random() - 0.5) * 5)),
        holdTime: Math.max(100, Math.min(200, metrics.holdTime + (Math.random() - 0.5) * 10)),
        rhythm: Math.max(60, Math.min(100, metrics.rhythm + (Math.random() - 0.5) * 8)),
        swipe: Math.max(70, Math.min(100, metrics.swipe + (Math.random() - 0.5) * 6))
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [metrics]);

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main ref={gridRef} className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen bento-section",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <GlobalSpotlight gridRef={gridRef} />
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl">Secure Transfer</h1>
            <p className="text-secondary mt-1">Funds are protected by continuous authentication</p>
          </div>
          <TrustBadge score={trustScore} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Transfer Form */}
          <GlassCard className="p-10 border-white/5 relative overflow-hidden magic-bento-card magic-bento-card--border-glow">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-3 px-1">
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary">Recipient Node Email</label>
                        <span className="text-[10px] font-black text-indigo-400">Balance: ₹{(balance || 0).toLocaleString()}</span>
                      </div>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                        <input
                          type="email"
                          placeholder="node-0x12@behaveguard.io"
                          value={formData.account}
                          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-lg tracking-widest transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-bold text-xl transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Purpose</label>
                        <input
                          type="text"
                          placeholder="Note"
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
                        />
                      </div>
                    </div>

                    {/* Highly Secure Card Entry Section */}
                    <div className="pt-4 space-y-6">
                      <div className="relative group">
                        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 px-1">Source Authentication Card (Secure Entry)</label>
                        <input
                          type="text"
                          placeholder="4000 0000 0000 0012"
                          value={formData.cardNumber}
                          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19) })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-lg tracking-[0.1em] transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative group">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 px-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={formData.cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                              setFormData({ ...formData, cardExpiry: val });
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-center tracking-widest transition-all"
                          />
                        </div>
                        <div className="relative group">
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 px-1">Security CVV</label>
                          <input
                            type="password"
                            placeholder="***"
                            maxLength={3}
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-center tracking-[0.3em] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Risk Message */}
                    <AnimatePresence>
                      {trustScore < 0.5 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={clsx(
                            "p-4 rounded-xl flex items-start space-x-3 border",
                            trustScore < 0.4 ? "bg-trust-danger/10 border-trust-danger/20 text-trust-danger" : "bg-trust-watch/10 border-trust-watch/20 text-trust-watch"
                          )}
                        >
                          <ShieldAlert size={20} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold">Verification Required</p>
                            <p className="text-xs opacity-80 mt-1">Unusual typing pattern detected. Authentication challenge may be triggered on submit.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={clsx(
                        "w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-3",
                        trustScore < 0.4
                          ? "bg-white/5 text-secondary cursor-not-allowed border border-white/5"
                          : "bg-[#121212] border-2 border-[#430BB8] text-white hover:shadow-[0_0_30px_rgba(67,11,184,0.3)] active:scale-[0.98]"
                      )}
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={20} />
                          <span>Send ₹{formData.amount ? Number(formData.amount).toLocaleString() : '0'} Securely</span>
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, stiffness: 100 }}
                    className="w-24 h-24 bg-trust-safe/20 rounded-full flex items-center justify-center mb-8 border-2 border-trust-safe/30"
                  >
                    <CheckCircle2 size={48} className="text-trust-safe" />
                  </motion.div>
                  <h3 className="font-sora font-extrabold text-3xl mb-4">Transfer Complete</h3>
                  <p className="text-secondary max-w-xs mb-10">
                    Your payment of ₹{Number(formData.amount).toLocaleString()} to account ending in {formData.account.slice(-4)} was processed successfully.
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="px-10 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors"
                  >
                    Make Another Transfer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Right Monitor Panel */}
          <div className="flex flex-col space-y-6">
            <GlassCard className="p-8 border-white/5 magic-bento-card magic-bento-card--border-glow">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-sora font-bold text-xl">Behaviour Monitor</h3>
                  <p className="text-sm text-secondary">Continuous risk telemetry</p>
                </div>
                <Activity className="text-accent animate-pulse" size={24} />
              </div>

              <div className="space-y-6">
                <RiskBar label="Typing Velocity" value={Math.round(metrics.typingSpeed)} />
                <RiskBar label="Key Hold Signature" value={Math.round(metrics.holdTime / 2)} />
                <RiskBar label="Navigation Rhythm" value={Math.round(metrics.rhythm)} />
                <RiskBar label="Input Pattern Match" value={Math.round(metrics.swipe)} />
              </div>

              <div className="mt-10 p-6 rounded-[28px] bg-gradient-to-br from-[#1A1A3A] to-[#0D0D1E] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

                {/* Virtual Card Content */}
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 opacity-80" />
                    <div className="text-[10px] font-black italic tracking-widest opacity-40">behaveguard debit</div>
                  </div>

                  <div className="text-lg font-mono tracking-[0.2em] py-1 shadow-inner h-7 flex items-center">
                    {formData.cardNumber || '#### #### #### ####'}
                  </div>

                  <div className="flex justify-between items-end pt-2">
                    <div className="space-y-0.5">
                      <div className="text-[7px] font-black uppercase tracking-widest opacity-30">Node Primary Account</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider">{user?.name || 'Authorized Holder'}</div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <div className="text-[7px] font-black uppercase tracking-widest opacity-30">Expiry</div>
                      <div className="text-[10px] font-mono">{formData.cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center space-x-6">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="transparent"
                      stroke={trustScore > 0.6 ? "#10B981" : (trustScore > 0.35 ? "#F59E0B" : "#EF4444")}
                      strokeWidth="8"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 - (213.6 * trustScore)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{Math.round(trustScore * 100)}</span>
                    <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Score</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Identity Confidence</h4>
                  <p className="text-xs text-secondary leading-relaxed">
                    {trustScore > 0.6 ?
                      "High confidence. Implicit biometric pattern matches Rahul Mehta's baseline profile." :
                      "Caution: Behaviour drift detected. Transfer limits restricted to ensure account security."
                    }
                  </p>
                </div>
              </div>
            </GlassCard>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass p-6 border-trust-safe/20 bg-trust-safe/5 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-trust-safe/20 flex items-center justify-center text-trust-safe">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Adaptive Security Active</p>
                    <p className="text-xs text-secondary">Step-up challenges enabled</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-secondary group-hover:text-white transition-all group-hover:translate-x-1" />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── Transaction PIN Challenge Modal */}
      <AnimatePresence>
        {showPinChallenge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-[#0C0D1E] border border-white/10 rounded-[40px] p-10 text-center space-y-8 shadow-[0_45px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/20 blur-[60px] rounded-full -z-10" />

              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto border border-accent/20">
                <Smartphone className="text-accent" size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black font-sora text-white">Identity Check</h3>
                <p className="text-[11px] text-white/40 leading-relaxed uppercase tracking-widest font-black">
                  MFA Challenge sent to <span className="text-indigo-400 font-bold">XXXXXX{user?.phone ? user.phone.slice(-4) : '####'}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2">
                {pinInput.map((p, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={p}
                    onChange={(e) => {
                      const val = e.target.value.slice(-1);
                      if (!/^\d*$/.test(val)) return;
                      const newPin = [...pinInput];
                      newPin[i] = val;
                      setPinInput(newPin);
                      if (val && i < 5) document.getElementById(`pin-${i + 1}`).focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !pinInput[i] && i > 0) {
                        document.getElementById(`pin-${i - 1}`).focus();
                      }
                    }}
                    id={`pin-${i}`}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                ))}
              </div>

              {pinError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-trust-danger uppercase tracking-wider">
                  {pinError}
                </motion.p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setShowPinChallenge(false)}
                  className="flex-1 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-secondary hover:bg-white/5 transition-all"
                >
                  Abort
                </button>
                <button
                  onClick={() => handleSubmit()}
                  disabled={pinInput.some(p => !p) || isSubmitting}
                  className="flex-[2] py-4 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Identity'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferPage;
