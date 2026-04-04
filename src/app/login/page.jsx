'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight, Mail, Lock, Database, Fingerprint } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import dynamic from 'next/dynamic';
const DotLottieReact = dynamic(() => import('@lottiefiles/dotlottie-react').then(mod => mod.DotLottieReact), { ssr: false });
import loginLottie from '../../assets/login.json';
import FloatingInput from '../../components/FloatingInput';
import logo from '../../assets/logo.png';
import Image from 'next/image';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [lottieData, setLottieData] = useState(null);
  const { login } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    setLottieData(loginLottie);
  }, []);

  const [isBioMode, setIsBioMode] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    let result;
    if (isBioMode) {
      // In Bio Mode, we call the bio-login with captured cadence
      // For the demo, we assume the cadence is just what we tracked in state
      result = await axios.post('http://localhost:5000/api/auth/bio-login',
        { email, typingSpeed }, { withCredentials: true }
      ).then(r => r.data).catch(err => ({ success: false, message: err.response?.data?.message }));
    } else {
      result = await login(email, password);
    }

    if (result?.success) {
      router.push('/dashboard');
    } else {
      setError(result?.message || 'Authentication failed. Biological mismatch detected.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen bg-[#070814] text-white flex overflow-hidden font-inter relative">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(79,70,229,0.1)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(99,102,241,0.08)_0%,_transparent_40%)]" />
      </div>

      {/* ─── LEFT PANEL ──────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 relative flex-col items-center justify-center border-r border-white/5 overflow-hidden">

        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Lottie + 3 Rings */}
          <div className="relative w-[380px] h-[380px] flex items-center justify-center">
            {/* Ring 1 — outer, slow rotate + pulse opacity */}
            <motion.div
              animate={{ rotate: 360, opacity: [0.4, 0.7, 0.4] }}
              transition={{ rotate: { duration: 28, repeat: Infinity, ease: 'linear' }, opacity: { duration: 4, repeat: Infinity } }}
              className="absolute w-[370px] h-[370px] rounded-full border-2 border-indigo-500/40 blur-[1px]"
              style={{ boxShadow: '0 0 24px rgba(99,102,241,0.15)' }}
            />
            {/* Ring 2 — counter-rotate */}
            <motion.div
              animate={{ rotate: -360, opacity: [0.2, 0.5, 0.2] }}
              transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' }, opacity: { duration: 5, repeat: Infinity } }}
              className="absolute w-[300px] h-[300px] rounded-full border-2 border-indigo-400/30"
              style={{ boxShadow: '0 0 16px rgba(129,140,248,0.1)' }}
            />
            {/* Ring 3 — inner pulse */}
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-[230px] h-[230px] rounded-full border-2 border-white/20"
            />

            {/* Lottie player */}
            {mounted && lottieData && (
              <DotLottieReact
                data={lottieData}
                loop
                autoplay
                style={{ width: '300px', height: '300px', position: 'relative', zIndex: 10 }}
              />
            )}
          </div>

          {/* Premium tagline block */}
          <div className="mt-10 text-center space-y-5 px-6">
            {/* Live status pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400/80 mx-auto">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              Behavioral engine active
            </div>

            {/* Gradient headline */}
            <h2 className="font-sora font-black text-[28px] leading-[1.15] tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40">
                Your Behavior Is<br />Your Password.
              </span>
            </h2>

            {/* Divider */}
            <div className="flex items-center gap-3 justify-center">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10 max-w-[60px]" />
              <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10 max-w-[60px]" />
            </div>

            {/* Supporting sub-copy */}
            <p className="text-white/30 text-xs font-medium leading-relaxed max-w-[240px] mx-auto">
              Keystroke dynamics · Mouse entropy · Session fingerprinting
            </p>
          </div>
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL: FORM ───────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 sm:px-16 relative z-10 transition-colors duration-500">
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="w-full max-w-[400px]"
        >
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="flex items-center space-x-3 mb-12 cursor-pointer group w-fit"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform duration-300 overflow-hidden p-1">
              <Image
                src={logo}
                alt="Logo"
                width={32}
                height={32}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>
            <span className="font-sora font-extrabold text-xl tracking-tighter">BehaveGuard</span>
          </div>

          {/* Header */}
          <div className="mb-10">
            <h1 className="font-sora font-black text-[38px] leading-tight tracking-tight mb-1.5 text-white">
              {isBioMode ? 'Neural ID' : 'Sign In'}
            </h1>
            <p className="text-white/40 text-sm font-medium flex items-center gap-2">
              <Database size={13} className="text-indigo-400" />
              {isBioMode ? 'Authenticating by Interaction DNA' : 'Secure behavioral authentication'}
            </p>
          </div>

          <div className="flex gap-4 p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-8">
            <button
              onClick={() => setIsBioMode(false)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isBioMode ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
            >
              Password
            </button>
            <button
              onClick={() => setIsBioMode(true)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isBioMode ? 'bg-white text-black' : 'text-white/40 hover:text-white flex items-center justify-center gap-2'}`}
            >
              {isBioMode ? 'Bio-Signature' : <><Fingerprint size={12} /> Bio-Sign</>}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <FloatingInput
              id="login-email"
              label="Enter Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
              autoComplete="email"
            />

            {!isBioMode ? (
              <FloatingInput
                id="login-password"
                label="Enter Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                required
                autoComplete="current-password"
              />
            ) : (
              <div className="relative">
                <FloatingInput
                  id="login-bio"
                  label="Type passphrase: BEHAVEGUARD NODE"
                  type="text"
                  value={password} // Reusing field for simplicity in this demo
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    // Fake tracking for visual feedback
                    if (val.length % 3 === 0) setTypingSpeed(10 + Math.random() * 20);
                  }}
                  icon={Fingerprint}
                  required
                />
                <div className="mt-2 flex justify-between px-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Rhythm Capture: {typingSpeed} CPS</span>
                  <div className="flex gap-1">
                    <div className={`w-1 h-3 rounded-full ${typingSpeed > 0 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    <div className={`w-1 h-3 rounded-full ${typingSpeed > 5 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                    <div className={`w-1 h-3 rounded-full ${typingSpeed > 15 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Options row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-9 h-5 bg-white/5 border border-white/10 rounded-full peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all duration-300" />
                  <div className="absolute top-[3px] left-[3px] w-3.5 h-3.5 bg-white/40 peer-checked:bg-white rounded-full peer-checked:translate-x-4 transition-all duration-300 shadow-sm" />
                </div>
                <span className="text-[11px] uppercase font-bold tracking-widest text-white/30 group-hover:text-white/60 transition-colors">
                  Remember device
                </span>
              </label>
              <button type="button" className="text-[11px] uppercase font-bold tracking-widest text-indigo-400 hover:opacity-70 transition-opacity">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] overflow-hidden group transition-all duration-300 disabled:opacity-50 mt-2"
            >
              <div className="absolute inset-0 bg-white group-hover:opacity-0 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center gap-3 text-black group-hover:text-white transition-colors duration-300 font-bold">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Access Vault
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-[11px] uppercase font-bold tracking-[0.2em] text-white/25">
            New to the network?{' '}
            <span
              onClick={() => router.push('/signup')}
              className="text-indigo-400 cursor-pointer hover:opacity-70 transition-opacity"
            >
              Register
            </span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
