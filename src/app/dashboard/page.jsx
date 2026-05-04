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

const StatCard = ({ label, icon: Icon, children, className }) => (
  <GlassCard className={clsx('p-6 flex flex-col hover:bg-white/[0.04] transition-all duration-300 group relative magic-bento-card magic-bento-card--border-glow', className)}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.2em]">{label}</span>
      {Icon && (
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/40 group-hover:text-accent group-hover:border-accent/30 transition-all duration-300">
          <Icon size={16} />
        </div>
      )}
    </div>
    <div className="mt-auto">
      {children}
    </div>
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
  const { user, loading, trustScore, riskLevel, sessionEvents, isWarmingUp, liveMetrics, resetTrustScore, lockAccount, setUser, strikeCount, addStrike, logout } = useAuth();
  const router = useRouter();

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbData, setDbData] = useState({ balance: 0, history: [] });
  const [todaySpend, setTodaySpend] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
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

  // Handle kick-out (redirect to landing) when session is deactivated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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
          'transition-all duration-300 p-6 md:p-10 pt-6 min-h-screen max-w-[1440px] mx-auto content-section bento-section',
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        )}
      >
        <GlobalSpotlight gridRef={gridRef} />

        {/* ── Dashboard Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Central Command</p>
              <h1 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl tracking-tighter leading-none text-white whitespace-nowrap">
                Good morning, <span className="font-sora font-medium ml-1">{user?.name || 'Kanishka'}</span>
              </h1>
            </div>

            <div className="flex-1 flex items-center justify-end max-w-lg">
              <div className="relative group w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-accent transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Universal Intelligence Search..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-sm font-medium focus:border-accent focus:bg-white/[0.05] outline-none transition-all placeholder:text-white/10 shadow-lg"
                />
              </div>
            </div>
          </div>
        </motion.header>

        {/* ── Behavior Live-Stream Stats Card (New) ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard label="Typing Velocity" icon={Zap} className="p-5 pb-6">
            <div className="flex items-end gap-2">
              <h2 className="font-sora font-black text-2xl text-white tracking-tighter">
                {liveMetrics.typingSpeed?.toFixed(2)}
              </h2>
              <span className="text-xs font-bold text-white/30 mb-1.5 uppercase tracking-widest">CPS</span>
            </div>
          </StatCard>

          <StatCard label="Keyboard Hold" icon={Lock} className="p-5 pb-6">
            <div className="flex items-end gap-2">
              <h2 className="font-sora font-black text-2xl text-white tracking-tighter">
                {liveMetrics.keyHold?.toFixed(0)}
              </h2>
              <span className="text-xs font-bold text-white/30 mb-1.5 uppercase tracking-widest">MS</span>
            </div>
          </StatCard>

          <StatCard label="Live Mouse Flow" icon={TrendingUp} className="p-5 pb-6">
            <div className="flex items-end gap-2">
              <h2 className="font-sora font-black text-2xl text-white tracking-tighter">
                {liveMetrics.mouseSpeed?.toFixed(0)}
              </h2>
              <span className="text-xs font-bold text-white/30 mb-1.5 uppercase tracking-widest">PX/S</span>
            </div>
          </StatCard>

          <StatCard label="Scroll Depth" icon={Activity} className="p-5 pb-6">
            <div className="flex items-end gap-2">
              <h2 className="font-sora font-black text-2xl text-white tracking-tighter">
                {liveMetrics.scrollSpeed?.toFixed(0)}
              </h2>
              <span className="text-xs font-bold text-white/30 mb-1.5 uppercase tracking-widest">PX/S</span>
            </div>
          </StatCard>
        </div>

        {/* ── Financial Summary & Risk Overview ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <StatCard label="Total Liquidity" icon={Zap} className="p-5 pb-6">
              <div className="flex items-end justify-between">
                <h2 className="font-sora font-black text-2xl text-white tracking-tighter">
                  ₹{(dbData.balance || 0).toLocaleString('en-IN')}
                </h2>
                <div className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md font-bold border border-emerald-500/10">
                   <TrendingUp size={10} /> <span>STABLE</span>
                </div>
              </div>
            </StatCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <StatCard label="Daily Net Flow" icon={Landmark} className="p-5 pb-6">
              <div className="flex items-center justify-between">
                <h2 className={clsx("font-sora font-black text-2xl tracking-tighter", (todayIncome - todaySpend) >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {todayIncome - todaySpend >= 0 ? '+' : ''} ₹{(todayIncome - todaySpend).toLocaleString('en-IN')}
                </h2>
                <div className={clsx("flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border", (todayIncome - todaySpend) >= 0 ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-red-500/5 text-red-400 border-red-500/10")}>
                  {(todayIncome - todaySpend) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{Math.abs(Math.round(((todayIncome - todaySpend) / (todayIncome || 1)) * 100))}%</span>
                </div>
              </div>
            </StatCard>
          </motion.div>

          {/* ── Session Health — calibration-aware ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <StatCard label="Session Health" icon={Activity} className="p-5 pb-6">
              <AnimatePresence mode="wait">
                {isWarmingUp ? (
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
                  <motion.div
                    key="score"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 260 }}
                    className={clsx(
                      'flex items-end justify-between transition-all duration-500'
                    )}
                  >
                    <motion.h2
                      key={`score-${Math.round((trustScore ?? 0) * 100)}`}
                      className="font-sora font-black text-3xl tracking-tighter"
                      style={{ color: '#10B981' }}
                    >
                      {Math.round((trustScore ?? 0) * 100)}%
                    </motion.h2>

                    <RiskPill riskLevel={riskLevel} />
                  </motion.div>
                )}
              </AnimatePresence>
            </StatCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <StatCard label="Guard Nodes" icon={Landmark} className="p-5 pb-6">
              <div className="flex items-end justify-between">
                <h2 className="font-sora font-black text-2xl text-trust-safe tracking-tighter">12 Active</h2>
                <div className="flex flex-col items-end">
                   <p className="text-[8px] font-black uppercase text-white/20 tracking-widest mb-1">Health 100%</p>
                   <div className="flex gap-1">
                      {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse" />)}
                   </div>
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
            <GlassCard className="p-8 min-h-[420px] flex flex-col h-full magic-bento-card magic-bento-card--border-glow">
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
              <GlassCard className="p-0 border-accent/20 bg-black/40 overflow-hidden relative group magic-bento-card magic-bento-card--border-glow">
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                         <div className="absolute inset-0 bg-accent/20 blur-sm rounded-full animate-pulse" />
                         <ShieldCheck size={14} className="text-accent relative" />
                      </div>
                      <h4 className="font-heading font-bold text-xs uppercase tracking-widest text-white/90">Interaction DNA Feed</h4>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] font-black text-accent/60 uppercase">Live Telemetry</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  </div>

                  {/* ── Live Waveform Reaction (Powered by mouse/typing speed) ── */}
                  <div className="h-14 flex items-end gap-1 mb-6 px-1 overflow-hidden">
                    {[...Array(24)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-accent/30 rounded-t-sm"
                        animate={{ 
                          height: isWarmingUp 
                            ? [4, 8, 4] 
                            : [
                                (liveMetrics?.mouseSpeed / 50 || 5) + (Math.random() * 10), 
                                (liveMetrics?.typingSpeed / 2 || 10) + (Math.random() * 20),
                                (liveMetrics?.mouseSpeed / 80 || 5)
                              ]
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 1.2, 
                          ease: "easeInOut",
                          delay: i * 0.03
                        }}
                      />
                    ))}
                  </div>

                  {/* ── Real-Data Terminal Log ── */}
                  <div className="bg-black/60 rounded-xl p-4 border border-white/5 font-mono text-[10px] leading-relaxed mb-5 shadow-inner">
                    <div className="flex items-start gap-2">
                       <span className="text-accent opacity-50 shrink-0">➜</span>
                       <div className="text-white/60 space-y-1">
                         {isWarmingUp ? (
                           <p>Engine status: <span className="text-accent">Calibrating_Baseline...</span></p>
                         ) : (
                           <>
                             <p>Identity: <span className="text-emerald-400 font-bold">Verified_Session</span></p>
                             <p>Typing: <span className="text-white/80">{Math.round(liveMetrics?.typingSpeed || 0)} WPM</span> | Latency: <span className="text-white/80">{Math.round(liveMetrics?.keyFlight || 0)}ms</span></p>
                             <p>Motion: <span className="text-white/80">{Math.round(liveMetrics?.mouseSpeed || 0)} px/s</span></p>
                           </>
                         )}
                         <motion.span 
                           animate={{ opacity: [0, 1, 0] }}
                           transition={{ repeat: Infinity, duration: 0.8 }}
                           className="inline-block w-1.5 h-3 bg-accent ml-1 translate-y-0.5"
                         />
                       </div>
                    </div>
                  </div>

                  {/* ── Real HUD Metrics ── */}
                  <div className="grid grid-cols-2 gap-4 mb-2">
                     <div className="space-y-1">
                        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">Confidence Score</p>
                        <div className="flex items-center gap-2">
                           <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-emerald-500/60 transition-all duration-1000" 
                                animate={{ width: isWarmingUp ? '15%' : `${(trustScore || 0) * 100}%` }}
                              />
                           </div>
                           <span className="text-[9px] font-bold text-white/40">{isWarmingUp ? '--' : Math.round((trustScore || 0) * 100)}%</span>
                        </div>
                     </div>
                     <div className="space-y-1 text-right">
                        <p className="text-[7px] font-black text-white/20 uppercase tracking-widest text-right">Interaction Alpha</p>
                        <p className="text-[10px] font-bold text-white/60">
                           {riskLevel === 'safe' ? 'IDENTITY_STABLE' : riskLevel === 'watch' ? 'PATTERN_DRIFT' : 'ALERT_ANOMALY'}
                        </p>
                     </div>
                  </div>
                </div>

                <button
                  onClick={() => window.location.href = '/fingerprint'}
                  className="w-full py-3 bg-white/[0.02] border-t border-white/5 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] hover:bg-accent/5 hover:text-accent transition-all flex items-center justify-center gap-2"
                >
                   View Persistent Behavior ID <ArrowRight size={10} />
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
          <GlassCard className="p-8 magic-bento-card magic-bento-card--border-glow">
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
