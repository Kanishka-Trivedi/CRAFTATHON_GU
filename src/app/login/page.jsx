"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowRight, Lock, Sparkles, Mail, Key, User, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/Shared';
import DarkVeil from '../../components/DarkVeil';

const Logo = ({ size = "md" }) => {
  const isLarge = size === "lg";
  return (
    <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
      <div className={`relative ${isLarge ? 'w-12 h-12' : 'w-10 h-10'}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-xl opacity-60 blur-[3px]"
          style={{ background: 'conic-gradient(from 0deg, #FF4D6D, #8B5CF6, #00D4E8, #FF4D6D)' }}
        />
        <div className="absolute inset-[3px] rounded-[10px] bg-navy-950 flex items-center justify-center z-10">
          <div className="relative">
            <Lock size={isLarge ? 20 : 16} className="text-white relative z-10" />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 blur-[10px]"
              style={{ background: 'linear-gradient(135deg, #FF4D6D, #8B5CF6)', opacity: 0.9 }}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-sora font-bold ${isLarge ? 'text-2xl' : 'text-xl'} tracking-tighter leading-none text-white`}>BehaveGuard</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse shadow-[0_0_8px_#00E5A0]" />
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Both email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await login(email, password);
    if (result?.success) {
      router.push('/dashboard');
    } else {
      setError(result?.message || 'Biometric authentication failed. Re-verify credentials.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-white relative p-6 overflow-hidden bg-[#020617]">
      <div className="fixed inset-0 z-0 opacity-90 blur-[120px] pointer-events-none scale-150">
        <DarkVeil speed={0.45} noiseIntensity={0.02} scanlineIntensity={0.08} warpAmount={0.22} />
      </div>
      <div className="bg-mesh z-0">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
        </div>

        <GlassCard className="p-10 border-white/5 overflow-hidden" style={{ background: 'rgba(6, 13, 31, 0.9)', borderColor: 'rgba(79,110,247,0.25)' }}>
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-cyber font-mono text-[9px] uppercase tracking-[0.2em] font-black">Secure Authentication</span>
              <div className="h-[1px] flex-1 bg-white/5"></div>
            </div>
            <h2 className="font-sora font-semibold text-2xl text-primary">Welcome Back</h2>
            <p className="text-secondary font-dm text-sm mt-1">Unified credential verification active.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-electric transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.mehta@gmail.com"
                  className="w-full bg-white/5 border border-white/[0.08] rounded-xl pl-12 pr-4 py-4 text-white text-base font-dm focus:outline-none focus:ring-2 focus:ring-electric/40 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3 px-1">PASSWORD</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-electric transition-colors" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/[0.08] rounded-xl pl-12 pr-4 py-4 text-white text-base font-dm focus:outline-none focus:ring-2 focus:ring-electric/40 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="bg-trust-danger/10 border border-trust-danger/20 text-trust-danger text-[11px] p-4 rounded-xl text-center font-bold font-dm flex items-center justify-center gap-2"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 rounded-2xl font-sora font-bold text-lg text-white shadow-2xl transition-all flex items-center justify-center space-x-3 group disabled:opacity-50 mt-4"
              style={{ background: 'linear-gradient(135deg, #00D4E8, #4F6EF7)' }}
            >
              <span>{isSubmitting ? 'Verifying Identity...' : 'Login'}</span>
              {!isSubmitting && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
            </motion.button>
          </form>

          <div className="mt-10 text-center border-t border-white/5 pt-8 space-y-4">
            <p className="text-secondary text-sm font-dm opacity-60">Identity not registered?</p>
            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/signup')}
                className="px-8 py-4 rounded-xl text-sm font-dm font-bold text-white shadow-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #00D4E8, #4F6EF7)' }}
              >
                Create Account
              </motion.button>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 rounded-xl bg-white/[0.04] border border-white/[0.1] text-sm font-dm font-bold text-white hover:bg-white/[0.08] hover:border-white/[0.2] transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </GlassCard>

        <p className="text-center font-mono text-[9px] mt-8 uppercase tracking-[0.2em] text-muted opacity-40">
          Continuous biometric analysis active across session
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
