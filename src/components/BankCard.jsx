import React from 'react';
import { motion } from 'framer-motion';

const BankCard = ({ variant = 'visa', cardData, className }) => {
  const { name, accountNo, expiry = "12/28" } = cardData || { name: 'RAHUL MEHTA', accountNo: '•••• •••• •••• 4829' };

  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotate3d: [1, 0.5, 0, 5], transition: { duration: 0.3 } }}
      className={`bank-card relative flex flex-col p-6 text-white justify-between ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(108,99,255,0.4), rgba(6,182,212,0.2))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div className="card-shimmer"></div>
      
      <div className="flex justify-between items-start">
        <div className="w-10 h-8 bg-yellow-400/80 rounded-md flex flex-col justify-around py-1.5 px-0.5 border border-yellow-500 overflow-hidden">
          <div className="h-0.5 bg-black/20 w-full"></div>
          <div className="h-0.5 bg-black/20 w-full"></div>
          <div className="h-0.5 bg-black/20 w-full"></div>
        </div>
        <div>
          {variant === 'visa' ? (
            <span className="text-2xl font-serif italic font-bold">VISA</span>
          ) : (
            <div className="flex -space-x-4">
              <div className="w-8 h-8 rounded-full bg-red-500/80"></div>
              <div className="w-8 h-8 rounded-full bg-orange-500/80"></div>
            </div>
          )}
        </div>
      </div>

      <div className="my-8">
        <p className="font-mono text-xl tracking-[0.2em]">{accountNo && accountNo.includes('•') ? accountNo : (accountNo ? accountNo.replace(/(\d{4})/g, '$1 ') : '•••• •••• •••• 0000')}</p>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] text-white/60 mb-1 uppercase tracking-wider">Card Holder</p>
          <p className="font-medium tracking-wide uppercase">{name}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/60 mb-1 uppercase tracking-wider">Expiry</p>
          <p className="font-medium tracking-wide">{expiry}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BankCard;
