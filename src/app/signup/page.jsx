"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ChevronRight, Lock, Sparkles, Send, Mail,
  CheckCircle2, X, User, Activity, ShieldAlert, Key,
  Check, AlertCircle, Fingerprint
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/Shared';
import axios from 'axios';
import DarkVeil from '../../components/DarkVeil';

const SuccessModal = ({ isOpen, onClose, email }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy-950/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-navy-900 border border-white/10 rounded-2xl p-8 relative overflow-hidden text-center shadow-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }} />
          <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center mx-auto mb-6 text-emerald">
            <Mail size={32} />
          </div>
          <h3 className="font-sora font-bold text-xl text-white mb-2">Verification Sent!</h3>
          <p className="font-dm text-secondary text-sm leading-relaxed mb-8">
            We've pushed a secure code to:<br />
            <span className="text-white font-bold">{email}</span>
          </p>
          <button onClick={onClose} className="w-full py-4 rounded-xl bg-white text-navy-950 font-dm font-bold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2">
            Proceed to Activation <ChevronRight size={18} />
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Logo = ({ size = "md" }) => {
  const isLarge = size === "lg";
  return (
    <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.href = '/'}>
      <div className={`relative ${isLarge ? 'w-12 h-12' : 'w-10 h-10'}`}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-xl opacity-60 blur-[3px]" style={{ background: 'conic-gradient(from 0deg, #FF4D6D, #8B5CF6, #00D4E8, #FF4D6D)' }} />
        <div className="absolute inset-[3px] rounded-[10px] bg-navy-950 flex items-center justify-center z-10">
          <div className="relative">
            <Lock size={isLarge ? 20 : 16} className="text-white relative z-10" />
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute inset-0 blur-[10px]" style={{ background: 'linear-gradient(135deg, #FF4D6D, #8B5CF6)', opacity: 0.9 }} />
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

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', pin: ['', '', '', '', '', ''], otp: ['', '', '', '', '', ''] });
  const { signup } = useAuth();
  const router = useRouter();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [validation, setValidation] = useState({ length: false, capital: false, special: false, number: false });
  const pinRefs = useRef([]);
  const otpRefs = useRef([]);

  useEffect(() => {
    const pass = formData.password;
    setValidation({
      length: pass.length >= 8,
      capital: /[A-Z]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      number: /[0-9]/.test(pass)
    });
  }, [formData.password]);

  const isPasswordValid = Object.values(validation).every(Boolean);
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.');

  // PIN Strength check
  const checkPinStrength = () => {
    const pinStr = formData.pin.join('');
    if (pinStr.length !== 6) return false;

    // Consecutive numbers (ascending or descending)
    const consecutiveAsc = "0123456789";
    const consecutiveDesc = "9876543210";
    if (consecutiveAsc.includes(pinStr) || consecutiveDesc.includes(pinStr)) return false;

    // All same numbers
    if (/^(.)\1+$/.test(pinStr)) return false;

    return true;
  };

  const isPinValid = formData.pin.every(p => p !== '') && checkPinStrength();

  const sendOtp = async () => {
    if (!formData.email) {
      setError("Provide an email address first.");
      return;
    }
    setIsSendingOtp(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email, name: formData.name }, { timeout: 10000 });
      setIsSuccessModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification system is offline. Demo code 000000 is active.');
    }
    setIsSendingOtp(false);
  };

  const handleNext = async () => {
    setError('');
    if (step === 1 && !formData.name) {
      setError("Please reveal your name.");
      return;
    }

    // Step 2: Advanced Email Check (normalized)
    if (step === 2) {
      if (!isEmailValid) {
        setError("A valid institutional or personal email is required.");
        return;
      }

      setIsSubmitting(true);
      setError('');
      try {
        const check = await axios.post('http://localhost:5000/api/auth/check-email', { email: formData.email.toLowerCase().trim() });
        setIsSubmitting(false);
        if (check.data.exists) {
          setError("This identity node already exists. Please log in or use a different email.");
          return; // Strictly stop here
        }
        // If it doesn't exist, proceed
        setStep(3);
        return;
      } catch (err) {
        console.error("Email check failed:", err);
        setError("Validation service offline. Using demo fallback.");
        setIsSubmitting(false);
        setStep(3); // Allow fallback for demo stability IF user wants
        return;
      }
    }

    if (step === 3 && !isPasswordValid) {
      setError("Security requirements not met for password.");
      return;
    }
    if (step === 4 && !isPinValid) {
      setError("PIN is too simple. Avoid consecutive or repeated digits.");
      return;
    }

    if (step === 1 || step === 3 || step === 4) {
      setStep(step + 1);
    } else if (step === 5) {
      setIsSubmitting(true);
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        pin: formData.pin.join(''),
        otp: formData.otp.join('')
      });
      if (result?.success) router.push('/dashboard');
      else setError(result?.message || 'Biometric enrolment failed.');
      setIsSubmitting(false);
    }
  };

  const updatePin = (idx, val) => {
    if (val.length > 1) val = val.slice(-1);
    const newPin = [...formData.pin];
    newPin[idx] = val;
    setFormData({ ...formData, pin: newPin });
    if (val && idx < 5) pinRefs.current[idx + 1].focus();
  };

  const stepsMetadata = [
    { name: 'Profile', icon: User, nextLabel: 'Secure Email', nextIcon: Mail },
    { name: 'Email', icon: Mail, nextLabel: 'Create Password', nextIcon: Key },
    { name: 'Password', icon: Key, nextLabel: 'Shield PIN', nextIcon: Shield },
    { name: 'PIN', icon: Shield, nextLabel: 'Verification', nextIcon: Send },
    { name: 'Verify', icon: CheckCircle2, nextLabel: 'Launch App', nextIcon: Sparkles }
  ];

  const currentMeta = stepsMetadata[step - 1];

  // Button Visibility Logic
  const canShowNext = () => {
    if (step === 1) return formData.name.length > 2;
    if (step === 2) return isEmailValid;
    if (step === 3) return isPasswordValid;
    if (step === 4) return isPinValid;
    if (step === 5) return formData.otp.every(o => o !== '');
    return true;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-8 relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 opacity-90 blur-[120px] pointer-events-none scale-150">
        <DarkVeil speed={0.45} noiseIntensity={0.02} scanlineIntensity={0.08} warpAmount={0.22} />
      </div>
      <div className="bg-mesh z-0"><div className="orb-1"></div><div className="orb-2"></div><div className="orb-3"></div></div>

      <SuccessModal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} email={formData.email} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-xl z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6"><Logo size="lg" /></div>
          <h2 className="font-sora font-extrabold text-3xl">Enrolment Sequence</h2>
          <p className="text-secondary mt-2 font-dm text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald animate-pulse"></span>
            Biometric Enrolment Active
          </p>
        </div>

        {/* Progress Tracker */}
        <div className="relative mb-16 px-4">
          <div className="absolute top-[20px] left-10 right-10 h-[2px] bg-white/5">
            <motion.div className="h-full shadow-[0_0_20px_rgba(79,110,247,0.5)]"
              style={{ background: 'linear-gradient(90deg, #00D4E8, #4F6EF7, #1B3678)' }}
              animate={{ width: `${((step - 1) / (stepsMetadata.length - 1)) * 100}%` }}
              transition={{ duration: 1 }} />
          </div>
          <div className="relative flex justify-between">
            {stepsMetadata.map((meta, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all duration-700 ${step >= i + 1 ? 'text-white' : 'bg-navy-900 border-2 border-white/10 text-secondary scale-90'}`}
                  style={step >= i + 1 ? { background: 'linear-gradient(135deg, #FF4D6D, #8B5CF6)' } : {}}>
                  <meta.icon size={18} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <GlassCard className="p-10 border-white/5 overflow-hidden" style={{ background: 'rgba(6, 13, 31, 0.9)' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <span className="text-cyber font-mono text-[10px] uppercase tracking-widest font-black">Identity Enrolment</span>
                  <h3 className="font-sora font-bold text-2xl text-white mt-1">First, your name.</h3>
                </div>
                <input type="text" autoFocus placeholder="Rahul Mehta" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-electric outline-none transition-all text-xl" />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <span className="text-cyber font-mono text-[10px] uppercase tracking-widest font-black">Contact Node</span>
                  <h3 className="font-sora font-bold text-2xl text-white mt-1">What is your Email?</h3>
                </div>
                <input type="email" autoFocus placeholder="rahul.mehta@gmail.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-electric outline-none transition-all text-xl" />
                {!isEmailValid && formData.email.length > 0 && <p className="text-trust-danger text-[10px] font-bold uppercase tracking-widest px-2 italic">Waiting for valid @ identity...</p>}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <span className="text-cyber font-mono text-[10px] uppercase tracking-widest font-black">Security Key</span>
                  <h3 className="font-sora font-bold text-2xl text-white mt-1">Create your password.</h3>
                </div>
                <input type="password" autoFocus placeholder="••••••••" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-electric outline-none transition-all text-xl" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[{ l: '8 Characters', m: validation.length }, { l: 'Capital Letter', m: validation.capital }, { l: 'Special Char', m: validation.special }, { l: 'Numeric Digit', m: validation.number }].map((v, i) => (
                    <div key={i} className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all ${v.m ? 'bg-emerald/10 text-emerald' : 'bg-white/5 text-white/20'}`}>
                      {v.m ? <Check size={12} /> : <AlertCircle size={12} />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{v.l}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                <div>
                  <span className="text-cyber font-mono text-[10px] uppercase tracking-widest font-black">Transaction Shield</span>
                  <h3 className="font-sora font-bold text-2xl text-white mt-1">Safety PIN Configuration</h3>
                  <p className="text-secondary text-xs mt-2">PINs like 123456 or 111111 are rejected for your safety.</p>
                </div>
                <div className="flex justify-center gap-3">
                  {formData.pin.map((p, i) => (
                    <input key={i} ref={el => pinRefs.current[i] = el} type="text" value={p} maxLength={1}
                      inputMode="numeric"
                      onChange={(e) => updatePin(i, e.target.value)}
                      onKeyDown={(e) => e.key === 'Backspace' && !formData.pin[i] && i > 0 && pinRefs.current[i - 1].focus()}
                      className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-electric transition-all shadow-inner" />
                  ))}
                </div>
                {formData.pin.every(p => p !== '') && !checkPinStrength() && (
                  <p className="text-trust-danger text-[10px] font-bold uppercase tracking-widest animate-pulse">PIN too simple - Sequence detected</p>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                <div>
                  <span className="text-cyber font-mono text-[10px] uppercase tracking-widest font-black">Final Enrolment</span>
                  <h3 className="font-sora font-bold text-2xl text-white mt-1">Deep Fingerprint Scan</h3>
                  <p className="text-secondary text-sm">Security code pushed to {formData.email}</p>
                </div>
                <motion.button onClick={sendOtp} disabled={isSendingOtp}
                  className="px-8 py-4 rounded-xl bg-white/5 border border-electric/20 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center shadow-lg space-x-3 mx-auto disabled:opacity-50">
                  <Send size={16} className={isSendingOtp ? "animate-spin text-cyber" : "text-cyber"} />
                  <span>{isSendingOtp ? 'Pulsing Code...' : 'Resend Code'}</span>
                </motion.button>
                <div className="flex justify-center gap-3">
                  {formData.otp.map((p, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el} type="text" value={p} maxLength={1}
                      onChange={(e) => {
                        const nextOtp = [...formData.otp]; nextOtp[i] = e.target.value.slice(-1);
                        setFormData({ ...formData, otp: nextOtp });
                        if (e.target.value && i < 5) otpRefs.current[i + 1].focus();
                      }}
                      onKeyDown={(e) => e.key === 'Backspace' && !formData.otp[i] && i > 0 && otpRefs.current[i - 1].focus()}
                      className="w-12 h-16 bg-white/10 border border-white/10 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-electric transition-all" />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 flex flex-col md:flex-row gap-6">
            <button onClick={() => step > 1 ? setStep(step - 1) : router.push('/login')}
              className="order-2 md:order-1 px-10 py-5 rounded-2xl border border-white/10 font-sora font-bold text-sm text-secondary hover:bg-white/5 hover:text-white transition-all">
              {step === 1 ? 'Discard' : 'Go Back'}
            </button>

            <AnimatePresence>
              {canShowNext() && (
                <motion.button key="next" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNext} disabled={isSubmitting}
                  className="flex-1 order-1 md:order-2 py-5 rounded-2xl font-sora font-bold text-lg text-white shadow-2xl transition-all flex items-center justify-center space-x-3 disabled:opacity-30"
                  style={{ background: 'linear-gradient(135deg, #00D4E8, #4F6EF7)' }}
                >
                  <div className="flex items-center gap-3">
                    <span>{isSubmitting ? 'Biometric Sync...' : `Next: ${currentMeta.nextLabel}`}</span>
                    <currentMeta.nextIcon size={20} className="opacity-80" />
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mt-6 bg-trust-danger/10 border border-trust-danger/20 text-trust-danger text-xs p-4 rounded-xl text-center font-bold font-dm flex items-center justify-center gap-2">
            <AlertCircle size={14} />{error}
          </motion.div>
        )}

        <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest"><Shield size={12} /> Secure</div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest"><Activity size={12} /> AI Monitored</div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest"><Fingerprint size={12} /> Biometric</div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
