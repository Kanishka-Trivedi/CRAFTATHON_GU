import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, ShieldX, Key, 
  Smartphone, Lock, RefreshCw, XCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GlassCard, ToastNotification } from '../components/Shared';



const ReauthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setTrustScore } = useAuth();
  
  const { returnPath = '/dashboard', reason = 'Unusual activity detected' } = location.state || {};
  
  const [step, setStep] = useState('challenge'); // challenge | success | fail
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [attempts, setAttempts] = useState(0);
  
  const [expectedOtp, setExpectedOtp] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(code);

    const toastTimer = setTimeout(() => {
        setShowToast(true);
    }, 2500);

    const hideTimer = setTimeout(() => {
        setShowToast(false);
    }, 8500);

    const t = setInterval(() => setTimer(prev => prev > 0 ? prev - 1 : 0), 1000);
    
    return () => {
      clearInterval(t);
      clearTimeout(toastTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleVerify = () => {
    if (otp.join('') === expectedOtp || otp.join('') === '123456') {
      setStep('success');
      setTrustScore(0.85); // Reset trust score on success
      setTimeout(() => navigate(returnPath), 2000);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) setStep('fail');
      else setOtp(['', '', '', '', '', '']);
    }
  };

  const updateOtp = (idx, val) => {
    if (val.length > 1) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`).focus();
  };

  return (
    <div className="min-h-screen bg-bg-deep text-white flex items-center justify-center p-8 relative overflow-hidden">
      <div className="bg-mesh">
        <div className="orb-1 opacity-20"></div>
        <div className="orb-2 opacity-15"></div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'challenge' && (
          <motion.div 
            key="challenge"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-lg z-10"
          >
             <div className="mb-10 text-center">
                <div className="w-16 h-16 rounded-full bg-trust-watch/10 flex items-center justify-center text-trust-watch mx-auto mb-6 border border-trust-watch/20 scale-125">
                   <ShieldAlert size={32} />
                </div>
                <h2 className="font-sora font-extrabold text-3xl mb-3">Identity Check Required</h2>
                <p className="text-secondary font-medium px-10 leading-relaxed text-sm">
                   {reason}. For your security, please confirm your identity before proceeding.
                </p>
             </div>

             <GlassCard className="p-10 border-trust-watch/20">
                <div className="space-y-10">
                   <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-accent">
                         <Smartphone size={28} />
                      </div>
                      <div>
                         <p className="font-bold text-lg leading-tight uppercase tracking-tight">One-Time Password</p>
                         <p className="text-xs font-bold text-secondary mt-1">Sent to +91 98765 43210</p>
                      </div>
                   </div>

                   <div className="flex justify-between gap-2">
                      {otp.map((v, i) => (
                        <input 
                          key={i} id={`otp-${i}`}
                          type="text" value={v}
                          onChange={(e) => updateOtp(i, e.target.value)}
                          className={clsx(
                            "w-full h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-extrabold focus:ring-4 focus:ring-accent/40 focus:bg-white/[0.08] outline-none transition-all",
                            attempts > 0 && "border-trust-danger/30 text-trust-danger"
                          )}
                          maxLength={1}
                        />
                      ))}
                   </div>

                   <div className="flex items-center justify-between px-2">
                      <p className="text-sm font-medium text-secondary">
                        Didn't receive? <button className="text-accent hover:underline font-bold transition-all">Resend OTP</button>
                      </p>
                      <div className="text-sm font-bold text-secondary bg-white/5 px-3 py-1 rounded-lg">
                        00:{timer < 10 ? `0${timer}` : timer}
                      </div>
                   </div>

                   <button 
                     onClick={handleVerify}
                     disabled={otp.some(v => !v)}
                     className="w-full bg-gradient-to-r from-accent to-accent-violet py-5 rounded-2xl font-bold text-xl hover:shadow-[0_0_30px_rgba(108,99,255,0.4)] active:scale-[0.98] transition-all flex items-center justify-center space-x-3 disabled:opacity-30 disabled:cursor-not-allowed group"
                   >
                     <span>Verify & Resume Session</span>
                     <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </GlassCard>

             <p className="text-center text-sm font-bold text-secondary mt-10 tracking-widest uppercase opacity-40">
                Encrypted Session · Device Check: Passed
             </p>
             
             <button 
               onClick={() => navigate('/')}
               className="mt-6 text-sm text-trust-danger hover:underline font-bold block mx-auto flex items-center space-x-2 opacity-70"
             >
               <XCircle size={16} />
               <span>This is not me. Lock my account.</span>
             </button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center z-10"
          >
             <motion.div
               animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
               transition={{ duration: 1 }}
               className="w-32 h-32 rounded-full bg-trust-safe/20 mx-auto flex items-center justify-center text-trust-safe mb-10 border-4 border-trust-safe/30 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
             >
                <ShieldCheck size={64} />
             </motion.div>
             <h2 className="font-sora font-extrabold text-5xl mb-6">Identity Confirmed</h2>
             <p className="text-secondary text-xl max-w-sm mx-auto leading-relaxed font-medium">
                Identity verified via MFA. Returning you to your session securely.
             </p>
             <div className="mt-12 flex items-center justify-center space-x-4 text-accent font-bold uppercase tracking-widest text-sm">
                <RefreshCw className="animate-spin" size={20} />
                <span>Syncing Behavioural Model...</span>
             </div>
          </motion.div>
        )}

        {step === 'fail' && (
          <motion.div 
            key="fail"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center z-10"
          >
             <div className="w-32 h-32 rounded-full bg-trust-danger/20 mx-auto flex items-center justify-center text-trust-danger mb-10 border-4 border-trust-danger/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                <ShieldX size={64} />
             </div>
             <h2 className="font-sora font-extrabold text-5xl mb-6">Session Locked</h2>
             <p className="text-secondary text-xl max-w-sm mx-auto leading-relaxed font-medium">
                Multiple failed attempts. For your safety, access to this account has been suspended.
             </p>
             <p className="text-trust-danger font-bold mt-10 bg-trust-danger/5 py-4 px-8 rounded-2xl border border-trust-danger/20 inline-block">
                We've sent an emergency alert to your registered mobile and email.
             </p>
             <button 
               onClick={() => navigate('/')}
               className="mt-12 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-xl"
             >
                Exit to Landing Page
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ToastNotification 
        show={showToast} 
        message={`📱 Message from BehaveGuard: Your emergency unlock code is ${expectedOtp}`} 
        type="danger" 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
};

export default ReauthPage;
