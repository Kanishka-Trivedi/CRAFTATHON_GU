"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BankCard from '../components/BankCard';
import { GlassCard } from '../components/Shared';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const result = await login(email, password);
    if (result?.success) {
      router.push('/dashboard');
    } else {
      setError(result?.message || 'Login failed');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex text-white relative">
      <div className="bg-mesh">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      {/* Left Hero */}
      <div className="hidden lg:flex flex-col flex-1 p-16 justify-center relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl z-10"
        >
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield className="text-white" size={24} />
            </div>
            <span className="font-sora tracking-tight font-extrabold text-3xl">BehaveGuard</span>
          </div>

          <h1 className="font-sora font-extrabold text-[56px] leading-[1.1] mb-6 tracking-tight">
            Secure banking that <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-teal">knows it's you.</span>
          </h1>
          
          <p className="text-xl text-secondary mb-12 leading-relaxed max-w-xl">
            BehaveGuard learns your unique behaviour pattern to keep your account safe — invisibly. 
            No friction, just pure security based on how you type, move, and interact.
          </p>

          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-3xl font-sora font-bold text-accent-teal">99.7%</p>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-sora font-bold text-accent-violet">0ms</p>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">Friction</p>
            </div>
            <div>
              <p className="text-3xl font-sora font-bold text-accent">256-bit</p>
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">Encrypted</p>
            </div>
          </div>
        </motion.div>

        {/* Floating Cards Background Decoration */}
        <div className="absolute top-1/2 right-0 transform translate-x-1/4 -translate-y-1/2 -z-0">
          <motion.div
            animate={{ translateY: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <BankCard 
              className="-rotate-12 absolute -top-40 right-20 z-0 opacity-40 scale-75" 
              cardData={{ name: 'RAHUL MEHTA', accountNo: '•••• •••• •••• 4829' }}
            />
            <BankCard 
              className="rotate-6 z-10" 
              variant="mastercard"
              cardData={{ name: 'RAHUL MEHTA', accountNo: '•••• •••• •••• 9210' }}
            />
          </motion.div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 lg:flex-[0_0_45%] flex items-center justify-center p-8 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <GlassCard className="p-10 border-white/5 border-[1px]">
            <div className="mb-10 text-center lg:hidden flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                <Shield className="text-white" size={28} />
              </div>
              <h2 className="font-sora font-bold text-2xl">BehaveGuard</h2>
            </div>
            
            <div className="mb-10">
              <h2 className="font-sora font-bold text-3xl mb-2">Welcome Back</h2>
              <p className="text-secondary">Signature biometric authentication active.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2 px-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.mehta@gmail.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white/[0.08] transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-secondary mb-2 px-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-accent/50 focus:bg-white/[0.08] transition-all"
                  required
                />
              </div>

              {error && (
                <div className="bg-trust-danger/10 border border-trust-danger/20 text-trust-danger text-xs p-4 rounded-xl text-center">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent focus:ring-accent/30" />
                  <span className="text-sm text-secondary group-hover:text-white transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm text-accent hover:text-accent-violet transition-colors">Forgot password?</a>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-accent to-accent-violet py-4 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(108,99,255,0.4)] transition-all active:scale-[0.98] flex items-center justify-center space-x-2 group disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Access Secure Dashboard'}</span>
                {!isSubmitting && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-secondary text-sm">
                Don't have an account? 
                <button onClick={() => router.push('/signup')} className="text-accent font-bold ml-2 hover:underline">Sign up for Guard</button>
              </p>
            </div>
          </GlassCard>

          <p className="text-center text-secondary text-[10px] mt-8 uppercase tracking-[0.2em] opacity-50">
            Powered by Continuous Biometric Deep Learning
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
