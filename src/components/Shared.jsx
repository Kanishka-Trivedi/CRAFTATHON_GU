"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Shield, AlertTriangle, X, ChevronRight, Menu,
  LayoutDashboard, CreditCard, Send, User, Settings as SettingsIcon,
  BarChart3, Activity, ShieldAlert, Users, LogOut, Search, ShieldCheck, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export const GlassCard = ({ children, className }) => (
  <div className={clsx("glass p-6", className)}>
    {children}
  </div>
);

export const TrustBadge = ({ score }) => {
  const color = score >= 0.7 ? 'bg-trust-safe' : (score >= 0.4 ? 'bg-trust-watch' : 'bg-trust-danger');
  const level = score >= 0.7 ? 'SAFE' : (score >= 0.4 ? 'WATCH' : 'DANGER');
  const safetyPct = Math.round((score || 0) * 100);

  return (
    <div className={clsx("flex items-center space-x-2 px-3 py-1.5 rounded-full border border-white/10 glass", color + "/20")}>
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={clsx("w-2 h-2 rounded-full", color)}
      />
      <span className={clsx("text-xs font-bold tracking-wider", color.replace('bg-', 'text-'))}>{level} {safetyPct}%</span>
    </div>
  );
};

export const RiskBar = ({ value, label }) => {
  const color = value < 30 ? 'bg-trust-safe' : (value < 60 ? 'bg-trust-watch' : 'bg-trust-danger');
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1 text-secondary">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={clsx("h-full", color)}
        />
      </div>
    </div>
  );
};

export const MiniSparkline = ({ data, color = "#6C63FF" }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / range) * height}`).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const ToastNotification = ({ message, type = "success", show, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className={clsx("fixed bottom-8 right-8 z-[9999] p-4 rounded-xl glass border-white/10 flex items-center space-x-3 shadow-2xl",
          type === "success" ? "border-l-4 border-l-trust-safe" : "border-l-4 border-l-trust-danger"
        )}
      >
        {type === "success" ? <Check className="text-trust-safe" /> : <Shield className="text-trust-danger" />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md transition-colors"><X size={14} /></button>
      </motion.div>
    )}
  </AnimatePresence>
);

export const LoadingSpinner = () => (
  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
);

export const NavBar = ({ isCollapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Transactions', path: '/transactions', icon: 'CreditCard' },
    { name: 'Transfer', path: '/transfer', icon: 'Send' },
    { name: 'Your Fingerprint', path: '/profile', icon: 'User' },
    { name: 'Settings', path: '/settings', icon: 'SettingsIcon' },
  ];

  const Icons = {
    LayoutDashboard, CreditCard, Send, User, SettingsIcon
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={clsx(
        "fixed left-0 top-0 h-screen glass border-r border-white/5 z-50 transition-all duration-300 md:flex flex-col hidden",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="p-6 mb-8 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
              <div className="relative w-9 h-9">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-lg opacity-60 blur-[2px]"
                  style={{ background: 'conic-gradient(from 0deg, #FF4D6D, #8B5CF6, #00D4E8, #FF4D6D)' }}
                />
                <div className="absolute inset-[2.5px] rounded-[7px] bg-navy-950 flex items-center justify-center z-10">
                  <div className="relative">
                    <Lock size={14} className="text-white relative z-10" />
                    <div className="absolute inset-0 blur-[6px]" style={{ background: 'linear-gradient(135deg, #FF4D6D, #8B5CF6)', opacity: 0.8 }} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-sora font-extrabold text-base tracking-tighter leading-none text-white">BehaveGuard</span>
                <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-emerald font-bold mt-1">Active</span>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!isCollapsed)} className="p-2 hover:bg-white/5 rounded-lg text-secondary">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group",
                pathname === item.path ? "bg-accent/20 text-accent" : "text-secondary hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="w-6 h-6 flex items-center justify-center opacity-70 group-hover:opacity-100 flex-shrink-0">
                {React.createElement(Icons[item.icon], { size: 20 })}
              </span>
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          {!isCollapsed && user && (
            <div className="glass p-3 rounded-xl flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-violet flex items-center justify-center text-white font-bold">{user.avatar || 'U'}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-trust-safe"></div>
                  <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Protected</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={clsx(
              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group w-full text-trust-danger hover:bg-trust-danger/10",
              isCollapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            {!isCollapsed && <span className="font-bold text-sm tracking-wide">Secure Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 glass z-[60] flex items-center justify-around px-4 border border-white/10 shadow-2xl">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={clsx(
              "p-3 rounded-2xl transition-all",
              pathname === item.path ? "bg-accent/20 text-accent shadow-inner" : "text-secondary"
            )}
          >
            {React.createElement(Icons[item.icon], { size: 24 })}
          </Link>
        ))}
      </div>
    </>
  );
}

export const AdminNav = ({ isCollapsed, setCollapsed }) => {
  const pathname = usePathname();
  const navItems = [
    { name: 'Overview', path: '/admin', icon: 'BarChart3' },
    { name: 'Sessions', path: '/admin/alerts', icon: 'Activity' },
    { name: 'Critical Alerts', path: '/admin/alerts', icon: 'ShieldAlert' },
    { name: 'User Access', path: '/admin/users', icon: 'Users' },
  ];

  const Icons = {
    BarChart3, Activity, ShieldAlert, Users
  };

  return (
    <>
      <aside className={clsx(
        "fixed left-0 top-0 h-screen glass border-r border-white/5 z-50 transition-all duration-300 md:flex flex-col hidden",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="p-6 mb-8 flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3 group animate-pulse-slow">
              <div className="relative w-9 h-9">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-lg opacity-60 blur-[2px]"
                  style={{ background: 'conic-gradient(from 0deg, #FF4D6D, #8B5CF6, #00D4E8, #FF4D6D)' }}
                />
                <div className="absolute inset-[2.5px] rounded-[7px] bg-navy-950 flex items-center justify-center z-10">
                  <Lock size={14} className="text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-sora font-extrabold text-base tracking-tighter leading-none text-white uppercase">Admin Guard</span>
                <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-muted font-bold mt-1">Superuser Access</span>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!isCollapsed)} className="p-2 hover:bg-white/5 rounded-lg text-secondary">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={clsx(
                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group",
                pathname === item.path ? "bg-accent/20 text-accent border border-accent/20" : "text-secondary hover:bg-white/5 hover:text-white"
              )}
            >
              <span className="w-6 h-6 flex items-center justify-center opacity-70 group-hover:opacity-100 flex-shrink-0">
                {React.createElement(Icons[item.icon], { size: 20 })}
              </span>
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-8">
          {!isCollapsed && <div className="glass p-3 rounded-xl text-center bg-accent-violet/10 border-accent-violet/20">
            <p className="text-[10px] text-accent-violet font-bold uppercase tracking-widest mb-1">System Status</p>
            <p className="text-xs text-white font-medium">All Engines Normal</p>
          </div>}
        </div>
      </aside>

      {/* Admin Mobile Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 h-20 glass z-[60] flex items-center justify-around px-4 border border-white/10 shadow-2xl">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={clsx(
              "p-3 rounded-2xl transition-all",
              pathname === item.path ? "bg-accent/20 text-accent shadow-inner" : "text-secondary"
            )}
          >
            {React.createElement(Icons[item.icon], { size: 24 })}
          </Link>
        ))}
      </div>
    </>
  );
}
