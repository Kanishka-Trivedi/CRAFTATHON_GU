import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const BankCard = ({ variant = 'visa', cardData, className = '' }) => {
  const { name, accountNo, expiry = "12/28" } = cardData || { name: 'RAHUL MEHTA', accountNo: '•••• •••• •••• 4829' };

  // 3D Hover Effect setup
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      style={{ perspective: 1000 }}
      className={`relative w-[340px] h-[215px] ${className}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ 
        y: [0, -8, 0], 
        opacity: 1, 
        transition: { y: { repeat: Infinity, duration: 4, ease: "easeInOut" }, opacity: { duration: 0.5 } } 
      }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full rounded-2xl relative cursor-pointer"
      >
        {/* Card Body - Graphite Metallic Gradient */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6 flex flex-col justify-between"
             style={{
               boxShadow: '0 30px 60px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)'
             }}>
          
          {/* Holographic Gloss Overlay moving with mouse */}
          <motion.div 
            className="absolute inset-0 z-0 opacity-40 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 55%, transparent 100%)',
              x: useTransform(mouseXSpring, [-0.5, 0.5], ["-30%", "30%"]),
              y: useTransform(mouseYSpring, [-0.5, 0.5], ["-30%", "30%"]),
              scale: 2
            }}
          />

          {/* Decorative mesh/pattern to look like a premium card */}
          <div className="absolute inset-x-0 bottom-0 top-1/3 opacity-20 pointer-events-none z-0"
               style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
          </div>

          <div className="relative z-10 flex justify-between items-start">
            {/* Playful realistic chip */}
            <div className="w-11 h-8 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 rounded-md flex flex-col justify-evenly px-1 border border-yellow-700/50 shadow-inner overflow-hidden relative">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-yellow-700/50"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-yellow-700/50"></div>
              <div className="w-full h-[1px] bg-yellow-700/30"></div>
              <div className="w-full h-[1px] bg-yellow-700/30"></div>
              <div className="w-full h-[1px] bg-yellow-700/30"></div>
            </div>
            
            {/* Floating contactless icon and Logo */}
            <div className="flex flex-col items-end gap-1 opacity-80">
              {variant === 'visa' ? (
                <span className="text-3xl font-serif italic font-extrabold text-white tracking-tight drop-shadow-md">VISA</span>
              ) : (
                <div className="flex -space-x-3.5 drop-shadow-md">
                  <div className="w-9 h-9 rounded-full bg-red-500 mix-blend-screen opacity-90"></div>
                  <div className="w-9 h-9 rounded-full bg-orange-500 mix-blend-screen opacity-90"></div>
                </div>
              )}
              {/* Fake contactless lines */}
              <div className="flex space-x-1 rotate-90 mt-2 opacity-50">
                <span className="w-1 h-1 bg-white rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-transparent border-[1.5px] border-white rounded-full border-l-transparent border-b-transparent -ml-1"></span>
                <span className="w-2.5 h-2.5 bg-transparent border-[1.5px] border-white rounded-full border-l-transparent border-b-transparent -ml-1.5"></span>
                <span className="w-3.5 h-3.5 bg-transparent border-[1.5px] border-white rounded-full border-l-transparent border-b-transparent -ml-2"></span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 mb-2">
            <p className="font-mono text-[22px] tracking-[0.14em] text-white drop-shadow-sm font-semibold"
               style={{ textShadow: '0px 2px 2px rgba(0,0,0,0.8)' }}>
              {accountNo && accountNo.includes('•') ? accountNo : (accountNo ? accountNo.replace(/(\d{4})/g, '$1 ') : '•••• •••• •••• 0000')}
            </p>
          </div>

          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-[9px] text-white/50 mb-0.5 uppercase tracking-widest font-semibold">Card Holder</p>
              <p className="font-medium tracking-widest uppercase text-sm text-white/95 truncate max-w-[160px]">{name}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-white/50 mb-0.5 uppercase tracking-widest font-semibold">Valid Thru</p>
              <p className="font-mono font-medium tracking-wide text-sm text-white/95">{expiry}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BankCard;
