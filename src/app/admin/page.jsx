"use client";
import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
   BarChart3, Activity, ShieldAlert, Users,
   ArrowUpRight, ArrowDownRight, Search, Filter,
   MapPin, Clock, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Bar, Line } from 'react-chartjs-2';
import { useAdmin } from '../../context/AdminContext';
import { GlassCard, AdminNav } from '../../components/Shared';
import {
   Chart as ChartJS,
   CategoryScale,
   LinearScale,
   BarElement,
   PointElement,
   LineElement,
   Title,
   Tooltip,
   Legend,
   Filler
} from 'chart.js';

ChartJS.register(
   CategoryScale,
   LinearScale,
   BarElement,
   PointElement,
   LineElement,
   Title,
   Tooltip,
   Legend,
   Filler
);



const AdminOverviewPage = () => {
   const [liveStats, setLiveStats] = useState(null);
   const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

   useEffect(() => {
      const fetchStats = async () => {
         try {
            const res = await axios.get('http://localhost:5000/api/behavioral/admin-stats', { withCredentials: true });
            if (res.data.success) setLiveStats(res.data);
         } catch (err) { console.error('Admin Fetch Failed', err); }
      };
      fetchStats();
   }, []);

   // Distribution chart data
   const distData = {
      labels: ['0-0.1', '0.1-0.2', '0.2-0.3', '0.3-0.4', '0.4-0.5', '0.5-0.6', '0.6-0.7', '0.7-0.8', '0.8-0.9', '0.9-1.0'],
      datasets: [{
         label: 'Sessions',
         data: liveStats?.distribution || [0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
         backgroundColor: (ctx) => {
            const val = ctx.index;
            if (val < 3) return '#EF4444';
            if (val < 6) return '#F59E0B';
            return '#10B981';
         },
         borderRadius: 6,
      }]
   };

   const anomalyData = {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
         label: 'Anomaly Count',
         data: [2, 1, 0, 1, 2, 0, 1, 3, 5, 8, 12, 15, 14, 25, 42, 18, 12, 10, 8, 6, 4, 3, 2, 1],
         fill: true,
         borderColor: '#6C63FF',
         backgroundColor: 'rgba(108, 99, 255, 0.1)',
         tension: 0.4,
         pointRadius: 0,
         borderWidth: 2,
      }]
   };

   const options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
         y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8B8DB8', font: { size: 10 } } },
         x: { grid: { display: false }, ticks: { color: '#8B8DB8', font: { size: 10 } } }
      },
      plugins: {
         legend: { display: false },
         tooltip: { enabled: true }
      }
   };

   return (
      <div className="min-h-screen bg-bg-deep text-white relative">
         <div className="bg-mesh">
            <div className="orb-1 opacity-10"></div>
            <div className="orb-2 opacity-10"></div>
         </div>

         <AdminNav isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

         <main className={clsx(
            "transition-all duration-300 p-8 pt-6 min-h-screen",
            isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
         )}>
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
               <div>
                  <h1 className="font-sora font-extrabold text-3xl md:text-4xl uppercase tracking-tight">Security Command</h1>
                  <p className="text-secondary mt-1">Global behavioural authentication metrics</p>
               </div>
               <div className="flex items-center space-x-3 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button className="px-4 py-2 bg-accent rounded-lg text-xs font-bold uppercase tracking-widest transition-all">Live Feed</button>
                  <button className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-secondary uppercase tracking-widest transition-all">Today</button>
                  <button className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-secondary uppercase tracking-widest transition-all">All Time</button>
               </div>
            </header>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
               <GlassCard className="p-6 border-accent-teal/20 bg-accent-teal/5">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 rounded-lg bg-accent-teal/10 text-accent-teal self-start"><Users size={18} /></div>
                     <div className="flex items-center text-[10px] font-bold text-trust-safe"><ArrowUpRight size={12} className="mr-0.5" /> 100%</div>
                  </div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Enrolled Nodes</p>
                  <h2 className="text-3xl font-sora font-black mt-1">{liveStats?.totalUsers || 0}</h2>
               </GlassCard>

               <GlassCard className="p-6 border-trust-watch/20 bg-trust-watch/5">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 rounded-lg bg-trust-watch/10 text-trust-watch self-start animate-pulse"><ShieldAlert size={18} /></div>
                     <div className="flex items-center text-[10px] font-bold text-trust-danger"><ArrowUpRight size={12} className="mr-0.5" /> {(liveStats?.alerts?.length || 0) > 0 ? 'Live' : 'Zero'}</div>
                  </div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Anomaly Events</p>
                  <h2 className="text-3xl font-sora font-black mt-1 text-trust-watch">{liveStats?.alerts?.length || 0}</h2>
               </GlassCard>

               <GlassCard className="p-6 border-trust-danger/20 bg-trust-danger/5">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 rounded-lg bg-trust-danger/10 text-trust-danger self-start"><Activity size={18} /></div>
                     <div className="flex items-center text-[10px] font-bold text-secondary">Active</div>
                  </div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Active Sessions</p>
                  <h2 className="text-3xl font-sora font-black mt-1 text-trust-danger">{liveStats?.activeSessions || 0}</h2>
               </GlassCard>

               <GlassCard className="p-6 border-trust-safe/20 bg-trust-safe/5">
                  <div className="flex justify-between items-start mb-4">
                     <div className="p-2 rounded-lg bg-trust-safe/10 text-trust-safe self-start"><BarChart3 size={18} /></div>
                     <div className="flex items-center text-[10px] font-bold text-trust-safe"><ArrowUpRight size={12} className="mr-0.5" /> 0.5%</div>
                  </div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Avg Pulse Health</p>
                  <h2 className="text-3xl font-sora font-black mt-1">{liveStats?.avgTrustScore || '100'}%</h2>
               </GlassCard>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
               <GlassCard className="p-8 h-[400px] flex flex-col">
                  <h3 className="font-sora font-bold text-xl mb-1">Trust Score Distribution</h3>
                  <p className="text-xs text-secondary mb-8">Aggregated health across all active sessions</p>
                  <div className="flex-1 w-full flex items-center justify-center">
                     <Bar data={distData} options={options} />
                  </div>
               </GlassCard>
               <GlassCard className="p-8 h-[400px] flex flex-col">
                  <h3 className="font-sora font-bold text-xl mb-1">Incident Timeline</h3>
                  <p className="text-xs text-secondary mb-8">Anomaly frequency per hour (last 24h)</p>
                  <div className="flex-1 w-full flex items-center justify-center">
                     <Line data={anomalyData} options={options} />
                  </div>
               </GlassCard>
            </div>

            {/* Recent Alerts Table */}
            <GlassCard className="overflow-hidden border-white/5">
               <div className="p-8 pb-4 flex items-center justify-between">
                  <h3 className="font-sora font-bold text-xl">Operational Logs</h3>
                  <Link href="/admin/alerts" className="text-xs font-bold text-accent hover:underline uppercase tracking-widest">Full Incident Log</Link>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                     <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-secondary text-xs uppercase tracking-widest font-bold">
                           <th className="py-5 px-8">Session / Time</th>
                           <th className="py-5">User Identity</th>
                           <th className="py-5">Risk Factor</th>
                           <th className="py-5">Trigger Primary</th>
                           <th className="py-5">Protocol Taken</th>
                           <th className="py-5 px-8 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {(liveStats?.alerts || []).map((alert) => (
                           <tr key={alert.id} className="group hover:bg-white/[0.03] transition-all">
                              <td className="py-5 px-8">
                                 <div className="flex flex-col">
                                    <span className="font-bold text-primary text-sm tracking-tight">{alert.time.split(',')[1]}</span>
                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">EV_{alert.id.slice(-6)}</span>
                                 </div>
                              </td>
                              <td className="py-5">
                                 <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-violet flex items-center justify-center text-[10px] font-bold text-white shadow-lg">?</div>
                                    <span className="text-sm font-bold text-primary">Node_{alert.user?.slice(-6)}</span>
                                 </div>
                              </td>
                              <td className="py-5">
                                 <div className="flex items-center space-x-2">
                                    <div className={clsx(
                                       "w-2 h-2 rounded-full animate-pulse",
                                       alert.severity === 'Critical' ? "bg-trust-danger" : (alert.severity === 'High' ? "bg-trust-watch" : "bg-accent")
                                    )}></div>
                                    <span className={clsx(
                                       "text-xs font-black uppercase tracking-widest",
                                       alert.severity === 'Critical' ? "text-trust-danger" : (alert.severity === 'High' ? "text-trust-watch" : "text-accent")
                                    )}>{alert.severity} ({Math.round(alert.riskScore * 100)}%)</span>
                                 </div>
                              </td>
                              <td className="py-5">
                                 <span className="text-secondary text-sm font-medium">{alert.trigger}</span>
                              </td>
                              <td className="py-5">
                                 <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-secondary uppercase tracking-widest">{alert.action}</span>
                              </td>
                              <td className="py-5 px-8 text-right">
                                 <p className="text-[10px] font-black text-accent-teal uppercase tracking-widest">Under Review</p>
                              </td>
                           </tr>
                        ))}
                        {(liveStats?.alerts || []).length === 0 && (
                           <tr><td colSpan="6" className="py-20 text-center text-white/20 font-black uppercase tracking-widest">No anomalies recorded in current epoch</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </GlassCard>
         </main>
      </div>
   );
};

export default AdminOverviewPage;
