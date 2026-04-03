'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Lock, Mail, Fingerprint, Zap, ArrowLeft, ArrowRight, Check, X, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dynamic from 'next/dynamic';
const DotLottieReact = dynamic(() => import('@lottiefiles/dotlottie-react').then(mod => mod.DotLottieReact), { ssr: false });
import axios from 'axios';
import loginLottie from '../../assets/login.json';
import FloatingInput from '../../components/FloatingInput';
import logo from '../../assets/logo.png';
import Image from 'next/image';

const STEPS = [
  { label: 'Identity Setup' },
  { label: 'Transaction PIN' },
  { label: 'Activation Code' },
];

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    pin: ['', '', '', '', '', ''],
    otp: ['', '', '', '', '', ''],
  });
  const [mounted, setMounted] = useState(false);
  const [lottieData, setLottieData] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isOtpEnabled, setIsOtpEnabled] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    setMounted(true);
    setLottieData(loginLottie);
  }, []);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const pinRefs = useRef([]);
  const otpRefs = useRef([]);
  const [emailStatus, setEmailStatus] = useState('idle'); // idle, checking, exists, available
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [pinStrength, setPinStrength] = useState({ score: 0, label: 'Incomplete', color: 'white/10' });

  const checkEmailUniqueness = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/check-email', { email });
      setEmailStatus(res.data.exists ? 'exists' : 'available');
    } catch (err) {
      setEmailStatus('idle');
    }
  };

  React.useEffect(() => {
    let score = 0;
    const p = formData.password;
    if (p.length >= 8) score += 25;
    if (/[A-Z]/.test(p)) score += 25;
    if (/[0-9]/.test(p)) score += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(p)) score += 25;
    setPasswordStrength(score);
  }, [formData.password]);

  React.useEffect(() => {
    const pin = formData.pin.join('');
    if (pin.length < 6) {
      setPinStrength({ score: 0, label: 'Incomplete', color: 'white/10' });
      return;
    }

    const consecutiveAsc = "0123456789";
    const consecutiveDesc = "9876543210";
    const isConsecutive = consecutiveAsc.includes(pin) || consecutiveDesc.includes(pin);
    const isRepeated = /^(.)\1+$/.test(pin);
    const isSimplePattern = /^(..)\1{2}$/.test(pin) || /^(...)\1{1}$/.test(pin); // 121212 or 123123

    if (isConsecutive || isRepeated) {
      setPinStrength({ score: 33, label: 'Weak', color: 'rose-500' });
    } else if (isSimplePattern) {
      setPinStrength({ score: 66, label: 'Moderate', color: 'amber-500' });
    } else {
      setPinStrength({ score: 100, label: 'Strong', color: 'emerald-500' });
    }
  }, [formData.pin]);

  const checkPinStrength = () => {
    const pinStr = formData.pin.join('');
    if (pinStr.length !== 6) return false;
    const consecutiveAsc = "0123456789";
    const consecutiveDesc = "9876543210";
    if (consecutiveAsc.includes(pinStr) || consecutiveDesc.includes(pinStr)) return false;
    if (/^(.)\1+$/.test(pinStr)) return false;
    return true;
  };

  const isPasswordValid =
    formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) &&
    /[0-9]/.test(formData.password);

  const isPinValid = formData.pin.every(p => p !== '') && checkPinStrength();

  const sendOtp = async () => {
    setIsSendingOtp(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', {
        email: formData.email, name: formData.name,
      });
      setShowOtpModal(true);
    } catch (err) {
      setError('System unavailable. Please try again later.');
    }
    setIsSendingOtp(false);
  };

  const handleNext = async () => {
    setError('');

    if (step === 1 && (!formData.name || !formData.email || !formData.password)) {
      return setError('All fields are required.');
    }
    if (step === 1 && !formData.email.includes('@')) {
      return setError('Please enter a valid email address.');
    }
    if (step === 1 && emailStatus === 'exists') {
      return setError('This email is already registered.');
    }
    if (step === 1 && emailStatus === 'checking') {
      return setError('Verifying email availability...');
    }
    if (step === 1 && passwordStrength < 100) {
      return setError('Password must be 8+ chars with uppercase, number, and special character (100% required).');
    }
    if (step === 2 && !isPinValid) {
      return setError('PIN is too simple. Avoid consecutive or repeated digits.');
    }

    if (step < 3) return setStep(step + 1);

    setIsSubmitting(true);
    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      pin: formData.pin.join(''),
      otp: formData.otp.join(''),
    });

    if (result?.success) {
      router.push('/dashboard');
    } else {
      setError(result?.message || 'Enrolment failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const updateDigit = (arr, key, idx, val, refs) => {
    if (val.length > 1) val = val.slice(-1);
    const next = [...arr];
    next[idx] = val;
    setFormData((f) => ({ ...f, [key]: next }));
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (arr, idx, e, refs) => {
    if (e.key === 'Backspace' && !arr[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  // ── Shared OTP/PIN input styles
  const digitClass = `
        w-11 h-14 bg-white/[0.04] border border-white/10 rounded-xl
        text-center text-2xl font-black outline-none
        focus:border-indigo-500/70 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.12)]
        transition-all duration-200 text-indigo-100/90
    `;

  return (
    <div className="h-screen max-h-screen bg-[#070814] text-white flex overflow-hidden font-inter relative">
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(79,70,229,0.1)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(99,102,241,0.08)_0%,_transparent_40%)]" />
      </div>

      {/* ─── LEFT SIDEBAR ────────────────────────────────────── */}
      <div className="hidden lg:flex w-[42%] relative flex-col border-r border-white/5 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full py-10 px-10">
          {/* Logo */}
          <div onClick={() => router.push('/')} className="flex items-center gap-3 cursor-pointer group w-fit">
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

          {/* Lottie + 3 Rings */}
          <div className="flex items-center justify-center">
            <div className="relative w-[320px] h-[320px] flex items-center justify-center">
              {/* Ring 1 */}
              <motion.div
                animate={{ rotate: 360, opacity: [0.4, 0.7, 0.4] }}
                transition={{ rotate: { duration: 24, repeat: Infinity, ease: 'linear' }, opacity: { duration: 4, repeat: Infinity } }}
                className="absolute w-[310px] h-[310px] rounded-full border-2 border-indigo-500/40"
                style={{ boxShadow: '0 0 20px rgba(99,102,241,0.15)', filter: 'blur(0.5px)' }}
              />
              {/* Ring 2 */}
              <motion.div
                animate={{ rotate: -360, opacity: [0.2, 0.5, 0.2] }}
                transition={{ rotate: { duration: 18, repeat: Infinity, ease: 'linear' }, opacity: { duration: 5, repeat: Infinity } }}
                className="absolute w-[250px] h-[250px] rounded-full border-2 border-indigo-400/25"
                style={{ boxShadow: '0 0 14px rgba(129,140,248,0.1)' }}
              />
              {/* Ring 3 */}
              <motion.div
                animate={{ scale: [1, 1.07, 1], opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-[190px] h-[190px] rounded-full border-2 border-white/15"
              />

              {mounted && lottieData && (
                <DotLottieReact
                  data={lottieData}
                  loop
                  autoplay
                  style={{ width: '250px', height: '250px', position: 'relative', zIndex: 10 }}
                />
              )}
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/25 mb-6 text-center w-full">
              Enrolment Progress
            </p>
            {STEPS.map((s, i) => {
              const n = i + 1;
              const isPast = step > n;
              const isCurrent = step === n;
              return (
                <div key={n} className="flex items-center gap-4 w-full max-w-[200px]">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 transition-all duration-500 ${isCurrent ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]' :
                    isPast ? 'bg-indigo-500/20 border border-indigo-500/30' :
                      'bg-white/5 border border-white/10 text-white/20'
                    }`}>
                    {isPast ? '✓' : n}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${isCurrent ? 'text-white' : isPast ? 'text-indigo-400/60' : 'text-white/25'
                    }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: FORM ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 sm:px-14 relative z-10 overflow-hidden">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div onClick={() => router.push('/')} className="flex lg:hidden items-center gap-3 cursor-pointer mb-10 w-fit">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center overflow-hidden p-1">
              <Image
                src={logo}
                alt="Logo"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <span className="font-sora font-extrabold text-lg tracking-tighter text-white">BehaveGuard</span>
          </div>

          <AnimatePresence mode="wait">
            {/* ── STEP 1 */}
            {step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-sora font-black text-4xl tracking-tight mb-1.5 text-white">Create Account</h2>
                  <p className="text-white/35 text-sm font-medium">Join the behavioral authentication network.</p>
                </div>
                <div className="space-y-4">
                  <FloatingInput
                    id="su-name"
                    label="Enter Full Name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    icon={User}
                    autoComplete="name"
                  />
                  <div className="space-y-2">
                    <FloatingInput
                      id="su-email"
                      label="Enter Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (emailStatus !== 'idle') setEmailStatus('idle');
                      }}
                      onBlur={() => checkEmailUniqueness(formData.email)}
                      icon={Mail}
                      autoComplete="email"
                    />
                    <div className="px-1 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        {emailStatus === 'checking' && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-white/30">Checking Node...</span>
                          </>
                        )}
                        {emailStatus === 'available' && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-emerald-400/80">Identity Available</span>
                          </>
                        )}
                        {emailStatus === 'exists' && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="text-red-400/80">User Already Registered</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <FloatingInput
                    id="su-phone"
                    label="Active Phone Number"
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    icon={Phone}
                    placeholder="+91 00000 00000"
                  />

                  <div className="space-y-3">
                    <FloatingInput
                      id="su-pass"
                      label="Create Password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      icon={Lock}
                      autoComplete="new-password"
                    />

                    {/* Password Strength UI */}
                    <div className="px-1 space-y-2.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em]">
                        <span className="text-white/25">Entropy Strength</span>
                        <span className={`transition-colors duration-500 ${passwordStrength === 100 ? 'text-emerald-400' :
                          passwordStrength >= 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                          {passwordStrength}%
                        </span>
                      </div>

                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                        {[25, 50, 75, 100].map((stepVal) => (
                          <div
                            key={stepVal}
                            className={`h-full flex-1 transition-all duration-700 rounded-full ${passwordStrength >= stepVal
                              ? (passwordStrength === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                passwordStrength >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                              : 'bg-transparent'
                              }`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 pt-1">
                        {[
                          { label: '8+ Characters', valid: formData.password.length >= 8 },
                          { label: 'Uppercase', valid: /[A-Z]/.test(formData.password) },
                          { label: 'Number', valid: /[0-9]/.test(formData.password) },
                          { label: 'Special', valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
                        ].map((req, idx) => (
                          <div key={idx} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight transition-all duration-300 ${req.valid ? 'text-emerald-400' : 'text-rose-400/50'
                            }`}>
                            {req.valid ? (
                              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                                <Check size={8} strokeWidth={4} />
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                <X size={8} strokeWidth={4} className="text-rose-500" />
                              </div>
                            )}
                            {req.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-white/20 text-[11px] leading-relaxed">
                  Your typing cadence is passively observed during enrolment to build your behavioral baseline.
                </p>
              </motion.div>
            )}

            {/* ── STEP 2 */}
            {step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-8"
              >
                <div className="w-16 h-16 bg-indigo-500/15 rounded-[28px] flex items-center justify-center mx-auto shadow-[0_0_28px_rgba(99,102,241,0.15)]">
                  <Fingerprint className="text-indigo-400" size={30} />
                </div>
                <div>
                  <h2 className="font-sora font-black text-4xl tracking-tight mb-1.5 text-white">Set Transaction PIN</h2>
                  <p className="text-white/35 text-sm font-medium">Required for high-value authorization requests.</p>
                </div>
                <div className="flex justify-center gap-2.5">
                  {formData.pin.map((p, i) => (
                    <input key={i} ref={el => pinRefs.current[i] = el}
                      type="password" value={p} maxLength={1}
                      onChange={(e) => updateDigit(formData.pin, 'pin', i, e.target.value, pinRefs)}
                      onKeyDown={(e) => handleDigitKeyDown(formData.pin, i, e, pinRefs)}
                      className={digitClass}
                    />
                  ))}
                </div>

                {/* PIN Strength Indicator */}
                <div className="max-w-[280px] mx-auto w-full space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.15em]">
                    <span className="text-white/25">PIN Strength</span>
                    <span className={`transition-colors duration-500`} style={{ color: `var(--${pinStrength.color.split('-')[0]})` || pinStrength.color }}>
                      <span className={`text-${pinStrength.color}`}>{pinStrength.label}</span>
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                    {[33, 66, 100].map((stepVal) => (
                      <div
                        key={stepVal}
                        className={`h-full flex-1 transition-all duration-700 rounded-full ${pinStrength.score >= stepVal
                          ? (pinStrength.score === 100 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                            pinStrength.score >= 66 ? 'bg-amber-500' : 'bg-rose-500')
                          : 'bg-transparent'
                          }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 font-medium">Avoid using patterns or consecutive digits for maximum security.</p>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3 */}
            {step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center space-y-8"
              >
                <Zap className="text-indigo-500 mx-auto" size={52} />
                <div>
                  <h2 className="font-sora font-black text-4xl tracking-tight mb-1.5 text-white">Verify Identity</h2>
                  <p className="text-white/35 text-sm font-medium">
                    A 6-digit code was dispatched to <span className="text-white/60">{formData.email}</span>
                  </p>
                </div>
                <button onClick={sendOtp} disabled={isSendingOtp}
                  className="mx-auto flex items-center gap-2 px-7 py-3 rounded-full bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50"
                >
                  {isSendingOtp ? 'Sending…' : 'Send Verification Code'}
                </button>
                <div className="flex justify-center gap-2.5">
                  {formData.otp.map((p, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      type="text" value={p} maxLength={1}
                      disabled={!isOtpEnabled}
                      onChange={(e) => updateDigit(formData.otp, 'otp', i, e.target.value, otpRefs)}
                      onKeyDown={(e) => handleDigitKeyDown(formData.otp, i, e, otpRefs)}
                      className={`${digitClass} ${!isOtpEnabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                    />
                  ))}
                </div>
                {!isOtpEnabled && (
                  <p className="text-[10px] text-indigo-400/50 uppercase tracking-widest font-black animate-pulse">
                    Awaiting Initiation Code…
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-5 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors group flex-shrink-0"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform text-white" />
              </button>
            )}
            <button onClick={handleNext} disabled={isSubmitting}
              className="flex-1 h-14 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-[0_8px_24px_rgba(255,255,255,0.1)] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {step === 3 ? 'Complete Enrolment' : 'Continue'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-[11px] uppercase font-bold tracking-[0.2em] text-white/25">
            Already a member?{' '}
            <span onClick={() => router.push('/login')} className="text-indigo-400 cursor-pointer hover:opacity-70 transition-opacity">
              Sign In
            </span>
          </p>
        </div>
      </div>

      {/* ── OTP Modal (Confirmation) */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm bg-[#0C0D1E] border border-indigo-500/30 rounded-[32px] p-8 text-center space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                <Check className="text-emerald-400" size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold font-sora text-white">Activation Sent</h3>
                <p className="text-sm text-white/40 leading-relaxed px-2">
                  A verification handshake hash has been dispatched to <span className="text-indigo-400 font-bold">{formData.email}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setIsOtpEnabled(true);
                }}
                className="w-full py-4 rounded-2xl bg-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_25px_rgba(99,102,241,0.3)] hover:shadow-[0_10px_35px_rgba(99,102,241,0.5)] transition-all active:scale-95"
              >
                Accept Authorization
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SignupPage;
