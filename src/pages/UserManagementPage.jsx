import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, Shield, MoreVertical, 
  Trash2, RotateCw, ShieldCheck, ShieldAlert, ShieldX, Activity
} from 'lucide-react';
import { useAdmin } from '../context/AdminContext';
import { GlassCard, AdminNav, TrustBadge } from '../components/Shared';

import { clsx } from 'clsx';

const UserManagementPage = () => {
  const { users } = useAdmin();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'Enrolled': return <ShieldCheck size={16} className="text-trust-safe" />;
      case 'Anomaly': return <ShieldAlert size={16} className="text-trust-watch" />;
      case 'Blocked': return <ShieldX size={16} className="text-trust-danger" />;
      default: return <Activity size={16} className="text-secondary" />;
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
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl uppercase tracking-tight">Security User Directory</h1>
            <p className="text-secondary mt-1">Manage enrolment and trust profiles for all guarded users</p>
          </div>
          <button className="bg-accent px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] transition-all flex items-center space-x-2">
             <Shield size={16} />
             <span>Enrol New User</span>
          </button>
        </header>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
           <div className="lg:col-span-1">
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-accent transition-all group">
                 <Search size={18} className="mr-3 text-secondary group-focus-within:text-accent transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search name or ID..." 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="bg-transparent border-none outline-none text-sm w-full font-medium" 
                 />
              </div>
           </div>
           <div className="lg:col-span-3 flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
                 {['All', 'Enrolled', 'Anomaly', 'Blocked', 'Pending'].map((f) => (
                    <button 
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={clsx(
                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        statusFilter === f ? "bg-accent shadow-[0_0_15px_rgba(108,99,255,0.4)] text-white" : "text-secondary hover:text-white"
                      )}
                    >
                      {f}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {filteredUsers.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                 <GlassCard className="p-8 border-white/5 hover:border-accent/40 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-8">
                       <div className="flex items-center space-x-4">
                          <div className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-2xl relative",
                            u.status === 'Enrolled' ? "bg-accent-teal" : (u.status === 'Anomaly' ? "bg-trust-watch" : "bg-trust-danger")
                          )}>
                             {u.avatar}
                             <div className="absolute -bottom-1 -right-1 p-1 bg-bg-card rounded-lg border border-white/10">
                                <StatusIcon status={u.status} />
                             </div>
                          </div>
                          <div>
                             <h4 className="font-bold text-lg leading-tight group-hover:text-accent transition-colors">{u.name}</h4>
                             <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">ID_{1000 + u.id} · {u.lastActive}</p>
                          </div>
                       </div>
                       <button className="p-2 hover:bg-white/10 rounded-lg text-secondary transition-all"><MoreVertical size={18} /></button>
                    </div>

                    <div className="space-y-6">
                       <div>
                          <div className="flex justify-between text-[10px] font-bold text-secondary uppercase tracking-widest mb-2">
                             <span>Current Trust Score</span>
                             <span className={clsx(u.trustScore > 0.8 ? "text-trust-safe" : "text-trust-watch")}>{Math.round(u.trustScore * 100)}% Confidence</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className={clsx("h-full", u.trustScore > 0.8 ? "bg-trust-safe" : "bg-trust-watch")} style={{ width: `${u.trustScore * 100}%` }}></div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                             <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Type Pattern</p>
                             <p className="text-xs font-bold text-primary">Signature Matched</p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1 text-right">
                             <p className="text-[10px] text-secondary font-bold uppercase tracking-widest text-right">Risk Factor</p>
                             <p className="text-xs font-bold text-primary">None Detected</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                       <button className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 hover:text-accent hover:border-accent/20 transition-all">
                          <RotateCw size={14} />
                          <span>Reset Score</span>
                       </button>
                       {u.status === 'Blocked' ? (
                         <button className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-trust-safe/10 border border-trust-safe/20 text-[10px] font-black uppercase tracking-widest text-trust-safe hover:bg-trust-safe/20 transition-all">
                           <ShieldCheck size={14} />
                           <span>Unblock</span>
                         </button>
                       ) : (
                         <button className="flex items-center justify-center space-x-2 py-3 rounded-xl bg-trust-danger/10 border border-trust-danger/20 text-[10px] font-black uppercase tracking-widest text-trust-danger hover:bg-trust-danger/20 transition-all">
                           <ShieldX size={14} />
                           <span>Freeze</span>
                         </button>
                       )}
                    </div>
                 </GlassCard>
              </motion.div>
           ))}
        </div>
      </main>
    </div>
  );
};

export default UserManagementPage;
