import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, CreditCard, Send, User, Settings as SettingsIcon, 
  ArrowUpRight, ArrowDownRight, Shield, ShieldCheck, Activity, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dummyTransactions } from '../data/dummy';
import { GlassCard, TrustBadge, NavBar, ToastNotification } from '../components/Shared';
import BankCard from '../components/BankCard';
import { Line } from 'react-chartjs-2';
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

import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardPage = () => {
  const { user, trustScore, riskLevel, sessionEvents } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chartData, setChartData] = useState({
    labels: Array.from({ length: 30 }, (_, i) => i),
    datasets: [
      {
        label: 'Trust Score',
        data: Array.from({ length: 30 }, () => 0.8 + Math.random() * 0.15),
        fill: true,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  });

  // Security Freeze active defense trigger!
  useEffect(() => {
    if (riskLevel === 'danger') {
      const reason = sessionEvents.length > 0 ? sessionEvents[0].message : 'Critical behavioural anomaly detected';
      navigate('/reauth', { state: { returnPath: '/dashboard', reason: reason } });
    }
  }, [riskLevel, sessionEvents, navigate]);

  // Update chart live
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.datasets[0].data.slice(1), trustScore];
        const color = trustScore > 0.6 ? '#10B981' : (trustScore > 0.35 ? '#F59E0B' : '#EF4444');
        const bgColor = trustScore > 0.6 ? 'rgba(16, 185, 129, 0.1)' : (trustScore > 0.35 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)');
        
        return {
          ...prev,
          datasets: [{
            ...prev.datasets[0],
            data: newData,
            borderColor: color,
            backgroundColor: bgColor
          }]
        };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [trustScore]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 1, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8B8DB8' } },
      x: { display: false }
    },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    animation: { duration: 1000 }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-sora font-extrabold text-3xl md:text-4xl mb-2"
            >
              Good morning, {user?.name?.split(' ')[0] || 'User'}
            </motion.h1>
            <div className="flex items-center space-x-2 text-secondary font-medium">
              <ShieldCheck size={16} className="text-trust-safe" />
              <span>Behavioural engine active · Continuous protection enabled</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="hidden lg:flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-secondary focus-within:border-accent transition-all">
              <Search size={18} className="mr-3" />
              <input type="text" placeholder="Search accounts..." className="bg-transparent border-none outline-none text-sm w-48" />
             </div>
             <TrustBadge score={trustScore} />
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <GlassCard className="flex flex-col justify-between hover:bg-white/[0.05] transition-all cursor-pointer">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Total Balance</span>
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-bold text-2xl">₹1,24,500</h2>
              <span className="text-[10px] bg-trust-safe/10 text-trust-safe px-2 py-1 rounded font-bold">+12%</span>
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col justify-between hover:bg-white/[0.05] transition-all cursor-pointer">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Today's Spend</span>
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-bold text-2xl">₹3,240</h2>
              <span className="text-[10px] bg-trust-danger/10 text-trust-danger px-2 py-1 rounded font-bold">-4%</span>
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col justify-between hover:bg-white/[0.05] transition-all cursor-pointer">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Trust Score</span>
            <div className="flex items-end justify-between">
              <motion.h2 
                key={trustScore}
                initial={{ scale: 1.1, color: '#6C63FF' }}
                animate={{ scale: 1, color: '#fff' }}
                className="font-sora font-bold text-2xl"
              >
                {Math.round(trustScore * 100)}%
              </motion.h2>
              <Activity className="text-accent" size={18} />
            </div>
          </GlassCard>
          <GlassCard className="flex flex-col justify-between hover:bg-white/[0.05] transition-all cursor-pointer">
            <span className="text-xs font-bold text-secondary uppercase tracking-widest mb-4">Sessions Protected</span>
            <div className="flex items-end justify-between">
              <h2 className="font-sora font-bold text-2xl">47</h2>
              <Shield className="text-accent-teal" size={18} />
            </div>
          </GlassCard>
        </div>

        {/* Chart & Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          <GlassCard className="lg:col-span-2 min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-sora font-bold text-xl mb-1">Live Trust Monitoring</h3>
                <p className="text-sm text-secondary">Real-time session behaviour analysis</p>
              </div>
              <div className="flex items-center space-x-2 text-xs font-bold text-secondary uppercase tracking-widest bg-white/5 py-1 px-3 rounded-lg border border-white/5">
                <span className="w-2 h-2 rounded-full bg-trust-safe animate-pulse"></span>
                <span>Live Stream</span>
              </div>
            </div>
            <div className="flex-1 w-full mt-4">
              <Line data={chartData} options={chartOptions} />
            </div>
          </GlassCard>

          <div className="flex flex-col space-y-6">
            <div className="relative h-[220px] mb-12">
               <BankCard cardData={user} className="absolute top-0 left-0 z-20" />
               <BankCard cardData={{ ...user, accountNo: '•••• •••• •••• 9210' }} variant="mastercard" className="absolute top-10 left-6 z-10 opacity-60 scale-95" />
            </div>
            
            <GlassCard className="flex-1 border-accent/20 bg-accent/5">
               <h4 className="font-sora font-bold mb-3">Security Insights</h4>
               <p className="text-sm text-secondary mb-4 leading-relaxed">
                 Your typing rhythm is consistent with your 30-day baseline. Verification will be waived for transfers under ₹1,00,000.
               </p>
               <button className="text-xs font-bold text-accent uppercase tracking-widest hover:underline">View Deep Profile</button>
            </GlassCard>
          </div>
        </div>

        {/* Transactions List */}
        <div className="grid grid-cols-1 gap-10">
          <GlassCard>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-sora font-bold text-xl">Recent Transactions</h3>
              <button className="text-sm font-bold text-accent hover:underline">View All History</button>
            </div>
            <div className="space-y-4 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5 text-secondary text-xs uppercase tracking-widest font-bold">
                    <th className="pb-4 px-2">Merchant</th>
                    <th className="pb-4">Category</th>
                    <th className="pb-4 text-right">Amount</th>
                    <th className="pb-4 text-right px-2">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dummyTransactions.slice(0, 5).map((tx) => (
                    <tr key={tx.id} className="group hover:bg-white/[0.02] transition-all cursor-pointer">
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-4">
                          <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white", {
                            "bg-accent-teal": tx.category === "Food",
                            "bg-accent": tx.category === "Shopping",
                            "bg-trust-watch": tx.category === "Transfer",
                            "bg-accent-violet": tx.category === "Entertainment",
                            "bg-trust-safe": tx.category === "Income",
                            "bg-trust-danger": tx.category === "Bills"
                          })}>
                            {tx.merchant[0]}
                          </div>
                          <div>
                            <p className="font-bold text-primary">{tx.merchant}</p>
                            <p className="text-xs text-secondary">{tx.timestamp}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 border border-white/5 text-secondary">{tx.category}</span>
                      </td>
                      <td className="py-4 text-right">
                        <p className={clsx("font-bold", tx.amount > 0 ? "text-trust-safe" : "text-white")}>
                          {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString()}` : `- ₹${Math.abs(tx.amount).toLocaleString()}`}
                        </p>
                        <p className="text-[10px] text-secondary">Completed</p>
                      </td>
                      <td className="py-4 text-right px-2">
                         <div className="flex items-center justify-end space-x-1.5">
                            <div className={clsx("w-1.5 h-1.5 rounded-full", tx.score > 0.9 ? "bg-trust-safe" : "bg-trust-watch")}></div>
                            <span className="text-xs font-bold text-secondary">{Math.round(tx.score * 100)}%</span>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
        
        {/* ML Engine Anomaly Toasts */}
        {sessionEvents && sessionEvents.length > 0 && (
          <ToastNotification 
             show={true}
             type="danger"
             message={sessionEvents[0].message}
             onClose={() => {}}
          />
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
