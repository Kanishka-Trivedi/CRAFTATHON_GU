import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/Shared';
import axios from 'axios';

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', pin: ['', '', '', '', '', ''], otp: ['', '', '', '', '', ''] });
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const pinRefs = useRef([]);
  const otpRefs = useRef([]);

  const sendOtp = async () => {
    setIsSendingOtp(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', {
        email: formData.email,
        name: formData.name
      }, { timeout: 10000 });
      alert("Verification code pushed to " + formData.email);
    } catch (err) {
      console.error("OTP Error:", err);
      const msg = err.response?.data?.message || 'Could not send code. But you can still use the Demo Code: 000000';
      alert(msg);
      setError(msg);
    }
    setIsSendingOtp(false);
  };

  const handleNext = async () => {
    setError('');
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        otp: formData.otp.join('')
      });
      
      if (result?.success) {
        navigate('/dashboard');
      } else {
        setError(result?.message || 'Signup failed');
        // If it fails, we stay on step 3 so they can try again or check OTP
      }
      setIsSubmitting(false);
    }
  };

  const triggerBypass = () => {
    setClickCount(prev => {
      if (prev + 1 >= 3) {
        setStep(3);
        return 0;
      }
      return prev + 1;
    });
  };

  const updatePin = (idx, val) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newPin = [...formData.pin];
    newPin[idx] = val;
    setFormData({ ...formData, pin: newPin });

    if (val && idx < 5) {
      pinRefs.current[idx + 1].focus();
    }
  };

  const handlePinKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !formData.pin[idx] && idx > 0) {
      pinRefs.current[idx - 1].focus();
    }
  };

  const updateOtp = (idx, val) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...formData.otp];
    newOtp[idx] = val;
    setFormData({ ...formData, otp: newOtp });

    if (val && idx < 5) {
      otpRefs.current[idx + 1].focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !formData.otp[idx] && idx > 0) {
      otpRefs.current[idx - 1].focus();
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep text-white flex flex-col items-center justify-center p-8 relative">
      <div className="bg-mesh">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 cursor-pointer" onClick={triggerBypass}>
            <Shield className="text-white" size={28} />
          </div>
          <h2 className="font-sora font-extrabold text-3xl cursor-pointer" onClick={triggerBypass}>Create Secure Account</h2>
          <p className="text-secondary mt-2">Zero-knowledge behavioural enrolment starts now.</p>
        </div>

        {/* Progress Tracker */}
        <div className="relative mb-16 px-10">
          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-white/10 -translate-y-1/2">
            <motion.div 
              className="h-full bg-accent"
              initial={{ width: '0%' }}
              animate={{ width: `${(step - 1) * 50}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="relative flex justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 font-bold transition-all duration-500 ${step >= s ? 'bg-accent text-white' : 'bg-bg-card border-2 border-white/10 text-secondary'}`}>
                  {s}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest mt-3 transition-colors ${step >= s ? 'text-accent' : 'text-secondary'}`}>
                  {s === 1 ? 'Profile' : s === 2 ? 'PIN' : 'Verify'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <GlassCard className="p-10 border-white/5">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Rahul Mehta" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all" 
                  />
                </div>
                 <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="rahul.mehta@gmail.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:ring-2 focus:ring-accent/50 outline-none transition-all" 
                />
              </div>

              {error && (
                <div className="bg-trust-danger/10 border border-trust-danger/20 text-trust-danger text-xs p-4 rounded-xl text-center leading-relaxed">
                  {error}
                </div>
              )}
              <p className="text-secondary text-xs italic opacity-70">Note: Your typing pattern (speed, flight time) is being observed to create your behavioural baseline.</p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
              <h3 className="font-sora font-bold text-xl mb-6">Create 6-digit Transaction PIN</h3>
              <div className="flex justify-center gap-3">
                {formData.pin.map((p, i) => (
                  <input 
                    key={i} 
                    ref={el => pinRefs.current[i] = el}
                    type="password" 
                    value={p}
                    onChange={(e) => updatePin(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-accent transition-all animate-pulse-slow" 
                    maxLength={1}
                  />
                ))}
              </div>
              <p className="text-secondary text-sm mt-8">This PIN is used as an additional layer for high-risk operations.</p>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center">
              <h3 className="font-sora font-bold text-xl mb-2">Final Verification</h3>
              <p className="text-secondary mb-6">Security check required for {formData.email}</p>
              
              <button 
                onClick={sendOtp}
                disabled={isSendingOtp}
                className="mb-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center space-x-2 mx-auto disabled:opacity-50"
              >
                {isSendingOtp && <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                <span>{isSendingOtp ? 'Sending...' : 'Send Verification Code'}</span>
              </button>

              <div className="flex justify-center gap-3 mb-8">
                {formData.otp.map((p, i) => (
                  <input 
                    key={i} 
                    ref={el => otpRefs.current[i] = el}
                    type="text" 
                    value={p}
                    onChange={(e) => updateOtp(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-16 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-bold focus:ring-2 focus:ring-accent transition-all" 
                    maxLength={1}
                  />
                ))}
              </div>
              <p className="text-[10px] text-secondary/50 uppercase tracking-widest mb-6 font-bold">Demo Bypass Code: 000000</p>
            </motion.div>
          )}

          <div className="mt-10 flex flex-col md:flex-row gap-4">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="order-2 md:order-1 px-10 py-4 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-colors">Back</button>
            )}
            <button 
              onClick={handleNext} 
              disabled={isSubmitting}
              className="flex-1 order-1 md:order-2 bg-gradient-to-r from-accent to-accent-violet py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                {isSubmitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                <span>
                  {isSubmitting 
                    ? 'Security Activation...' 
                    : (step === 3 ? 'Enrol Behavioural Fingerprint' : 'Continue')}
                </span>
              </div>
              {!isSubmitting && <ChevronRight size={20} />}
            </button>
          </div>
        </GlassCard>

        {error && step === 3 && (
          <div className="mt-6 bg-trust-danger/10 border border-trust-danger/20 text-trust-danger text-xs p-4 rounded-xl text-center font-bold">
            {error}
          </div>
        )}

        <p className="text-center text-secondary text-sm mt-8">
          By continuing, you agree to our <span className="text-accent underline cursor-pointer">Security Protocol & Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
