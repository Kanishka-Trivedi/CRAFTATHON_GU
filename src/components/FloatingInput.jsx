'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FloatingInput = ({
    id,
    label,
    type = 'text',
    value,
    onChange,
    icon: Icon,
    required = false,
    autoComplete,
    disabled = false,
    className = ''
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.length > 0;

    return (
        <div className={`relative group ${className}`}>
            {/* Input Background (Glass Effect) */}
            <div className={`absolute inset-0 rounded-2xl transition-all duration-500 border ${
                isFocused 
                ? 'bg-white/[0.06] border-accent shadow-[0_0_20px_rgba(99,102,241,0.15)]' 
                : 'bg-white/[0.03] border-white/[0.08] group-hover:border-white/20'
            }`} />

            {/* Icon Wrapper */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center transition-colors duration-300">
                {Icon && (
                    <Icon 
                        size={18} 
                        className={`transition-colors duration-300 ${
                            isFocused ? 'text-accent' : hasValue ? 'text-white/60' : 'text-white/20 group-hover:text-white/40'
                        }`} 
                    />
                )}
            </div>

            {/* Floating Label */}
            <label
                htmlFor={id}
                className={`absolute left-[52px] z-20 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isFocused || hasValue
                        ? 'top-4 text-[10px] font-black uppercase tracking-[0.2em] text-accent translate-y-[-4px]'
                        : 'top-1/2 -translate-y-1/2 text-sm font-medium text-white/20 group-hover:text-white/40'
                }`}
            >
                {label}
            </label>

            {/* Native Input */}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                required={required}
                autoComplete={autoComplete}
                disabled={disabled}
                className={`w-full h-[72px] bg-transparent border-none rounded-2xl pl-[52px] pr-5 pt-7 pb-2 text-indigo-100/90 text-base font-medium focus:outline-none focus:ring-0 z-10 relative selection:bg-indigo-500/40`}
            />

            {/* Error/Valid Subtle Indicator */}
            {required && !hasValue && !isFocused && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2 z-20 w-1.5 h-1.5 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 transition-all duration-300" />
            )}
        </div>
    );
};

export default FloatingInput;
