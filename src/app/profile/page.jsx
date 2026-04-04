"use client";
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
   Shield, Check, Fingerprint, Activity, MousePointer2,
   Smartphone, Eye, Download, Trash2, ArrowUpRight, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { dummyBehaviourProfile } from '../../data/dummy';
import { GlassCard, NavBar, TrustBadge, MiniSparkline } from '../../components/Shared';
import { GlobalSpotlight } from '../../components/MagicSpotlight';
import {
   Chart as ChartJS,
   RadialLinearScale,
   PointElement,
   LineElement,
   Filler,
   Tooltip,
   Legend,
} from 'chart.js';

ChartJS.register(
   RadialLinearScale,
   PointElement,
   LineElement,
   Filler,
   Tooltip,
   Legend
);

const ProfilePage = () => {
   const { trustScore } = useAuth();
   const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
   const gridRef = useRef(null);

   const downloadPDF = async () => {
      const element = gridRef.current;
      if (!element) return;
      try {
         const canvas = await html2canvas(element, { backgroundColor: '#070814', scale: 2 });
         const pdf = new jsPDF('p', 'mm', 'a4');
         pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
         pdf.save(`BehaveGuard_Profile_Report.pdf`);
      } catch (err) { console.error('PDF Fail', err); }
   };

   const radarData = {
      labels: ['Typing Speed', 'Key Hold Time', 'Flight Time', 'Swipe Velocity', 'Tap Pressure', 'Nav Flow'],
      datasets: [
         {
            label: 'Your Pattern',
            data: dummyBehaviourProfile.user,
            backgroundColor: 'rgba(67, 11, 184, 0.3)',
            borderColor: '#430BB8',
            borderWidth: 2,
            pointBackgroundColor: '#430BB8',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#430BB8'
         },
         {
            label: 'Typical User',
            data: dummyBehaviourProfile.baseline,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            pointRadius: 0,
         }
      ]
   };

   const radarOptions = {
      scales: {
         r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { display: false },
            pointLabels: { color: '#8B8DB8', font: { size: 10, weight: 'bold' } }
         }
      },
      plugins: {
         legend: { display: false }
      }
   };

   return (
      <div className="min-h-screen bg-bg-deep text-white relative">
         <div className="bg-mesh">
            <div className="orb-1"></div>
            <div className="orb-2"></div>
            <div className="orb-3"></div>
         </div>

         <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

         <main ref={gridRef} className={clsx(
            "transition-all duration-300 p-8 pt-6 min-h-screen bento-section",
            isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
         )}>
            <GlobalSpotlight gridRef={gridRef} />
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
               <div>
                  <h1 className="font-sora font-extrabold text-3xl md:text-4xl leading-tight">Your Fingerprint</h1>
                  <p className="text-secondary mt-1">Real-time analysis of your unique identity markers</p>
               </div>
               <TrustBadge score={trustScore} />
            </header>

            {/* Section 1: Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
               <GlassCard className="lg:col-span-1 p-8 flex flex-col items-center magic-bento-card magic-bento-card--border-glow">
                  <h3 className="font-sora font-bold text-xl mb-8 w-full">Biometric Radar</h3>
                  <div className="w-full aspect-square max-w-[300px]">
                     <Radar data={radarData} options={radarOptions} />
                  </div>
                  <div className="mt-8 flex items-center space-x-6 text-xs font-bold uppercase tracking-widest bg-white/5 py-4 px-6 rounded-2xl border border-white/5 w-full justify-between">
                     <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#430BB8]"></div>
                        <span className="text-white">Your Pattern</span>
                     </div>
                     <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        <span className="text-secondary">Typical User</span>
                     </div>
                  </div>
               </GlassCard>

               <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dummyBehaviourProfile.metrics.map((m, idx) => (
                     <GlassCard key={idx} className="p-6 border-white/5 hover:bg-white/[0.05] transition-all group overflow-hidden magic-bento-card magic-bento-card--border-glow">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-[#430BB8]/10 border border-[#430BB8]/20 flex items-center justify-center text-[#430BB8]">
                                 {idx === 0 && <Zap size={18} />}
                                 {idx === 1 && <Activity size={18} />}
                                 {idx === 2 && <MousePointer2 size={18} />}
                                 {idx === 3 && <Smartphone size={18} />}
                                 {idx === 4 && <Fingerprint size={18} />}
                                 {idx === 5 && <Eye size={18} />}
                              </div>
                              <div>
                                 <p className="font-bold text-sm leading-tight">{m.name}</p>
                                 <span className="text-[10px] font-bold text-trust-safe uppercase tracking-widest">{m.status}</span>
                              </div>
                           </div>
                           <MiniSparkline data={m.trend} color={idx % 2 === 0 ? "#430BB8" : "#06B6D4"} />
                        </div>
                        <div className="flex items-end justify-between">
                           <div>
                              <p className="text-xs text-secondary mb-1">Baseline Value</p>
                              <p className="text-xl font-sora font-bold">{m.value}</p>
                           </div>
                           <div className="flex items-center text-[10px] font-bold text-trust-safe bg-trust-safe/10 px-2 py-1 rounded">
                              <Check size={12} className="mr-1" />
                              <span>Normal Range</span>
                           </div>
                        </div>
                        {/* Background decoration */}
                        <div className="absolute right-0 bottom-0 opacity-[0.03] transform translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform">
                           {React.createElement(idx === 0 ? Zap : (idx === 1 ? Activity : MousePointer2), { size: 100 })}
                        </div>
                     </GlassCard>
                  ))}
               </div>
            </div>

            {/* Section 2: Enrolment Timeline */}
            <GlassCard className="p-8 mb-10 border-white/5 magic-bento-card magic-bento-card--border-glow">
               <h3 className="font-sora font-bold text-xl mb-12">Model Enrolment Status</h3>
               <div className="relative px-10">
                  <div className="absolute top-1/2 left-10 right-10 h-1 bg-white/10 -translate-y-1/2">
                     <div className="h-full bg-[#430BB8] w-[75%]"></div>
                  </div>
                  <div className="relative flex justify-between">
                     {[
                        { label: 'First Login', date: 'Apr 02', status: 'completed' },
                        { label: 'Observation (40/40)', date: 'Apr 03', status: 'completed' },
                        { label: 'Model Trained', date: 'Apr 04', status: 'completed' },
                        { label: 'Active Protection', date: 'Present', status: 'current' }
                     ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center">
                           <div className={clsx(
                              "w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all font-bold",
                              step.status === 'completed' ? "bg-[#121212] border-2 border-[#430BB8] text-white" : "bg-bg-card border-4 border-[#430BB8] text-[#430BB8] shadow-[0_0_20px_rgba(67,11,184,0.4)]"
                           )}>
                              {step.status === 'completed' ? <Check size={20} /> : <Activity size={20} />}
                           </div>
                           <p className="font-bold text-xs mt-4 uppercase tracking-widest">{step.label}</p>
                           <p className="text-[10px] text-secondary mt-1">{step.date}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="mt-12 flex items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 rounded-full bg-trust-watch/10 flex items-center justify-center text-trust-watch animate-pulse">
                        <Activity size={18} />
                     </div>
                     <p className="text-sm font-medium text-secondary italic">Your behaviour model is continuously learning. Accuracy increased by 0.4% this session.</p>
                  </div>
                  <button
                     onClick={async () => {
                        if (confirm('Recalibrate baseline?')) {
                           await axios.post('http://localhost:5000/api/behavioral/reset-baseline', {}, { withCredentials: true });
                           window.location.reload();
                        }
                     }}
                     className="px-6 py-2 rounded-xl border border-trust-danger/30 text-trust-danger text-xs font-bold uppercase tracking-widest hover:bg-trust-danger/10 transition-all text-[#121212] bg-[#121212]/0"
                  >
                     Reset Profile Baseline
                  </button>
               </div>
            </GlassCard>

            {/* Section 3: Data Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <GlassCard className="p-8 border-white/5 magic-bento-card magic-bento-card--border-glow">
                  <h3 className="font-sora font-bold text-xl mb-8">Data Collection Controls</h3>
                  <div className="space-y-6">
                     {[
                        { name: 'Keystroke Dynamics', desc: 'Timing of key press and release', active: true },
                        { name: 'Navigation Rhythm', desc: 'Sequence and timing of page interaction', active: true },
                        { name: 'Swipe Gestures', desc: 'Velocity and pressure of touch inputs', active: true },
                        { name: 'Device Telemetry', desc: 'Orientation and motion sensor data', active: false },
                     ].map((opt, i) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div>
                              <p className="font-bold text-sm tracking-tight">{opt.name}</p>
                              <p className="text-xs text-secondary mt-0.5">{opt.desc}</p>
                           </div>
                           <div className={clsx(
                              "w-12 h-6 rounded-full relative transition-all cursor-pointer",
                              opt.active ? "bg-[#121212] border-2 border-[#430BB8]" : "bg-white/10"
                           )}>
                              <div className={clsx(
                                 "absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all shadow-md",
                                 opt.active ? "right-[2px]" : "left-[2px]"
                              )}></div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <p className="text-[10px] text-secondary mt-8 leading-relaxed opacity-60">
                     BehaveGuard complies with GDPR & Indian DPDP Act. Your behavioural data is hashed locally and never stored as raw events on our servers.
                  </p>
               </GlassCard>

               <GlassCard className="p-8 border-white/5 flex flex-col justify-between magic-bento-card magic-bento-card--border-glow">
                  <div>
                     <h3 className="font-sora font-bold text-xl mb-4">Export & Portability</h3>
                     <p className="text-sm text-secondary leading-relaxed mb-8">
                        Download a copy of your behavioural profile in JSON format. This data can be migrated to other Guard-compatible platforms.
                     </p>
                     <button
                        onClick={downloadPDF}
                        className="w-full flex items-center justify-center space-x-3 bg-[#121212] border-2 border-[#430BB8] py-4 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(67,11,184,0.2)] transition-all mb-4"
                     >
                        <Download size={18} />
                        <span>Download Security Passport (PDF)</span>
                     </button>
                  </div>
                  <div className="pt-8 border-t border-white/5">
                     <button
                        onClick={async () => {
                           if (confirm('Delete Behavioral Profile permanently?')) {
                              await axios.delete('http://localhost:5000/api/behavioral/delete-profile', { withCredentials: true });
                              window.location.href = '/login';
                           }
                        }}
                        className="w-full flex items-center justify-center space-x-3 text-trust-danger bg-[#121212] border-2 border-trust-danger/40 py-4 rounded-xl font-bold hover:bg-trust-danger/5 transition-all"
                     >
                        <Trash2 size={18} />
                        <span>Delete Behavioural Profile</span>
                     </button>
                     <p className="text-center text-[10px] text-secondary mt-4 font-bold uppercase tracking-widest">Action is Permanent</p>
                  </div>
               </GlassCard>
            </div>
         </main>
      </div>
   );
};

export default ProfilePage;
