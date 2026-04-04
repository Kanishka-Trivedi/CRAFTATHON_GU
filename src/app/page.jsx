"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, Fingerprint, ScanEye, Activity, Lock,
  Brain, Zap, Rocket, ShieldCheck, Sparkles,
  Keyboard, Eye, RefreshCw, ChevronRight, ArrowRight,
  ShieldAlert, Cpu, BadgeCheck, BatteryCharging,
  X, Info, Target, MousePointer2, CheckCircle2,
  Github, Twitter, Linkedin
} from 'lucide-react';
import logo from '../assets/logo.png';
import Image from 'next/image';

import { AnimatePresence } from 'framer-motion';
import DarkVeil from '../components/DarkVeil';
import BlurText from '../components/BlurText';
import AuthButton from '../components/AuthButton';
import ProtectionBtn from '../components/ProtectionBtn';
import LiveTypingDemo from '../components/LiveTypingDemo';


const Logo = ({ size = "md" }) => {
  const isLarge = size === "lg";
  return (
    <div className="flex items-center space-x-4 group cursor-pointer">
      <div className={`relative ${isLarge ? 'w-12 h-12' : 'w-10 h-10'} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
        <Image
          src={logo}
          alt="BehaveGuard Logo"
          width={isLarge ? 48 : 40}
          height={isLarge ? 48 : 40}
          className="object-contain"
        />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <span className={`font-sora font-bold ${isLarge ? 'text-2xl' : 'text-xl'} tracking-tighter leading-none text-white transition-all group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60`}>BehaveGuard</span>
        </div>
        <span className={`font-mono ${isLarge ? 'text-[10px]' : 'text-[9px]'} uppercase tracking-[0.25em] text-white/70 leading-none mt-2`}>Continuous Intelligence</span>
      </div>
    </div>
  );
};

const HowItWorksModal = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-navy-950/80 backdrop-blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-navy-900 border border-white/[0.1] rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald via-electric to-rose" />
          <div className="p-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-sora font-bold text-2xl text-white mb-2">How BehaveGuard Detects Threats</h3>
                <p className="text-white/80 font-dm text-sm">Our 3-layer security logic differentiates you from intruders.</p>

              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} className="text-white" />
              </button>

            </div>

            <div className="space-y-6">
              {[
                { title: 'Pattern Deviations', desc: 'Analyzes typing cadence down to millisecond precision. If keys are held 12ms longer than your baseline, we flag it.', icon: Keyboard, color: '#00E5A0' },
                { title: 'Navigation Habits', desc: 'Detects unusual mouse acceleration or robotic click paths that suggest scripts or unfamiliar users.', icon: MousePointer2, color: '#4F6EF7' },
                { title: 'Real-Time Intervention', desc: 'If the risk score exceeds 0.85, the session freezes instantly, requiring a biometric re-scan or OTP.', icon: ShieldAlert, color: '#FF4D6D' },
              ].map((step, i) => (
                <div key={i} className="flex gap-5 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: step.color + '20', border: `1px solid ${step.color}40` }}>
                    <step.icon size={22} style={{ color: step.color }} />
                  </div>
                  <div>
                    <h4 className="font-sora font-semibold text-white mb-1">{step.title}</h4>
                    <p className="font-dm text-sm text-white/80 leading-relaxed">{step.desc}</p>
                  </div>

                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-electric to-electric-dim text-white font-dm font-bold text-sm"
            >
              Understand & Secure Account
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ─── Floating Particles ─────────────────────────────────────── */
const ParticleField = () => {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        duration: Math.random() * 25 + 15,
        delay: Math.random() * 8,
        opacity: Math.random() * 0.2 + 0.03,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: ['#4F6EF7', '#00D4E8', '#00E5A0', '#FF4D6D', '#8B5CF6'][p.id % 5],
            opacity: p.opacity,
          }}
          animate={{ y: [0, -40, 0], x: [0, p.id % 2 === 0 ? 20 : -20, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

/* ─── Animated Trust Score Panel ──────────────────────────────── */
const TrustScorePanel = () => {
  const [score, setScore] = useState(98.5);
  const [time, setTime] = useState(3);

  useEffect(() => {
    const i = setInterval(() => {
      setScore(prev => {
        const drift = (Math.random() - 0.3) * 0.4;
        return Math.min(99.9, Math.max(95, parseFloat((prev + drift).toFixed(1))));
      });
      setTime(prev => prev + 1);
    }, 3000);
    return () => clearInterval(i);
  }, []);

  const bars = [
    { label: 'Typing Pattern Match', value: 99, color: '#00E5A0' },
    { label: 'Touch Dynamics', value: 98, color: '#8B5CF6' },
    { label: 'Navigation Behavior', value: 97, color: '#F5A623' },
    { label: 'Device Trust Level', value: 100, color: '#00D4E8' },
  ];

  return (
    <div className="p-6 rounded-2xl border border-white/[0.08] bg-navy-900/80 backdrop-blur-md">
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">Trust Score</span>
        <ShieldCheck size={28} className="text-emerald" />
      </div>

      <motion.p
        key={score}
        initial={{ opacity: 0.5, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-sora font-bold text-5xl text-emerald mb-6"
      >
        {score}
      </motion.p>
      <div className="space-y-4">
        {bars.map((bar, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1.5">
              <span className="font-dm text-xs text-white font-medium">{bar.label}</span>
              <span className="font-mono text-xs" style={{ color: bar.color }}>{bar.value}%</span>
            </div>

            <div className="h-[6px] rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${bar.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: i * 0.15 }}
                className="h-full rounded-full"
                style={{ background: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
        <span className="font-mono text-[10px] text-white/60">Verified <span className="text-emerald">{time} seconds ago</span></span>
      </div>

    </div>
  );
};

/* ─── Feature Gradient Card ───────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay }}
    className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-all duration-500"
  >
    <div className="h-14 rounded-xl mb-5 flex items-center pl-4 overflow-hidden" style={{ background: gradient }}>
      <Icon size={22} className="text-white" />
    </div>
    <h3 className="font-sora font-semibold text-base text-white mb-2">{title}</h3>
    <p className="text-white/80 text-sm leading-relaxed font-dm">{description}</p>

  </motion.div>
);

/* ═══════════════════════════════════════════════════════════════ */
/*                     LANDING PAGE                                */
/* ═══════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen text-white overflow-x-hidden relative">
      <div style={{ width: '100%', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 0 }}>
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
        />

      </div>

      <div className="relative z-10 w-full h-full">





        <HowItWorksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        {/* ─── NAVBAR (Larger & Centered) ───────────────────── */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 px-8 py-3"
          style={{
            background: scrollY > 50 ? 'rgba(2, 6, 23, 0.5)' : 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: scrollY > 50 ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(255, 255, 255, 0.03)',
            boxShadow: scrollY > 50 ? '0 8px 32px rgba(0, 0, 0, 0.3)' : 'none',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Logo size="lg" />

            <div className="hidden lg:flex items-center space-x-12 font-dm text-base text-white/80 font-medium tracking-wide">

              <a href="#features" className="hover:text-white transition-all relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white/50 transition-all group-hover:w-full" />
              </a>
              <a href="#security" className="hover:text-white transition-all relative group">
                Security
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white/50 transition-all group-hover:w-full" />
              </a>
              <a href="#cta" className="hover:text-white transition-all relative group">
                Enterprise
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-white/50 transition-all group-hover:w-full" />
              </a>

            </div>

            <div className="flex items-center gap-5">
              <AuthButton text="Log In" onClick={() => router.push('/login')} />
              <AuthButton text="Sign Up" onClick={() => router.push('/signup')} colorHex="#430BB8" colorRgb="67, 11, 184" />
            </div>
          </div>
        </motion.nav>

        {/* ─── HERO (Full-width centered) ──────────────────── */}
        <section className="relative min-h-[calc(100vh-100px)] flex items-center justify-center px-6 pt-12 pb-8">
          <div className="max-w-6xl mx-auto w-full z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center text-center"
            >



              <div className="flex flex-col items-center gap-1 mt-36 mb-5 max-w-4xl">
                <BlurText
                  text="Security that"
                  className="font-heading font-black text-6xl md:text-[100px] leading-[0.95] tracking-tight text-white text-center"
                  delay={110}
                  animateBy="words"
                  direction="top"
                />
                <BlurText
                  text="reads you."
                  className="font-heading font-black text-6xl md:text-[100px] leading-[0.95] tracking-tight text-white text-center"
                  delay={110}
                  animateBy="words"
                  direction="bottom"
                />
              </div>


              <p className="text-lg md:text-xl text-white/80 font-dm leading-[1.6] max-w-3xl mb-8">
                Revolutionary behavioral biometrics that continuously authenticate you through{' '}
                <span className="text-white font-semibold">typing patterns</span>,{' '}
                <span className="text-white font-semibold">touch dynamics</span>, and{' '}
                <span className="text-white font-semibold">navigation habits</span>.
              </p>


              {/* Stat Cards - wider */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="px-8 py-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                  <p className="font-sora font-bold text-4xl text-emerald">99.9%</p>
                  <p className="font-dm text-sm text-white/70 mt-1">Accuracy</p>
                </div>

                <div className="px-8 py-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                  <p className="font-sora font-bold text-4xl text-white/90">&lt;10ms</p>
                  <p className="font-dm text-sm text-white/70 mt-1">Response</p>
                </div>


                <div className="px-8 py-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                  <p className="font-sora font-bold text-4xl text-white/90">Zero</p>
                  <p className="font-dm text-sm text-white/70 mt-1">Friction</p>
                </div>


              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <ProtectionBtn onClick={() => router.push('/signup')} text="Start My Protection" />
              </div>
            </motion.div>
          </div>
        </section>

        <LiveTypingDemo />

        {/* ─── PRIVACY & SECURITY ─────────────────────────────── */}
        <section id="security" className="relative py-28 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Text */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-sora font-bold text-3xl md:text-4xl mb-4 leading-tight">
                Privacy-First, <span className="text-white">Security-Always</span>
              </h2>

              <p className="text-white/80 font-dm text-base leading-relaxed mb-8 max-w-lg">
                Your behavioral patterns are processed <span className="text-white font-semibold">on-device</span> using advanced ML models. Zero data leaves your phone, maximum security stays with you.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Lock, text: 'AES 256-bit end-to-end encryption', color: '#4F6EF7' },
                  { icon: Cpu, text: 'On-device machine learning processing', color: '#00D4E8' },
                  { icon: BadgeCheck, text: 'GDPR, SOC 2, PCI DSS compliant', color: '#00E5A0' },
                  { icon: ShieldAlert, text: 'Zero-knowledge security architecture', color: '#8B5CF6' },
                  { icon: BatteryCharging, text: 'Optimized battery consumption', color: '#F5A623' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <item.icon size={18} className="text-white/80" />
                    <span className="font-dm text-sm text-white font-medium">{item.text}</span>
                  </motion.div>


                ))}
              </div>
            </motion.div>

            {/* Right Trust Score Panel */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <TrustScorePanel />
            </motion.div>
          </div>
        </section>

        {/* ─── CTA SECTION ────────────────────────────────────── */}
        <section id="cta" className="relative py-28 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative rounded-3xl p-12 md:p-16 text-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1B3678 0%, #2B47D4 30%, #8B5CF6 60%, #FF4D6D 100%)' }}
            >
              {/* Glow overlay */}
              <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(0,212,232,0.4), transparent 60%)' }} />

              <div className="relative z-10">


                <h2 className="font-sora font-bold text-3xl md:text-5xl text-white mb-4 leading-tight">
                  Ready for Invisible
                  <br />Security?
                </h2>

                <p className="font-dm text-white/80 text-base max-w-lg mx-auto mb-10 leading-relaxed">
                  Experience the future of banking authentication. Zero friction, maximum protection.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/signup')}
                    className="px-10 py-5 rounded-2xl bg-white text-navy-950 font-dm font-bold text-base flex items-center gap-3 shadow-xl"
                  >
                    <Rocket size={18} />
                    Start My Protection
                  </motion.button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-10 py-5 rounded-2xl border-2 border-white/[0.3] bg-white/[0.08] text-white font-dm font-bold text-base hover:bg-white/[0.15] transition-all backdrop-blur-md flex items-center gap-3"
                  >
                    <Target size={18} />
                    How It Works
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── FOOTER ─────────────────────────────────────────── */}
        <footer className="relative mt-20 pt-24 pb-16 px-8 border-t border-white/[0.08] bg-black/40 backdrop-blur-3xl">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-16 mb-20">
              {/* Brand column */}
              <div className="lg:col-span-2 space-y-8">
                <Logo size="md" />
                <p className="text-white/60 font-dm text-base leading-relaxed max-w-sm">
                  Revolutionizing digital trust through continuous behavioral intelligence. Zero friction, total security.
                </p>
                <div className="flex items-center gap-6">
                  <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all">
                    <Github size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all">
                    <Twitter size={18} />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all">
                    <Linkedin size={18} />
                  </a>
                </div>

              </div>

              {/* Links columns */}
              {[
                { title: 'Platform', links: ['Behavioral Auth', 'Threat Matrix', 'Risk Engine', 'Compliance'] },
                { title: 'Resources', links: ['Documentation', 'API Reference', 'Case Studies', 'Security White-paper'] },
                { title: 'Company', links: ['Mission', 'Privacy', 'Status', 'Contact'] },
                { title: 'Legal', links: ['Privacy Policy', 'Data DPA', 'Security Terms', 'Cookie Policy'] },
              ].map((col, i) => (
                <div key={i} className="space-y-6">
                  <h4 className="font-sora font-semibold text-sm text-white tracking-wider uppercase opacity-90">{col.title}</h4>
                  <ul className="space-y-4">
                    {col.links.map((link, j) => (
                      <li key={j}>
                        <span className="font-dm text-sm text-white/40 hover:text-white transition-all cursor-pointer flex items-center group">
                          <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all mr-2" />
                          {link}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <p className="font-dm text-sm text-white/30">
                  © 2026 BehaveGuard. All rights reserved.
                </p>
                <div className="flex items-center gap-6">
                  <span className="font-dm text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer">Status</span>
                  <span className="font-dm text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer">Security</span>
                  <span className="font-dm text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer">Uptime</span>
                </div>
              </div>

              <div className="flex items-center gap-6 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-widest text-emerald font-bold">Systems Operational</span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <span className="font-mono text-[9px] text-white/30 font-bold tracking-widest">v1.4.2</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default LandingPage;
