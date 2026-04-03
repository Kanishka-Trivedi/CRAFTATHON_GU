import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ShieldAlert, ShieldCheck, Activity, 
  MapPin, Clock, ArrowRight, Zap, Target, MousePointer2, Smartphone
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useAdmin } from '../context/AdminContext';
import { GlassCard, AdminNav, TrustBadge } from '../components/Shared';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Annotation from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  Annotation
);

import { clsx } from 'clsx';

const SessionDeepDivePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sessions } = useAdmin();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const session = sessions[0] || {}; // Mocking for demo

  // Timeline chart
  const timelineData = {
    labels: Array.from({ length: 120 }, (_, i) => i),
    datasets: [
      {
        label: 'Session Trust Score',
        data: session.trustData,
        fill: true,
        borderColor: (ctx) => {
           const val = ctx.raw;
           if (val < 0.4) return '#EF4444';
           if (val < 0.6) return '#F59E0B';
           return '#10B981';
        },
        backgroundColor: 'rgba(108, 99, 255, 0.05)',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const timelineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 1, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8B8DB8' } },
      x: { display: false }
    },
    plugins: {
       legend: { display: false },
       tooltip: { enabled: true }
    }
  };

  const shapFeatures = [
    { name: 'Typing hold time', value: 87, color: '#EF4444' },
    { name: 'Inter-key flight time', value: 72, color: '#EF4444' },
    { name: 'Words per minute', value: 61, color: '#F59E0B' },
    { name: 'Swipe velocity', value: 34, color: '#F59E0B' },
    { name: 'Navigation rhythm', value: 18, color: '#10B981' },
    { name: 'Device orientation', value: 9, color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh">
        <div className="orb-1 opacity-10"></div>
        <div className="orb-2 opacity-15"></div>
      </div>

      <AdminNav isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen max-w-7xl mx-auto",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-secondary hover:text-white transition-all text-sm font-bold uppercase tracking-widest mb-10 group">
           <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
           <span>Return to Overview</span>
        </button>

        {/* Session Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
           <div className="flex items-center space-x-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-accent to-accent-violet flex items-center justify-center text-2xl font-black text-white shadow-2xl">RM</div>
              <div>
                 <div className="flex items-center space-x-3 mb-1">
                    <h1 className="font-sora font-extrabold text-3xl">Rahul Mehta</h1>
                    <span className="px-3 py-1 rounded-full bg-trust-danger/10 text-trust-danger text-[10px] font-black uppercase tracking-widest border border-trust-danger/20">Anomaly Detected</span>
                 </div>
                 <div className="flex items-center space-x-4 text-xs font-bold text-secondary uppercase tracking-widest">
                    <div className="flex items-center space-x-1"><Clock size={14} /> <span>Started 14:20 (4m 32s)</span></div>
                    <div className="flex items-center space-x-1"><MapPin size={14} /> <span>Mumbai, IN (103.42.12.89)</span></div>
                    <div className="flex items-center space-x-1"><Smartphone size={14} /> <span>Chrome 124 · Android 14</span></div>
                 </div>
              </div>
           </div>
           <div className="flex items-center space-x-4">
              <div className="text-right">
                 <p className="text-xs font-bold text-secondary tracking-widest uppercase mb-1">Risk Score</p>
                 <p className="text-3xl font-sora font-black text-trust-danger">0.78</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
              <TrustBadge score={0.22} />
           </div>
        </header>

        {/* Section 1: Timeline */}
        <div className="grid grid-cols-1 gap-12 mb-12">
           <GlassCard className="p-10 h-[450px] flex flex-col border-white/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="font-sora font-bold text-xl mb-1">Session Risk Telemetry</h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest">High-resolution activity log</p>
                 </div>
                 <div className="flex items-center space-x-3 bg-trust-danger/10 text-trust-danger px-4 py-2 rounded-xl border border-trust-danger/20 text-xs font-black uppercase tracking-widest animate-pulse">
                    <Activity size={16} />
                    <span>Detection Point at 14:23:47</span>
                 </div>
              </div>
              <div className="flex-1 w-full relative">
                 <Line data={timelineData} options={timelineOptions} />
                 {/* Annotation layer decoration (Simplified mockup) */}
                 <div className="absolute top-1/2 right-[25%] h-full w-[10%] bg-trust-danger/5 border-x border-dashed border-trust-danger/30 transform -translate-y-1/2 pointer-events-none"></div>
              </div>
              <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 flex items-center justify-center -space-x-1 opacity-20 group-hover:opacity-100 transition-all mb-4 translate-y-full group-hover:translate-y-0 duration-700">
                 <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                 <div className="w-10 h-[1px] bg-accent"></div>
                 <span className="text-[10px] font-bold text-accent uppercase tracking-widest px-2">Anomaly region</span>
                 <div className="w-10 h-[1px] bg-accent"></div>
                 <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              </div>
           </GlassCard>
        </div>

        {/* Section 2: SHAP Feature Importance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           <GlassCard className="p-10 border-white/5 flex flex-col">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="font-sora font-bold text-xl mb-1">Feature Contribution (SHAP)</h3>
                    <p className="text-xs text-secondary font-medium uppercase tracking-widest">Why was this session flagged?</p>
                 </div>
                 <Target className="text-accent-teal" size={24} />
              </div>
              <div className="flex-1 space-y-8 mt-4">
                 {shapFeatures.map((f, i) => (
                    <div key={i}>
                       <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-secondary mb-3">
                          <span>{f.name}</span>
                          <span style={{ color: f.color }}>Impact: +{(f.value / 100).toFixed(2)}</span>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${f.value}%` }}
                             transition={{ delay: i * 0.1, duration: 1 }}
                             style={{ backgroundColor: f.color }}
                             className="h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                          />
                       </div>
                    </div>
                 ))}
              </div>
           </GlassCard>

           {/* Interaction Metadata */}
           <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <GlassCard className="p-8 border-white/5 text-center">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Event Density</p>
                    <h4 className="text-3xl font-sora font-black">234 <span className="text-sm text-secondary font-medium">PKL</span></h4>
                 </GlassCard>
                 <GlassCard className="p-8 border-white/5 text-center">
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-2">Session Health</p>
                    <h4 className="text-3xl font-sora font-black text-trust-danger">Poor</h4>
                 </GlassCard>
              </div>
              
              <GlassCard className="p-8 border-white/5">
                 <h3 className="font-sora font-bold text-lg mb-6">Security Restrictions</h3>
                 <div className="space-y-4">
                    {[
                      { name: 'Funds Transfer', status: 'Locked', color: 'text-trust-danger' },
                      { name: 'Beneficiary Management', status: 'Locked', color: 'text-trust-danger' },
                      { name: 'Account Settings', status: 'Verification Required', color: 'text-trust-watch' },
                      { name: 'View Balance', status: 'Permitted', color: 'text-trust-safe' }
                    ].map((res, i) => (
                      <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-none">
                         <span className="text-sm font-bold text-primary tracking-tight">{res.name}</span>
                         <span className={clsx("text-[10px] font-black uppercase tracking-widest", res.color)}>{res.status}</span>
                      </div>
                    ))}
                 </div>
              </GlassCard>

              <div className="grid grid-cols-2 gap-6">
                 <button className="flex items-center justify-center space-x-2 py-4 border border-white/10 rounded-2xl font-bold bg-white/5 hover:bg-white/10 transition-all text-xs uppercase tracking-widest">
                    <span>Mark False Positive</span>
                 </button>
                 <button className="flex items-center justify-center space-x-2 py-4 border border-trust-danger/20 rounded-2xl font-bold bg-trust-danger/10 hover:bg-trust-danger/20 text-trust-danger transition-all text-xs uppercase tracking-widest">
                    <span>Freeze User</span>
                 </button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default SessionDeepDivePage;
