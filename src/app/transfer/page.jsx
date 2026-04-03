"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldAlert, CheckCircle2, AlertCircle, Activity, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, NavBar, TrustBadge, RiskBar } from '../../components/Shared';
import { GlobalSpotlight } from '../../components/MagicSpotlight';
import { useRef } from 'react';

import { clsx } from 'clsx';

const TransferPage = () => {
  const { trustScore, riskLevel } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const gridRef = useRef(null);
  const [formData, setFormData] = useState({ account: '', amount: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Monitor trust score and trigger re-auth if it drops too low
  useEffect(() => {
    if (trustScore < 0.35 && formData.account.length > 5) {
      router.push('/reauth', { state: { returnPath: '/transfer', reason: 'Typing pattern anomaly detected during fund transfer' } });
    }
  }, [trustScore, formData.account, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (trustScore < 0.4) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 2000);
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
                      <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Recipient Account Number</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={formData.account}
                          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-lg tracking-widest transition-all"
                          required
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
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Transfer Speed</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-accent outline-none text-sm font-bold text-white transition-all appearance-none cursor-pointer">
                          <option className="bg-bg-card">Immediate (IMPS)</option>
                          <option className="bg-bg-card">Standard (NEFT)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="Purpose of payment"
                        value={formData.note}
                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
                      />
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
                      disabled={trustScore < 0.4 || isSubmitting}
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

              <div className="mt-10 p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center space-x-6">
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
    </div>
  );
};

export default TransferPage;
