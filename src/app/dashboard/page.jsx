"use client";
import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldCheck, Activity, Search, X, CheckCircle, Landmark,
  AlertCircle, ArrowRight, Zap, Lock, TrendingUp, TrendingDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, TrustBadge, NavBar } from '../../components/Shared';
import BankCard from '../../components/BankCard';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { useRouter } from 'next/navigation';
import { GlobalSpotlight } from '../../components/MagicSpotlight';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// ── Micro-components ─────────────────────────────────────────────────────────
const RiskPill = ({ riskLevel, isWarmingUp }) => {
  if (isWarmingUp) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/30">
      <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
      Calibrating
    </span>
  );

  const map = {
    safe: { label: 'All Clear', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    watch: { label: 'Monitoring', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    danger: { label: 'Threat', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  };
  const s = map[riskLevel] || map.safe;
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', s.bg, s.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse', s.dot)} />
      {s.label}
    </span>
  );
};

const StatCard = ({ label, children, className }) => (
  <GlassCard className={clsx('p-6 flex flex-col justify-between hover:bg-white/[0.04] transition-all duration-300', className)}>
    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.25em] mb-5">{label}</span>
    {children}
  </GlassCard>
);

// Pulsing dots shown while calibrating
const CalibrationDots = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-1">
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-white/20"
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22 }}
        />
      ))}
    </div>
    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
      Calibrating…
    </span>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const {
    user, trustScore, riskLevel, sessionEvents, isWarmingUp, liveMetrics,
    resetTrustScore, lockAccount, setUser, strikeCount, addStrike
  } = useAuth();
  const router = useRouter();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [warning, setWarning] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [pinInput, setPinInput] = useState(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [dbData, setDbData] = useState({ balance: 0, history: [] });
  const [todaySpend, setTodaySpend] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);

  const pinLockActive = useRef(false);
  const entryTimeRef = useRef(Date.now());
  const lastVerifiedTime = useRef(0); // Cooldown after PIN entry
  const lastWarningTime = useRef(0);
  const gridRef = useRef(null);

  // ── Fetch ledger ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/transfer/history', { withCredentials: true });
        if (res.data.success) {
          setDbData({ balance: res.data.balance, history: res.data.history });
          const currentUserId = user?._id || user?.id;
          const today = new Date().toDateString();
          const todayH = res.data.history.filter(tx => new Date(tx.timestamp).toDateString() === today);

          const spend = todayH
            .filter(tx => tx.sender?._id === currentUserId && tx.sender?._id !== tx.receiver?._id)
            .reduce((acc, curr) => acc + curr.amount, 0);

          const income = todayH
            .filter(tx => tx.receiver?._id === currentUserId)
            .reduce((acc, curr) => acc + curr.amount, 0);

          setTodaySpend(spend);
          setTodayIncome(income);
        }
      } catch { console.error('Ledger sync failed.'); }
    };
    if (user) fetchData();
  }, [user]);

  // ── Filtered transactions ─────────────────────────────────────────────────
  const recentTransactions = dbData.history.filter(tx => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.sender?.name?.toLowerCase().includes(q) ||
      tx.receiver?.name?.toLowerCase().includes(q) ||
      tx.note?.toLowerCase().includes(q) ||
      String(tx.amount).includes(q)
    );
  }).slice(0, 8);

  // ── Live chart — seeded with null so warmup shows flat neutral line ───────
  const [chartData, setChartData] = useState({
    labels: Array.from({ length: 40 }, (_, i) => i),
    datasets: [{
      label: 'Trust Score',
      data: Array.from({ length: 40 }, () => null),   // null = no data yet
      fill: true,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      tension: 0.5,
      pointRadius: 0,
      borderWidth: 2,
      spanGaps: false,
    }],
  });

  // Push every trustScore change immediately into the chart (rolling window 30)
  useEffect(() => {
    if (isWarmingUp || trustScore === null) return;
    setChartData(prev => {
      const newData = [...prev.datasets[0].data.slice(-29), trustScore];
      const color = trustScore > 0.6 ? '#10B981' : trustScore > 0.4 ? '#F59E0B' : '#EF4444';
      const bgColor = trustScore > 0.6
        ? 'rgba(16,185,129,0.08)'
        : trustScore > 0.4
          ? 'rgba(245,158,11,0.08)'
          : 'rgba(239,68,68,0.08)';
      return {
        ...prev,
        datasets: [{ ...prev.datasets[0], data: newData, borderColor: color, backgroundColor: bgColor }]
      };
    });
  }, [trustScore, isWarmingUp]);

  // Security — DANGER monitor handles all dynamic locks

  useEffect(() => {
    // Don't fire during engine warmup AT ALL
    if (isWarmingUp) return;
    // Extra 5 s grace after warmup ends (total ~10 s from login)
    const isGracePeriod = (Date.now() - entryTimeRef.current) < 10000;
    // 30s cooldown after successful PIN entry
    const inCooldown = (Date.now() - lastVerifiedTime.current) < 30000;

    if (riskLevel === 'danger' && !isGracePeriod && !inCooldown && !pinLockActive.current) {
      pinLockActive.current = true;
      addStrike(); // Increment session strike count
      lockAccount(); // Persist the lock in DB
      setWarning(null);
      setShowAnomalyModal(true);
      setTimeout(() => {
        setShowAnomalyModal(false);
        setShowPinModal(true);
      }, 3000);
    }
  }, [riskLevel, isWarmingUp, addStrike]);

  // Handle kick-out (redirect to landing) when session is deactivated
  useEffect(() => {
    if (!user && !isWarmingUp) {
      router.push('/');
    }
  }, [user, isWarmingUp, router]);

  // ── Security — WATCH banner only <50% score, throttled 45 s ──────────────
  useEffect(() => {
    if (isWarmingUp) return;
    const now = Date.now();
    if (
      riskLevel === 'watch' &&
      trustScore !== null &&
      trustScore < 0.5 &&
      !showPinModal &&
      !showAnomalyModal &&
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
  }, [riskLevel, trustScore, showPinModal, showAnomalyModal, sessionEvents, isWarmingUp]);

  // ── PIN submit ────────────────────────────────────────────────────────────
  const handlePinSubmit = async () => {
    setPinError('');
    const pin = pinInput.join('');
    if (pin.length !== 6) { setPinError('Enter all 6 digits.'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!data.success) {
        setPinError(data.message || 'Wrong PIN — redirecting you out…');
        setTimeout(() => { window.location.href = 'http://localhost:3000'; }, 1500);
      } else {
        setShowPinModal(false);
        setPinInput(['', '', '', '', '', '']);
        setPinError('');
        pinLockActive.current = false;
        lastVerifiedTime.current = Date.now(); // Start cooldown
        resetTrustScore(); // Reset the behavioral engine's state for this session
        setUser(prev => ({ ...prev, isLocked: false })); // Locally unlock since DB is already unlocked
      }
    } catch {
      setPinError('Verification node unreachable. Redirecting…');
      setTimeout(() => { window.location.href = 'http://localhost:3000'; }, 1500);
    }
  };

  // ── Chart options ─────────────────────────────────────────────────────────
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0, max: 1,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: 'rgba(255,255,255,0.2)',
          font: { size: 10 },
          callback: v => `${Math.round(v * 100)}%`,
        },
      },
      x: { display: false },
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    animation: { duration: 800 },
  };

  const scoreColor =
    isWarmingUp ? 'rgba(255,255,255,0.15)' :
      riskLevel === 'safe' ? '#10B981' :
        riskLevel === 'watch' ? '#F59E0B' : '#EF4444';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg-deep text-white relative overflow-x-hidden">
      <div className="bg-mesh pointer-events-none">
        <div className="orb-1" /><div className="orb-2" /><div className="orb-3" />
      </div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main
        ref={gridRef}
        className={clsx(
          'transition-all duration-300 p-6 md:p-10 pt-6 min-h-screen max-w-[1440px] mx-auto',
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        <GlobalSpotlight gridRef={gridRef} />

        {/* ── Amber warning banner ────────────────────────────────────────── */}
        <AnimatePresence>
          {warning && !showPinModal && !showAnomalyModal && (
            <motion.div
              key="warn-banner"
              initial={{ opacity: 0, y: -28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-8 py-4 rounded-2xl border border-amber-400/30 bg-amber-500/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-xl w-[92%]"
            >
              <AlertCircle size={20} className="text-amber-400 shrink-0 animate-pulse" />
              <span className="text-amber-100 text-sm font-semibold leading-snug">{warning}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Anomaly modal (3 s countdown) ───────────────────────────────── */}
        <AnimatePresence>
          {showAnomalyModal && (
            <motion.div
              key="anomaly"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.72, y: 48 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="relative w-full max-w-lg rounded-[36px] border-2 border-red-500/50 bg-[#100C1C] p-12 text-center shadow-[0_0_120px_rgba(239,68,68,0.35)] overflow-hidden"
              >
                <div className="absolute inset-0 rounded-[36px] bg-gradient-to-b from-red-500/10 to-transparent pointer-events-none" />

                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                  className="w-24 h-24 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-8"
                >
                  <Shield size={46} className="text-red-400" />
                </motion.div>

                <p className="text-[10px] font-black text-red-400/70 uppercase tracking-[0.3em] mb-3">Critical Alert</p>
                <h2 className="font-sora font-extrabold text-4xl text-white mb-4 leading-tight">
                  Anomaly<br />Detected
                </h2>
                <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-xs mx-auto">
                  A <span className="text-red-300 font-semibold">significant behavioural deviation</span> was caught —
                  typing rhythm or mouse pattern differs vastly from your baseline.
                  Session paused for your protection.
                </p>

                {strikeCount > 0 && (
                  <div className={clsx(
                    "mb-6 p-4 rounded-xl border transition-all",
                    strikeCount === 2 ? "bg-orange-500/10 border-orange-500/30" : "bg-white/5 border-white/10"
                  )}>
                    <p className={clsx(
                      "text-xs font-black uppercase tracking-widest",
                      strikeCount === 2 ? "text-orange-400" : "text-white/40"
                    )}>
                      {strikeCount === 2 ? '⚠️ Final Warning' : 'Precautionary Alert'}
                    </p>
                    <p className="text-white/80 font-bold text-sm mt-1">
                      Incident {strikeCount} of 3
                    </p>
                    {strikeCount === 2 && (
                      <p className="text-orange-200/60 text-[10px] mt-1 font-medium italic">
                        One more anomaly will terminate your session immediately.
                      </p>
                    )}
                  </div>
                )}

                <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                  />
                </div>
                <p className="text-[9px] text-red-400/50 font-bold uppercase tracking-[0.25em] mt-3">
                  Verification opening…
                </p>
              </motion.div>
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
              className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/75 backdrop-blur-lg"
            >
              <motion.div
                initial={{ scale: 0.94, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm bg-[#0E0C1E] border border-white/10 rounded-[32px] p-10 text-center shadow-2xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                  <Lock size={30} className="text-red-400" />
                </div>
                <h3 className="font-sora font-bold text-2xl mb-2">Confirm Your PIN</h3>
                <p className="text-white/40 text-xs leading-relaxed mb-1">
                  Enter your <span className="text-white/80 font-semibold">6-digit security PIN</span> to resume.
                </p>
                <p className={clsx(
                  "text-[10px] font-bold uppercase tracking-widest mb-4",
                  strikeCount === 2 ? "text-orange-400" : "text-red-400/70"
                )}>
                  {strikeCount === 2 ? 'FINAL WARNING: STRIKE 2/3' : `Security Check: Strike ${strikeCount}/3`}
                </p>

                {strikeCount === 2 && (
                  <p className="text-orange-300/80 text-[9px] font-black uppercase tracking-[0.2em] mb-4 bg-orange-500/10 py-2 rounded-lg border border-orange-500/20">
                    Next Anomaly = Auto-Logout
                  </p>
                )}

                <div className="flex justify-center gap-2 mb-5">
                  {pinInput.map((val, idx) => (
                    <input
                      key={idx}
                      id={`pin-${idx}`}
                      value={val}
                      inputMode="numeric"
                      maxLength={1}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 1);
                        const next = [...pinInput]; next[idx] = v; setPinInput(next);
                        if (v && idx < 5) document.getElementById(`pin-${idx + 1}`)?.focus();
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Backspace' && !pinInput[idx] && idx > 0)
                          document.getElementById(`pin-${idx - 1}`)?.focus();
                      }}
                      className="w-11 h-13 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
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

        {/* ── Global Search Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-xl">
              <h1 className="font-sora font-extrabold text-5xl md:text-6xl tracking-tighter mb-4 leading-tight">
                Vault <span className="text-accent underline decoration-white/10 underline-offset-8">Insight</span>
              </h1>
              <p className="text-secondary text-lg font-medium opacity-50">Authenticated Node: {(user?._id || user?.id)?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="relative group w-full max-w-2xl">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={24} />
                <input
                  type="text"
                  placeholder="Universal Intelligence Search..."
                  className="w-full bg-white/[0.03] border-2 border-white/10 rounded-[32px] pl-16 pr-8 py-6 text-xl font-bold focus:border-accent focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/10 shadow-2xl"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <kbd className="px-2.5 py-1.5 bg-white/5 rounded-xl text-[10px] font-black border border-white/10 text-white/20 tracking-widest">CMD K</kbd>
                </div>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-6">
              <TrustBadge score={trustScore} />
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all">
                <Activity size={20} className="text-white/40" />
              </div>
            </div>
          </div>
        </motion.header>

        {/* ── Behavior Live-Stream Stats Card (New) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard label="Typing Velocity">
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-black text-2xl">{liveMetrics.typingSpeed?.toFixed(2)} <span className="text-[10px] text-white/20">cps</span></h2>
              <Zap size={14} className="text-amber-400 mb-1" />
            </div>
          </StatCard>

          <StatCard label="Keyboard Hold Avg">
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-black text-2xl">{liveMetrics.keyHold?.toFixed(0)} <span className="text-[10px] text-white/20">ms</span></h2>
              <Lock size={14} className="text-trust-safe mb-1" />
            </div>
          </StatCard>

          <StatCard label="Live Mouse Flow">
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-black text-2xl">{liveMetrics.mouseSpeed?.toFixed(0)} <span className="text-[10px] text-white/20">px/s</span></h2>
              <TrendingUp size={14} className="text-accent mb-1" />
            </div>
          </StatCard>

          <StatCard label="Page Scroll Depth">
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-black text-2xl">{liveMetrics.scrollSpeed?.toFixed(0)} <span className="text-[10px] text-white/20">px/s</span></h2>
              <Activity size={14} className="text-accent-teal mb-1" />
            </div>
          </StatCard>
        </div>

        {/* ── Financial Summary & Risk Overview ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <StatCard label="Total Liquidity">
              <div className="flex items-end justify-between">
                <h2 className="font-sora font-black text-2xl text-white">
                  ₹{(dbData.balance || 0).toLocaleString('en-IN')}
                </h2>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg font-bold">
                  <TrendingUp size={10} /> Stable
                </span>
              </div>
            </StatCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard label="Daily Net Flow">
              <div className="flex items-end justify-between">
                <h2 className={clsx("font-sora font-black text-2xl", (todayIncome - todaySpend) >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {todayIncome - todaySpend >= 0 ? '+' : ''} ₹{(todayIncome - todaySpend).toLocaleString('en-IN')}
                </h2>
                <div className={clsx("w-8 h-8 rounded-xl border flex items-center justify-center", (todayIncome - todaySpend) >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20")}>
                  {(todayIncome - todaySpend) >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
                </div>
              </div>
            </StatCard>
          </motion.div>

          {/* ── Session Health — calibration-aware ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatCard label="Session Health">
              <AnimatePresence mode="wait">
                {isWarmingUp ? (
                  // Warmup state — pulsing dots, no score
                  <motion.div
                    key="calibrating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CalibrationDots />
                  </motion.div>
                ) : (
                  // Real score — centred green, or left-aligned watch/danger
                  <motion.div
                    key="score"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 260 }}
                    className={clsx(
                      'flex transition-all duration-500',
                      riskLevel === 'safe'
                        ? 'flex-col items-center justify-center gap-1'
                        : 'items-end justify-between'
                    )}
                  >
                    <motion.h2
                      key={`score-${Math.round((trustScore ?? 0) * 100)}`}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="font-sora font-black text-3xl"
                      style={{ color: scoreColor }}
                    >
                      {Math.round((trustScore ?? 0) * 100)}%
                    </motion.h2>

                    {riskLevel === 'safe' ? (
                      <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-[0.2em]">
                        All Clear
                      </span>
                    ) : (
                      <Activity
                        size={18}
                        className={clsx(
                          'animate-pulse',
                          riskLevel === 'watch' ? 'text-amber-400' : 'text-red-400'
                        )}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </StatCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard label="Active Guard Nodes">
              <div className="flex items-end justify-between">
                <h2 className="font-sora font-black text-2xl">12 Active</h2>
                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Zap size={14} className="text-accent" />
                </div>
              </div>
            </StatCard>
          </motion.div>
        </div>

        {/* ── Chart + Card ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-8 min-h-[420px] flex flex-col h-full">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="font-sora font-bold text-xl leading-tight">Identity Baseline Monitor</h3>
                  <p className="text-xs text-white/30 mt-1.5">
                    {isWarmingUp
                      ? 'Collecting initial behavioural samples…'
                      : 'Live mathematical representation of your interaction DNA'}
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5">
                  <span className={clsx(
                    'w-1.5 h-1.5 rounded-full',
                    isWarmingUp ? 'bg-white/20 animate-pulse' : 'bg-emerald-400 animate-pulse'
                  )} />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                    {isWarmingUp ? 'Warmup' : 'Live'}
                  </span>
                </div>
              </div>

              {/* Chart area — shows placeholder skeleton during warmup */}
              <div className="flex-1 w-full min-h-[280px] relative">
                {isWarmingUp ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-white/15"
                          animate={{ opacity: [0.15, 0.7, 0.15], y: [0, -6, 0] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                      Sampling behavioural baseline…
                    </p>
                  </div>
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
            </GlassCard>
          </motion.div>

          <div className="flex flex-col gap-14">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative h-[260px]"
            >
              <BankCard user={user} balance={dbData.balance} className="absolute inset-0 z-10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <GlassCard className="p-6 border-accent/20 bg-accent/[0.04]">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <h4 className="font-sora font-bold text-sm">Behavioral Insight</h4>
                </div>
                <p className="text-xs text-white/40 leading-relaxed mb-4">
                  {isWarmingUp
                    ? 'Guard engine is collecting your interaction DNA. Full protection activates in a moment.'
                    : sessionEvents.length > 0
                      ? <><span className="text-amber-300 font-semibold">⚠ {sessionEvents[0].message}</span></>
                      : <>Typing flight times are within <span className="text-white/70 font-semibold">5%</span> of your baseline. High-confidence session verified.</>
                  }
                </p>
                <button
                  onClick={() => window.location.href = '/fingerprint'}
                  className="text-[10px] font-black text-accent uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  View Deep Profile <ArrowRight size={10} />
                </button>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* ── Ledger ────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-sora font-bold text-xl">Global Ledger History</h3>
                {searchQuery && (
                  <p className="text-[10px] text-white/30 mt-1.5 font-medium">
                    {recentTransactions.length} result{recentTransactions.length !== 1 ? 's' : ''} for "{searchQuery}"
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push('/transactions')}
                className="flex items-center gap-1.5 text-[10px] font-black text-accent uppercase tracking-[0.2em] hover:underline"
              >
                View Full Log <ArrowRight size={11} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[580px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-white/25 text-[9px] uppercase tracking-[0.25em] font-black">
                    <th className="pb-4 px-2">Entity / Node</th>
                    <th className="pb-4 px-2">Type</th>
                    <th className="pb-4 px-2 text-right">Value</th>
                    <th className="pb-4 px-2 text-right">Auth Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-20">
                          <Activity size={36} className="mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No activities in ledger</p>
                        </div>
                      </td>
                    </tr>
                  ) : recentTransactions.map(tx => {
                    const currentId = (user?._id || user?.id);
                    const isDeposit = tx.sender?._id === tx.receiver?._id;
                    const isOutgoing = !isDeposit && tx.sender?._id === currentId;
                    const counterParty = isOutgoing ? tx.receiver : tx.sender;

                    const label = isDeposit ? 'Deposit' : (isOutgoing ? 'Sent Funds' : 'Income Received');
                    const colorClass = (isDeposit || !isOutgoing) ? 'text-emerald-400' : 'text-red-400';
                    const bgSecondary = (isDeposit || !isOutgoing) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';

                    return (
                      <tr key={tx._id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <td className="py-5 px-2">
                          <div className="flex items-center gap-4">
                            <div className={clsx(
                              'w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0',
                              bgSecondary
                            )}>
                              {counterParty?.name?.[0]?.toUpperCase() || 'D'}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-white">{isDeposit ? 'Self Node (Card)' : (counterParty?.name || 'External Node')}</p>
                              <p className="text-[10px] text-white/30 font-medium mt-0.5">
                                {new Date(tx.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-2">
                          <span className={clsx(
                            'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest',
                            isOutgoing ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                          )}>
                            {label}
                          </span>
                        </td>
                        <td className="py-5 px-2 text-right">
                          <p className={clsx('font-black text-lg', colorClass)}>
                            {isOutgoing ? '−' : '+'} ₹{tx.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[9px] text-white/25 mt-0.5">Hash Verified</p>
                        </td>
                        <td className="py-5 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1 w-14 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className={clsx('h-full rounded-full', isOutgoing ? 'bg-white/20' : 'bg-emerald-400')} style={{ width: isOutgoing ? '45%' : '98%' }} />
                            </div>
                            <span className="text-[10px] font-bold text-white/30">{isOutgoing ? 'Low' : 'Safe'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

      </main>
    </div>
  );
};

export default DashboardPage;
