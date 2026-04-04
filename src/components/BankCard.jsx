"use client";
import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Wifi, CreditCard as CreditCardIcon, Landmark, Zap, ShieldCheck } from 'lucide-react';

const BankCard = ({ user, balance, className = '' }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const name = user?.name || 'Authorized Holder';
  const accountNo = (user?._id || user?.id || '0000000000000000').slice(-16).replace(/(\d{4})/g, '$1 ').trim();
  const balanceStr = Number(balance || 0).toLocaleString('en-IN');

  // 3D Hover physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (isFlipped) return;
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left / rect.width - 0.5);
    y.set(e.clientY - rect.top / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  // Theme hashing
  const getCardTheme = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const h = Math.abs(hash) % 360;
    return `hsla(${h}, 70%, 40%, 1)`;
  };
  const theme = getCardTheme(name);

  return (
    <div className={`perspective-1000 w-full max-w-[420px] ${className}`} onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        className="relative w-full h-[260px] cursor-pointer"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 120, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* FRONT SIDE */}
        <div
          className="absolute inset-0 rounded-[32px] overflow-hidden shadow-2xl bg-[#0A0B1E] border border-white/20"
          style={{ backfaceVisibility: 'hidden', transformStyle: 'preserve-3d' }}
        >
          {/* Card Dynamic Gradient Background */}
          <div className="absolute inset-0 opacity-40 blur-[100px] pointer-events-none" style={{ backgroundColor: theme }} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

          {/* Content */}
          <div className="relative h-full p-8 flex flex-col justify-between text-white z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-wider font-sora">BEHAVEGUARD BANK</h3>
                <div className="flex items-center gap-2 text-[10px] font-black opacity-40 uppercase tracking-widest">
                  <Wifi className="w-3 h-3" />
                  <span>Contactless Biometrics</span>
                </div>
              </div>
              <Landmark className="w-6 h-6 opacity-40 text-white" />
            </div>

            {/* Chip */}
            <div className="absolute top-24 left-8">
              <div className="w-14 h-11 rounded-lg bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner p-1 grid grid-cols-3 grid-rows-3 gap-[1px] border border-yellow-800/20">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-yellow-500/30 rounded-sm" />
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-6">
              <div className="font-mono text-xl tracking-[0.25em] font-semibold text-white/90 drop-shadow-lg">
                {accountNo}
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="text-[8px] uppercase tracking-[0.3em] opacity-30 font-black"></div>
                  <div className="text-sm font-bold tracking-wider uppercase font-sora text-white/80">{name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] uppercase tracking-[0.3em] opacity-30 font-black">Vault Status</div>
                  <div className="text-base font-bold text-trust-safe font-sora">₹{balanceStr}</div>
                </div>
              </div>
            </div>

            {/* Holographic Seal Placeholder */}
            <div className="absolute bottom-8 right-8">
              <div className="flex -space-x-3 opacity-30">
                <div className="w-8 h-8 rounded-full bg-white/20" />
                <div className="w-8 h-8 rounded-full bg-white/40" />
              </div>
            </div>
          </div>
        </div>

        {/* BACK SIDE */}
        <div
          className="absolute inset-0 rounded-[32px] overflow-hidden shadow-2xl bg-[#08091A] border border-white/10"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="relative h-full flex flex-col pt-8">
            {/* Magnetic Stripe */}
            <div className="w-full h-12 bg-black/90 mb-8" />

            <div className="px-8 space-y-6">
              {/* CVV Box */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-10 bg-white/5 rounded flex items-center px-4 overflow-hidden">
                  <svg width="100" height="20" className="opacity-20">
                    <path d="M 0 10 Q 10 0, 20 10 T 40 10 T 60 10 T 80 10" stroke="white" fill="none" strokeWidth="2" />
                  </svg>
                </div>
                <div className="bg-white text-gray-900 px-4 py-1.5 rounded-md font-mono font-black tracking-widest text-sm">
                  {(user?._id || '000').slice(-3)}
                </div>
              </div>

              {/* Security Text */}
              <div className="space-y-2 text-[8px] text-white/30 leading-relaxed font-medium">
                <p>This biometric node remains property of BehaveGuard Secure Banking. Identity validation is continuous via ML interaction DNA.</p>
                <p className="font-mono text-white/20">Biometric Support: 1-800-BEHAVE-GUARD</p>
              </div>

              {/* Chip-Back Hologram */}
              <div className="absolute bottom-8 right-8">
                <div className="w-16 h-16 rounded-full border-2 border-white/10 bg-white/5 flex items-center justify-center backdrop-blur-md">
                  <ShieldCheck className="text-accent opacity-60" size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="text-center mt-6">
        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] animate-pulse">Click card to decrypt back-panel</p>
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};

export default BankCard;
