"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Shield, Lock, Eye, Bell, Globe, 
  Trash2, Download, Smartphone, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard, NavBar, TrustBadge, ToastNotification } from '../../components/Shared';
import { GlobalSpotlight } from '../../components/MagicSpotlight';
import { useRef } from 'react';

import { clsx } from 'clsx';

const SettingsPage = () => {
  const { user, trustScore, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const gridRef = useRef(null);
  
  // Profile Form State
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '88776 55432', // fallback
    address: 'Mumbai, IN'
  });
  const [showToast, setShowToast] = useState(false);

  const handleSave = () => {
    updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const tabs = [
    { id: 'profile', name: 'Profile Section', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'privacy', name: 'Privacy', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main ref={gridRef} className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen max-w-7xl mx-auto bento-section",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <GlobalSpotlight gridRef={gridRef} />
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl">System Settings</h1>
            <p className="text-secondary mt-1">Configure your security preferences and profile</p>
          </div>
          <TrustBadge score={trustScore} />
        </header>

        <ToastNotification 
          show={showToast} 
          message="Profile updated successfully" 
          type="success"
          onClose={() => setShowToast(false)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Side Tabs */}
          <div className="lg:col-span-1 space-y-2">
             {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "w-full flex items-center space-x-3 px-6 py-4 rounded-2xl font-bold transition-all border",
                    activeTab === tab.id 
                      ? "bg-[#121212] border-2 border-[#430BB8] text-white shadow-[0_0_20px_rgba(67,11,184,0.2)] scale-[1.02]" 
                      : "bg-white/5 border-transparent text-secondary hover:bg-white/10"
                  )}
                >
                  <tab.icon size={20} />
                  <span>{tab.name}</span>
                </button>
             ))}
             
             <div className="pt-10 mt-10 border-t border-white/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-6 py-4 rounded-2xl font-bold text-trust-danger hover:bg-trust-danger/5 transition-all"
                >
                   <LogOut size={20} />
                   <span>Sign Out</span>
                </button>
             </div>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-3">
             <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div 
                    key="profile" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                     <GlassCard className="p-8 border-white/5 magic-bento-card magic-bento-card--border-glow">
                        <h3 className="font-sora font-bold text-xl mb-8">Personal Information</h3>
                        <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-10 mb-12">
                           <div className="relative group">
                              <div className="w-32 h-32 rounded-full border-4 border-accent bg-gradient-to-tr from-accent to-accent-violet flex items-center justify-center text-5xl font-black shadow-2xl">
                                {user?.avatar}
                              </div>
                              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-accent text-white shadow-xl hover:scale-110 transition-transform">
                                 <RefreshCw size={16} />
                              </button>
                           </div>
                           <div className="flex-1 space-y-1 text-center md:text-left">
                              <h4 className="text-2xl font-sora font-bold">{user?.name}</h4>
                              <p className="text-secondary font-medium">{user?.email}</p>
                              <div className="flex items-center justify-center md:justify-start space-x-2 mt-4">
                                 <span className="px-3 py-1 rounded-full bg-trust-safe/10 text-trust-safe text-[10px] font-bold uppercase tracking-widest border border-trust-safe/20">Verified Identity</span>
                                 <span className="px-3 py-1 rounded-full bg-accent-teal/10 text-accent-teal text-[10px] font-bold uppercase tracking-widest border border-accent-teal/20">Premier Member</span>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Full Name</label>
                             <input 
                               type="text" 
                               value={formData.name} 
                               onChange={(e) => setFormData({...formData, name: e.target.value})}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Email Address</label>
                             <input 
                               type="email" 
                               value={formData.email} 
                               onChange={(e) => setFormData({...formData, email: e.target.value})}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Phone Number</label>
                             <input 
                               type="text" 
                               value={formData.phone} 
                               onChange={(e) => setFormData({...formData, phone: e.target.value})}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-xs font-bold text-secondary uppercase tracking-widest px-1">Residential Address</label>
                             <input 
                               type="text" 
                               value={formData.address} 
                               onChange={(e) => setFormData({...formData, address: e.target.value})}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-accent outline-none" 
                             />
                           </div>
                        </div>
                        
                        <div className="mt-12 flex justify-end">
                           <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all mr-4 text-sm">Cancel</button>
                           <button 
                             onClick={handleSave}
                             className="bg-[#121212] border-2 border-[#430BB8] px-10 py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(67,11,184,0.3)] transition-all text-sm"
                           >
                             Save Profile Changes
                           </button>
                        </div>
                     </GlassCard>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div 
                    key="security" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="space-y-8"
                  >
                     <GlassCard className="p-8 border-white/5 magic-bento-card magic-bento-card--border-glow">
                        <h3 className="font-sora font-bold text-xl mb-8 flex items-center space-x-3">
                           <Lock size={20} className="text-accent" />
                           <span>Active Security Engines</span>
                        </h3>
                        <div className="space-y-4">
                           {[
                             { name: 'Continuous Biometric Authentication', desc: 'Real-time analysis of behaviour patterns', active: true },
                             { name: 'Two-Factor Authentication (OTP)', desc: 'Used for sensitive transactions and login', active: true },
                             { name: 'Device Trust Score', desc: 'Session health monitoring for browser and OS', active: true },
                             { name: 'Step-up Challenges', desc: 'Auto-trigger MFA on low trust score', active: true }
                           ].map((item, i) => (
                             <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/20 transition-all">
                                <div>
                                   <p className="font-bold text-sm tracking-tight">{item.name}</p>
                                   <p className="text-xs text-secondary mt-0.5">{item.desc}</p>
                                </div>
                                <div className="flex items-center space-x-2 text-[10px] font-black text-trust-safe uppercase tracking-widest bg-trust-safe/10 px-3 py-1.5 rounded-lg border border-trust-safe/20">
                                   <Check size={12} />
                                   <span>Active</span>
                                </div>
                             </div>
                           ))}
                        </div>
                     </GlassCard>

                     <GlassCard className="p-8 border-white/5 magic-bento-card magic-bento-card--border-glow">
                        <h3 className="font-sora font-bold text-xl mb-8">Login Sessions</h3>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.05] border border-accent/30 relative overflow-hidden">
                              <div className="flex items-center space-x-6">
                                 <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                    <Globe size={24} />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="font-bold text-sm leading-none flex items-center space-x-2">
                                       <span>Chrome on MacBook Pro</span>
                                       <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded uppercase font-bold tracking-widest">Active now</span>
                                    </p>
                                    <p className="text-xs text-secondary">Mumbai, India · IP: 103.42.12.89</p>
                                 </div>
                              </div>
                              <div className="absolute right-0 top-0 h-full flex items-center pr-6 opacity-0 hover:opacity-100 transition-all bg-gradient-to-l from-bg-card via-bg-card to-transparent">
                                 <button className="text-[10px] font-bold text-trust-danger uppercase tracking-widest hover:underline">This is not me</button>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/20 transition-all">
                              <div className="flex items-center space-x-6">
                                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-secondary">
                                    <Smartphone size={24} />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="font-bold text-sm leading-none">Safari on iPhone 15</p>
                                    <p className="text-xs text-secondary">Delhi, India · Last seen 2h ago</p>
                                 </div>
                              </div>
                              <button className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-secondary hover:bg-trust-danger/10 hover:text-trust-danger transition-all">Revoke</button>
                           </div>
                        </div>
                     </GlassCard>
                  </motion.div>
                )}

                {activeTab === 'privacy' && (
                  <motion.div 
                    key="privacy" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    className="space-y-8"
                  >
                     <GlassCard className="p-8 border-white/5 magic-bento-card magic-bento-card--border-glow">
                        <h3 className="font-sora font-bold text-xl mb-8">Data Governance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                                 <div className="flex items-center justify-between">
                                    <p className="font-bold text-sm">Behaviour Analysis</p>
                                    <div className="w-10 h-5 rounded-full bg-accent relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white"></div></div>
                                 </div>
                                 <p className="text-xs text-secondary leading-relaxed font-medium">Permit continuous observation of interactive patterns and sensor telemetry.</p>
                              </div>
                              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                                 <div className="flex items-center justify-between">
                                    <p className="font-bold text-sm">Model Retraining</p>
                                    <div className="w-10 h-5 rounded-full bg-accent relative"><div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white"></div></div>
                                 </div>
                                 <p className="text-xs text-secondary leading-relaxed font-medium">Allow the system to recalibrate your baseline profile every 30 days.</p>
                              </div>
                           </div>
                           
                           <div className="p-8 rounded-2xl bg-accent-violet/5 border border-accent-violet/10 flex flex-col justify-between">
                              <div>
                                 <div className="w-12 h-12 rounded-2xl bg-accent-violet/20 flex items-center justify-center text-accent-violet mb-6">
                                    <Eye size={24} />
                                 </div>
                                 <h4 className="font-bold mb-4">Your Privacy First</h4>
                                 <p className="text-xs text-secondary leading-relaxed mb-6 font-medium">
                                    Your behavioural digital twin is fully encrypted (E2EE) and separate from your biometric identifiers. No third party has access to your keystroke dynamics.
                                 </p>
                              </div>
                              <button className="flex items-center justify-center space-x-2 text-xs font-bold text-accent-violet uppercase tracking-widest hover:underline">
                                 <span>Read Transparency Report</span>
                                 <ChevronRight size={14} />
                              </button>
                           </div>
                        </div>
                     </GlassCard>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button className="p-8 rounded-3xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/[0.08] transition-all">
                           <Download className="text-accent mb-4 group-hover:scale-110 transition-transform" size={32} />
                           <h4 className="font-bold text-lg mb-2">Export Data (JSON)</h4>
                           <p className="text-xs text-secondary max-w-xs leading-relaxed">Download a structured copy of your entire behavioural profile.</p>
                        </button>
                        <button className="p-8 rounded-3xl border border-trust-danger/20 bg-trust-danger/5 flex flex-col items-center justify-center text-center group hover:bg-trust-danger/[0.08] transition-all">
                           <Trash2 className="text-trust-danger mb-4 group-hover:scale-110 transition-transform" size={32} />
                           <h4 className="font-bold text-lg mb-2 text-trust-danger">Close Account</h4>
                           <p className="text-xs text-secondary max-w-xs leading-relaxed">Permanently delete your account and all associated biometric markers.</p>
                        </button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

// Helper icons
function RefreshCw({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" />
    </svg>
  );
}

function Check({ size, className }) {
   return (
     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <path d="M20 6 9 17l-5-5" />
     </svg>
   );
 }
