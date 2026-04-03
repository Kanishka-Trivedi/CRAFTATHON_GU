"use client";
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, ShieldX, Clock, 
  MapPin, User, ChevronDown, ChevronUp, Search, Filter, 
  Download, ExternalLink, SlidersHorizontal
} from 'lucide-react';
import { Link } from 'next/navigation';
import { useAdmin } from '../../context/AdminContext';
import { GlassCard, AdminNav } from '../../components/Shared';



const AlertsLogPage = () => {
  const { alerts } = useAdmin();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = filter === 'All' || a.severity === filter;
    const matchesSearch = a.user.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl uppercase tracking-tight">Security Alerts Log</h1>
            <p className="text-secondary mt-1">Detailed operational history of anomaly detections</p>
          </div>
          <div className="flex items-center space-x-3">
             <button className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest shadow-xl">
                <Download size={14} />
                <span>Export Report</span>
             </button>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
           <div className="lg:col-span-1">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-accent transition-all group">
                 <Search size={18} className="mr-3 text-secondary group-focus-within:text-accent transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search user..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="bg-transparent border-none outline-none text-sm w-full font-medium" 
                 />
              </div>
           </div>
           <div className="lg:col-span-3 flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                 {['All', 'Critical', 'High', 'Medium', 'Resolved'].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setFilter(f)}
                      className={clsx(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        filter === f ? "bg-accent shadow-[0_0_15px_rgba(108,99,255,0.4)] text-white" : "text-secondary hover:text-white"
                      )}
                    >
                      {f}
                    </button>
                 ))}
              </div>
              <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-secondary hover:text-white transition-all">
                <SlidersHorizontal size={20} />
              </button>
           </div>
        </div>

        {/* Alerts Table */}
        <div className="space-y-4">
           {filteredAlerts.map((alert) => (
              <GlassCard key={alert.id} className="p-0 border-white/5 overflow-hidden group">
                 <div 
                   className={clsx(
                     "p-6 flex flex-col lg:flex-row lg:items-center cursor-pointer hover:bg-white/[0.02] transition-all",
                     expandedId === alert.id && "bg-white/[0.04]"
                   )}
                   onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                 >
                    <div className="flex items-center space-x-6 lg:w-[25%] mb-4 lg:mb-0">
                       <div className={clsx(
                         "w-3 h-3 rounded-full flex-shrink-0 animate-pulse",
                         alert.severity === 'Critical' ? "bg-trust-danger shadow-[0_0_10px_#EF4444]" : (alert.severity === 'High' ? "bg-trust-watch shadow-[0_0_10px_#F59E0B]" : "bg-accent")
                       )}></div>
                       <div>
                          <p className="font-bold text-sm tracking-tight">{alert.time.split(' ')[1]} IST</p>
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-0.5">{alert.time.split(' ')[0]}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 lg:w-[20%] mb-4 lg:mb-0">
                       <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center text-accent-violet border border-accent-violet/20 font-bold text-sm">{alert.user[0]}</div>
                       <div>
                          <p className="font-bold text-sm text-primary">{alert.user}</p>
                          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">ID_9381{alert.id}</p>
                       </div>
                    </div>

                    <div className="lg:w-[25%] mb-4 lg:mb-0 px-2">
                       <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Anomaly Trigger</p>
                       <p className="text-sm font-medium text-white">{alert.trigger}</p>
                    </div>

                    <div className="lg:w-[20%] mb-4 lg:mb-0">
                       <span className={clsx(
                         "px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest leading-none",
                         alert.status === 'Resolved' ? "bg-trust-safe/10 border-trust-safe/20 text-trust-safe" : "bg-trust-watch/10 border-trust-watch/20 text-trust-watch"
                       )}>
                          {alert.status}
                       </span>
                    </div>

                    <div className="lg:w-[10%] flex lg:justify-end">
                       {expandedId === alert.id ? <ChevronUp className="text-secondary" /> : <ChevronDown className="text-secondary" />}
                    </div>
                 </div>

                 <AnimatePresence>
                    {expandedId === alert.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-white/[0.01]"
                      >
                         <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <div>
                               <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Session Fingerprint</h4>
                               <div className="space-y-4">
                                  <div className="flex justify-between text-xs font-bold">
                                     <span className="text-secondary">Browser Profile</span>
                                     <span className="text-primary truncate ml-4">Chrome 124 (ARM64)</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-bold">
                                     <span className="text-secondary">Network IP</span>
                                     <span className="text-accent underline tracking-widest">103.42.12.89</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-bold">
                                     <span className="text-secondary">Location</span>
                                     <span className="text-primary">Maharashtra, India</span>
                                  </div>
                               </div>
                            </div>
                            
                            <div>
                               <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Behaviour Analysis</h4>
                               <div className="space-y-3">
                                  {[
                                    { f: 'Typing Rhythm', v: 92, status: 'Danger' },
                                    { f: 'Flight Time Variance', v: 84, status: 'Warning' },
                                    { f: 'Navigation Flow', v: 22, status: 'Normal' }
                                  ].map((item, i) => (
                                    <div key={i} className="flex flex-col">
                                       <div className="flex justify-between text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5">
                                          <span>{item.f}</span>
                                          <span className={item.status === 'Danger' ? 'text-trust-danger' : 'text-trust-watch'}>{item.status}</span>
                                       </div>
                                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                          <div className={clsx("h-full", item.status === 'Danger' ? 'bg-trust-danger' : 'bg-trust-watch')} style={{ width: `${item.v}%` }}></div>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="flex flex-col justify-between">
                               <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-6 border-b border-white/5 pb-2">Administrative Actions</h4>
                               <div className="grid grid-cols-2 gap-4">
                                  <Link href={`/admin/session/${alert.id}`} className="px-4 py-3 bg-accent/10 border border-accent/20 rounded-xl text-[10px] font-black text-accent uppercase tracking-widest text-center hover:bg-accent/20 transition-all flex items-center justify-center space-x-2">
                                     <ExternalLink size={14} />
                                     <span>Full Inspect</span>
                                  </Link>
                                  <button className="px-4 py-3 bg-trust-danger/10 border border-trust-danger/20 rounded-xl text-[10px] font-black text-trust-danger uppercase tracking-widest hover:bg-trust-danger/20 transition-all">Freeze Account</button>
                                  <button className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest col-span-2 hover:bg-white/10 transition-all">Mark as Resolved</button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>
              </GlassCard>
           ))}
        </div>
      </main>
    </div>
  );
};

export default AlertsLogPage;
