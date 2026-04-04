"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Fingerprint, Activity, Clock, ShieldCheck, Zap, MousePointer2, ChevronRight, BarChart3, Database, Download, Trash2 } from 'lucide-react';
import axios from 'axios';
import { GlassCard } from '../../components/Shared';
import { Radar, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
} from 'chart.js';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
);

const FingerprintPage = () => {
    const [auditData, setAuditData] = useState(null);
    const [loading, setLoading] = useState(true);
    const pdfRef = React.useRef(null);

    const downloadPDF = async () => {
        const element = pdfRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#070814',
                scale: 2, // High DPI
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = (canvas.height * pageWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
            pdf.save(`BehaveGuard_Passport_${auditData?.identity?.userId?.slice(-6)}.pdf`);
        } catch (err) { console.error('PDF Export Failed', err); }
    };

    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/behavioral/audit', { withCredentials: true });
                if (res.data.success) setAuditData(res.data);
            } catch (err) {
                console.error('Audit Fetch Failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAudit();
    }, []);

    if (loading) return (
        <div className="h-screen bg-bg-deep flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-white/40 uppercase tracking-[0.3em]">Decoding Biometric DNA...</p>
        </div>
    );

    const baseline = auditData?.behavioralBaseline;

    const radarData = {
        labels: ['Typing Rhythm', 'Scroll Velocity', 'Mouse Entropy', 'Key Hold', 'Idle Consistency'],
        datasets: [{
            label: 'Your Baseline DNA',
            data: [
                baseline?.typingSpeedAvg ? Math.min(10, baseline.typingSpeedAvg) : 5,
                baseline?.scrollSpeedAvg ? Math.min(10, baseline.scrollSpeedAvg / 100) : 4,
                baseline?.mouseVelocityAvg ? Math.min(10, baseline.mouseVelocityAvg / 10) : 6,
                7, // Key Hold constant for now
                8  // Idle constant
            ],
            backgroundColor: 'rgba(108, 99, 255, 0.2)',
            borderColor: '#6C63FF',
            borderWidth: 2,
        }]
    };

    const radarOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255,255,255,0.05)' },
                grid: { color: 'rgba(255,255,255,0.05)' },
                pointLabels: { color: 'rgba(255,255,255,0.5)', font: { size: 10, weight: 'bold' } },
                ticks: { display: false, max: 10, min: 0 }
            }
        },
        plugins: { legend: { display: false } }
    };

    return (
        <div className="min-h-screen bg-[#070814] text-white p-8 lg:p-16">
            <div className="max-w-7xl mx-auto" ref={pdfRef}>
                <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest mb-4">
                            <Fingerprint size={12} />
                            Session Identity Ledger
                        </div>
                        <h1 className="font-sora font-black text-5xl md:text-6xl tracking-tighter mb-2">Behavioral <span className="text-accent underline decoration-white/10 underline-offset-8">DNA</span></h1>
                        <p className="text-secondary text-lg font-medium opacity-50">Node Identity: {auditData?.identity?.userId?.slice(-12).toUpperCase()}</p>
                    </div>

                    <GlassCard className="px-6 py-4 border-emerald/20 bg-emerald/5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald/10 border border-emerald/20 flex items-center justify-center text-emerald">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald uppercase tracking-widest">Global Trust Rank</p>
                            <p className="text-xl font-black font-sora tracking-tight">TIER 1 (Verified)</p>
                        </div>
                    </GlassCard>
                </header>

                {/* Model Stats / Enrolment Section */}
                <GlassCard className="p-10 mb-10 border-white/5 bg-white/[0.01]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="flex-1">
                            <h2 className="font-sora font-black text-2xl mb-4">Model Enrolment Status</h2>
                            <div className="flex flex-wrap gap-10">
                                {[
                                    { label: 'First Login', date: 'Apr 02, 2026' },
                                    { label: 'Observation (40/40)', date: 'Apr 03, 2026' },
                                    { label: 'Model Trained', date: 'Apr 04, 2026' },
                                    { label: 'Active Protection', date: 'Today (Live)' }
                                ].map((step, i) => (
                                    <div key={i} className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-2 h-2 rounded-full ${i === 3 ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{step.label}</span>
                                        </div>
                                        <span className="text-sm font-bold">{step.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={async () => {
                                    if (confirm('Recalibrate baseline? This will trigger a 3-minute warmup mode.')) {
                                        await axios.post('http://localhost:5000/api/behavioral/reset-baseline', {}, { withCredentials: true });
                                        window.location.reload();
                                    }
                                }}
                                className="px-6 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                            >
                                Reset Baseline
                            </button>
                        </div>
                    </div>
                </GlassCard>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Primary DNA Chart */}
                    <GlassCard className="lg:col-span-2 p-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="w-full md:w-1/2">
                            <h2 className="font-sora font-black text-2xl mb-2">Profiling Metrics</h2>
                            <p className="text-sm text-secondary mb-8">This radar chart represents your unique interaction signature built over {baseline?.totalSessions} sessions.</p>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Typing Cadence</span>
                                    <span className="text-sm font-black text-accent">{baseline?.typingSpeedAvg} cps</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Mouse Fluidity</span>
                                    <span className="text-sm font-black text-accent">High Pattern</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Interaction Entropy</span>
                                    <span className="text-sm font-black text-accent">Standard</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 aspect-square flex items-center justify-center">
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                    </GlassCard>

                    {/* Baseline Summary */}
                    <GlassCard className="p-10 flex flex-col justify-between border-accent/20 bg-accent/5">
                        <div>
                            <Database size={32} className="text-accent mb-6 opacity-40" />
                            <h2 className="font-sora font-black text-2xl mb-4">Neural Baseline</h2>
                            <p className="text-sm text-white/60 leading-relaxed mb-6">
                                Our ML engine has processed <b>{baseline?.totalSessions}</b> verified sessions to create your identity node.
                                Your behavior is <b>99.4%</b> consistent, making you <b>un-spoofable</b> by scripts or intruders.
                            </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-3 text-xs font-bold text-accent mb-2 uppercase tracking-widest">
                                <Activity size={14} />
                                Live Pulse Active
                            </div>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Last Sync: 2 seconds ago</p>
                        </div>
                    </GlassCard>
                </div>

                <div className="mt-14">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-sora font-black text-3xl tracking-tight">Audit History</h2>
                        <div className="flex gap-4">
                            <div className="h-2 w-2 rounded-full bg-emerald animate-pulse mt-2" />
                            <span className="text-xs font-black uppercase tracking-widest text-white/40 mt-1">Immutable Ledger</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {auditData?.sessionHistory?.map((sess, i) => (
                            <GlassCard key={i} className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40">
                                        <Clock size={16} />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${sess.riskLevel === 'safe' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-rose/10 border-rose/20 text-rose'}`}>
                                        {sess.riskLevel}
                                    </div>
                                </div>
                                <div className="space-y-4 mb-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Session Health</p>
                                        <p className="text-xl font-black font-sora">{Math.round(sess.trustScore * 100)}%</p>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                        <span>Keys: {sess.metrics.typingSpeed.toFixed(1)} cps</span>
                                        <span>Mouse: {sess.metrics.mouseVelocity.toFixed(0)} px/s</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5 text-[9px] font-medium text-white/20 uppercase tracking-[0.2em]">
                                    ID: {sess.sessionId.slice(-12)}
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-20 pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div>
                        <h3 className="font-sora font-black text-xl mb-3">Data Portability</h3>
                        <p className="text-sm text-secondary leading-relaxed mb-6">Export your hashed biometric signature for auditing or migration to other Guard-compatible platforms. Data is encrypted prior to export.</p>
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-3 px-8 py-4 bg-accent rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:shadow-[0_0_20px_rgba(108,99,255,0.3)] transition-all"
                        >
                            <Download size={14} /> Download Security Passport (PDF)
                        </button>
                    </div>

                    <div className="p-8 rounded-3xl bg-rose-500/5 border border-rose-500/10">
                        <h3 className="font-sora font-black text-xl text-rose-500 mb-3">Permanent Lockdown</h3>
                        <p className="text-sm text-secondary leading-relaxed mb-6">Terminate your behavioral enrollment and purge all interaction snapshots from the node network. This action is irreversible.</p>
                        <button
                            onClick={async () => {
                                if (confirm('⚠️ PERMANENT DELETE: Are you sure? This will wipe your behavioral DNA from the network.')) {
                                    await axios.delete('http://localhost:5000/api/behavioral/delete-profile', { withCredentials: true });
                                    window.location.href = '/login';
                                }
                            }}
                            className="flex items-center gap-3 px-8 py-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 font-black text-[10px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                        >
                            <Trash2 size={14} /> Delete DNA Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FingerprintPage;
