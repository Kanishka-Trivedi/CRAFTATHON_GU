"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ShieldAlert, CheckCircle2, AlertCircle, Activity, ArrowRight, User, Smartphone, CreditCard, Plus, ArrowUpRight, Zap, Lock, Info, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, NavBar, TrustBadge, RiskBar } from '../../components/Shared';
import { GlobalSpotlight } from '../../components/MagicSpotlight';
import { clsx } from 'clsx';

const TransferPage = () => {
  const { user, trustScore, riskLevel, liveMetrics, sessionEvents, resetTrustScore } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const gridRef = useRef(null);

  // Tab: 'deposit' or 'send'
  const [activeTab, setActiveTab] = useState('deposit');

  // Shared card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Deposit fields
  const [depositAmount, setDepositAmount] = useState('');

  // Send fields
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendNote, setSendNote] = useState('');

  // State
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPinChallenge, setShowPinChallenge] = useState(false);
  const [pinInput, setPinInput] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showSandboxHelp, setShowSandboxHelp] = useState(false);

  // Fetch balance + history
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/transfer/history', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
          setHistory(data.history);
        }
      } catch (err) { console.error('Ledger fetch failed'); }
    };
    if (user) fetchData();
  }, [user]);

  // ── DEPOSIT ───────────────────────────────────────────────────────────────
  const handleDeposit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!depositAmount || Number(depositAmount) <= 0) {
      setErrorMessage('Enter a valid deposit amount');
      return;
    }
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      setErrorMessage('Enter a valid 16-digit card number');
      return;
    }
    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setErrorMessage('Enter expiry in MM/YY format');
      return;
    }
    if (!cvv || cvv.length !== 3) {
      setErrorMessage('Enter a valid 3-digit CVV');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/transfer/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(depositAmount),
          cardDetails: { number: cardNumber, expiry: cardExpiry, cvv }
        })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        setIsSuccess(true);
        setSuccessMessage(`₹${Number(depositAmount).toLocaleString('en-IN')} deposited to your account`);
      } else {
        setErrorMessage(data.message || 'Deposit failed');
      }
    } catch (err) {
      setErrorMessage('Server unreachable');
    }
    setIsSubmitting(false);
  };

  // ── SEND ──────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setPinError('');

    if (!recipientEmail || !sendAmount || Number(sendAmount) <= 0) {
      setErrorMessage('Enter recipient email and a valid amount');
      return;
    }
    if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
      setErrorMessage('Enter your 16-digit card number');
      return;
    }
    if (!cvv || cvv.length !== 3) {
      setErrorMessage('Enter your 3-digit CVV');
      return;
    }

    // PIN challenge for low trust or high amount
    if ((trustScore < 0.6 || Number(sendAmount) > 10000) && !showPinChallenge) {
      setShowPinChallenge(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/transfer/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          recipientEmail,
          amount: Number(sendAmount),
          note: sendNote,
          cardDetails: { number: cardNumber, expiry: cardExpiry, cvv },
          pin: pinInput.join('')
        })
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.newBalance);
        setIsSuccess(true);
        setSuccessMessage(`₹${Number(sendAmount).toLocaleString('en-IN')} sent to ${recipientEmail}`);
        setShowPinChallenge(false);
        resetTrustScore(); // Success proves identity, so reset trust
      } else {
        if (data.message?.includes('PIN')) {
          setPinError(data.message);
        } else {
          setErrorMessage(data.message || 'Transfer rejected');
          setShowPinChallenge(false);
        }
      }
    } catch (err) {
      setErrorMessage('Server unreachable');
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setIsSuccess(false);
    setSuccessMessage('');
    setErrorMessage('');
    setDepositAmount('');
    setRecipientEmail('');
    setSendAmount('');
    setSendNote('');
    setPinInput(['', '', '', '', '', '']);
  };

  const scoreColor = trustScore > 0.6 ? '#10B981' : trustScore > 0.35 ? '#F59E0B' : '#EF4444';

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh"><div className="orb-1" /><div className="orb-2" /><div className="orb-3" /></div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main ref={gridRef} className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <GlobalSpotlight gridRef={gridRef} />

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl">Fund Operations</h1>
            <p className="text-secondary mt-1">Deposit & transfer funds secured by behavioral authentication</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-5 py-2.5">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Balance</span>
              <p className="font-sora font-black text-lg text-white">₹{(balance || 0).toLocaleString('en-IN')}</p>
            </div>
            <TrustBadge score={trustScore} />
            <button
              onClick={() => setShowSandboxHelp(true)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent/10 hover:border-accent/40 transition-all text-white/30 hover:text-accent"
              title="Sandbox Info"
            >
              <Info size={18} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── LEFT: Transfer Form (3 cols) ───────────────────────────────── */}
          <div className="lg:col-span-3">
            <GlassCard className="p-10 border-white/5 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Tab Switcher */}
                    <div className="flex gap-2 mb-8 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06]">
                      {[
                        { id: 'deposit', label: 'Deposit Funds', icon: Plus },
                        { id: 'send', label: 'Send Money', icon: Send }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setErrorMessage(''); }}
                          className={clsx(
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                            activeTab === tab.id
                              ? 'bg-accent/15 text-accent border border-accent/20'
                              : 'text-white/30 hover:text-white/50'
                          )}
                        >
                          <tab.icon size={14} />
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* ── Card Entry (shared) ────────────────────────────── */}
                    <div className="mb-8 space-y-5">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 px-1">
                          {activeTab === 'deposit' ? 'Funding Source Card' : 'Authenticated Card'}
                        </label>
                        <input
                          type="text"
                          placeholder="4000 0000 0000 0012"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19))}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-lg tracking-[0.1em] transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 px-1">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                              setCardExpiry(val);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-center tracking-widest transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/60 mb-3 px-1">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength={3}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-mono text-center tracking-[0.3em] transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── DEPOSIT TAB ─────────────────────────────────────── */}
                    {activeTab === 'deposit' && (
                      <form onSubmit={handleDeposit} className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Deposit Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-bold text-2xl transition-all"
                          />
                        </div>

                        {/* Quick amount buttons */}
                        <div className="flex gap-3">
                          {[1000, 5000, 10000, 50000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setDepositAmount(String(amt))}
                              className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white/50 hover:text-white hover:bg-white/[0.08] transition-all"
                            >
                              ₹{amt.toLocaleString('en-IN')}
                            </button>
                          ))}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] active:scale-[0.98]"
                        >
                          {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Plus size={20} />
                              Deposit ₹{depositAmount ? Number(depositAmount).toLocaleString('en-IN') : '0'}
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* ── SEND TAB ────────────────────────────────────────── */}
                    {activeTab === 'send' && (
                      <form onSubmit={handleSend} className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Recipient Email</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                            <input
                              type="email"
                              placeholder="recipient@email.com"
                              value={recipientEmail}
                              onChange={(e) => setRecipientEmail(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-accent outline-none text-lg transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Amount (₹)</label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={sendAmount}
                              onChange={(e) => setSendAmount(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none font-bold text-xl transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-3 px-1">Note</label>
                            <input
                              type="text"
                              placeholder="Payment for..."
                              value={sendNote}
                              onChange={(e) => setSendNote(e.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none text-sm transition-all"
                            />
                          </div>
                        </div>

                        {/* Low trust warning */}
                        <AnimatePresence>
                          {trustScore < 0.5 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="p-4 rounded-xl flex items-start gap-3 border bg-amber-500/10 border-amber-500/20 text-amber-400"
                            >
                              <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-bold">Elevated Security</p>
                                <p className="text-xs opacity-80 mt-1">Unusual behavioral pattern detected. PIN verification will be required.</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          type="submit"
                          disabled={isSubmitting || trustScore < 0.2}
                          className={clsx(
                            "w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3",
                            trustScore < 0.2
                              ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5"
                              : "bg-[#121212] border-2 border-[#430BB8] text-white hover:shadow-[0_0_30px_rgba(67,11,184,0.3)] active:scale-[0.98]"
                          )}
                        >
                          {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Send size={20} />
                              Send ₹{sendAmount ? Number(sendAmount).toLocaleString('en-IN') : '0'}
                            </>
                          )}
                        </button>
                      </form>
                    )}

                    {/* Error message */}
                    <AnimatePresence>
                      {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center gap-3"
                        >
                          <AlertCircle size={16} className="shrink-0" />
                          {errorMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                ) : (
                  /* ── Success State ──────────────────────────────────────── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10, stiffness: 100 }}
                      className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 border-2 border-emerald-500/30"
                    >
                      <CheckCircle2 size={48} className="text-emerald-400" />
                    </motion.div>
                    <h3 className="font-sora font-extrabold text-3xl mb-3">
                      {activeTab === 'deposit' ? 'Deposit Complete' : 'Transfer Complete'}
                    </h3>
                    <p className="text-secondary max-w-xs mb-3">{successMessage}</p>
                    <p className="text-xs text-white/30 mb-10">New balance: ₹{balance.toLocaleString('en-IN')}</p>
                    <button
                      onClick={resetForm}
                      className="px-10 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors"
                    >
                      Make Another Transaction
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          {/* ── RIGHT: Live Monitor Panel (2 cols) ────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Real-time behavioral metrics */}
            <GlassCard className="p-8 border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-sora font-bold text-lg">Live Behaviour Monitor</h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1">Real-time telemetry</p>
                </div>
                <Activity className="text-accent animate-pulse" size={20} />
              </div>

              <div className="space-y-5">
                <RiskBar label="Typing Velocity" value={Math.min(100, Math.round((liveMetrics?.typingSpeed || 0) / 10 * 100))} />
                <RiskBar label="Key Hold Signature" value={Math.min(100, Math.round((liveMetrics?.keyHold || 0) / 300 * 100))} />
                <RiskBar label="Mouse Flow" value={Math.min(100, Math.round((liveMetrics?.mouseSpeed || 0) / 800 * 100))} />
                <RiskBar label="Scroll Pattern" value={Math.min(100, Math.round((liveMetrics?.scrollSpeed || 0) / 600 * 100))} />
              </div>

              {/* Anomaly insight */}
              <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2">Latest Insight</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  {sessionEvents?.[0]?.message || 'All biometric signals within baseline. Secure session.'}
                </p>
              </div>
            </GlassCard>

            {/* Live card preview */}
            <GlassCard className="p-6 border-white/5">
              <div className="p-6 rounded-[28px] bg-gradient-to-br from-[#1A1A3A] to-[#0D0D1E] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 opacity-80" />
                    <div className="text-[10px] font-black italic tracking-widest opacity-40">behaveguard</div>
                  </div>
                  <div className="text-lg font-mono tracking-[0.2em] py-1 h-7 flex items-center">
                    {cardNumber || '#### #### #### ####'}
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <div className="text-[7px] font-black uppercase tracking-widest opacity-30">Cardholder</div>
                      <div className="text-[11px] font-bold uppercase tracking-wider">{user?.name || 'Authorized Holder'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[7px] font-black uppercase tracking-widest opacity-30">Expiry</div>
                      <div className="text-[11px] font-mono">{cardExpiry || 'MM/YY'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Trust score ring */}
            <GlassCard className="p-6 border-white/5">
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="40" cy="40" r="34"
                      fill="transparent"
                      stroke={scoreColor}
                      strokeWidth="8"
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 - (213.6 * (trustScore || 0))}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{Math.round((trustScore || 0) * 100)}</span>
                    <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Score</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">Identity Confidence</h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {trustScore > 0.6
                      ? `High confidence. Biometric pattern matches ${user?.name || 'user'}'s baseline.`
                      : 'Caution: Behaviour drift detected. Transfer limits restricted.'
                    }
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </main>

      {/* ── PIN Challenge Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPinChallenge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-[#0C0D1E] border border-white/10 rounded-[40px] p-10 text-center space-y-8 shadow-[0_45px_100px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/20 blur-[60px] rounded-full -z-10" />

              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto border border-accent/20">
                <Lock className="text-accent" size={28} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black font-sora text-white">Security Verification</h3>
                <p className="text-[11px] text-white/40 leading-relaxed uppercase tracking-widest font-black">
                  Enter your <span className="text-indigo-400">6-digit PIN</span> to authorize transfer
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
                      if (val && i < 5) document.getElementById(`tpin-${i + 1}`)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !pinInput[i] && i > 0) {
                        document.getElementById(`tpin-${i - 1}`)?.focus();
                      }
                    }}
                    id={`tpin-${i}`}
                    className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
                  />
                ))}
              </div>

              {pinError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  {pinError}
                </motion.p>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => { setShowPinChallenge(false); setPinError(''); }}
                  className="flex-1 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-secondary hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSend()}
                  disabled={pinInput.some(p => !p) || isSubmitting}
                  className="flex-[2] py-4 rounded-2xl bg-accent text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.5)] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Authorize Transfer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Sandbox Help Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSandboxHelp && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#0C0D1D] border border-white/10 rounded-[32px] p-8 space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Landmark size={80} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-sora">Demo Sandbox Info</h3>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">For Judges & Evaluation Only</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-2">Test Card (Success)</p>
                  <code className="text-sm font-mono text-white/60">4000 0000 0000 0012</code>
                  <p className="text-[9px] text-white/20 mt-1">Exp: 12/28 • CVV: 123</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-2">Test Card (High Vol)</p>
                  <code className="text-sm font-mono text-white/60">5105 1051 0510 5105</code>
                  <p className="text-[9px] text-white/20 mt-1">Exp: 09/27 • CVV: 999</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex gap-3">
                <ShieldAlert size={16} className="text-accent shrink-0" />
                <p className="text-[10px] text-indigo-200/60 leading-relaxed font-medium">
                  BehaveGuard uses <span className="text-white">Zero-Storage card logic</span>. Identity is proven via behavioral biometrics, not sensitive data.
                </p>
              </div>

              <button
                onClick={() => setShowSandboxHelp(false)}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-black uppercase tracking-widest transition-all"
              >
                Dismiss Helper
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransferPage;
