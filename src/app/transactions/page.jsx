"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Search, Download,
  Calendar, CreditCard, Send, Activity, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { GlassCard, NavBar, TrustBadge } from '../../components/Shared';
import { GlobalSpotlight } from '../../components/MagicSpotlight';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { clsx } from 'clsx';

const TransactionsPage = () => {
  const { user, trustScore } = useAuth();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const gridRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dbData, setDbData] = useState({ balance: 0, history: [] });
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${apiUrl}/transfer/history`, { withCredentials: true });
        if (res.data.success) {
          setDbData({ balance: res.data.balance, history: res.data.history });
        }
      } catch { console.error('Ledger sync failed.'); }
    };
    if (user) fetchData();
  }, [user]);

  const filteredTransactions = dbData.history.filter(tx => {
    const q = search.toLowerCase();
    const isDeposit = tx.sender?._id === tx.receiver?._id;
    const currentId = (user?._id || user?.id);
    const isOutgoing = !isDeposit && tx.sender?._id === currentId;
    const counterParty = isOutgoing ? tx.receiver : tx.sender;

    return (
      (isDeposit ? 'Self Node card deposit' : (counterParty?.name || 'External Node')).toLowerCase().includes(q) ||
      tx.note?.toLowerCase().includes(q) ||
      String(tx.amount).includes(q)
    );
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Type', 'Party', 'Amount (₹)', 'Date', 'Status'];
    const rows = filteredTransactions.map(tx => {
      const currentId = (user?._id || user?.id);
      const isDeposit = tx.sender?._id === tx.receiver?._id;
      const isOutgoing = !isDeposit && tx.sender?._id === currentId;
      const counterParty = isOutgoing ? tx.receiver : tx.sender;
      return [
        isDeposit ? 'Deposit' : (isOutgoing ? 'Sent' : 'Received'),
        isDeposit ? 'Card Deposit' : counterParty?.name,
        tx.amount,
        new Date(tx.timestamp).toLocaleString(),
        'Completed'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'behaveguard_ledger.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh"><div className="orb-1" /><div className="orb-2" /><div className="orb-3" /></div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main ref={gridRef} className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <GlobalSpotlight gridRef={gridRef} />

        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl">Master Ledger</h1>
            <p className="text-secondary mt-1">All verified behavioral-authenticated transactions</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-40"
            >
              <Download size={14} />
              <span>Export Ledger</span>
            </button>
            <TrustBadge score={trustScore} />
          </div>
        </header>

        {/* Search */}
        <div className="mb-10 max-w-md">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus-within:border-accent transition-all">
            <Search size={18} className="mr-3 text-secondary" />
            <input
              type="text"
              placeholder="Search ledger..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
            />
          </div>
        </div>

        {/* Transaction Table */}
        <GlassCard className="p-0 overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">
                  <th className="py-6 px-10">Entity / Timestamp</th>
                  <th className="py-6">Type</th>
                  <th className="py-6">Amount (INR)</th>
                  <th className="py-6">Security Check</th>
                  <th className="py-6 px-10 text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center opacity-20">
                      <div className="flex flex-col items-center">
                        <Activity size={48} className="mb-4" />
                        <p className="font-black uppercase tracking-[0.3em] text-xs">Ledger Empty</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTransactions.map((tx) => {
                  const currentId = (user?._id || user?.id);
                  const isDeposit = tx.sender?._id === tx.receiver?._id;
                  const isOutgoing = !isDeposit && tx.sender?._id === currentId;
                  const counterParty = isOutgoing ? tx.receiver : tx.sender;
                  const colorClass = (isDeposit || !isOutgoing) ? 'text-emerald-400' : 'text-red-400';

                  return (
                    <tr key={tx._id} className="group hover:bg-white/[0.01] transition-all">
                      <td className="py-7 px-10">
                        <div className="flex items-center space-x-5">
                          <div className={clsx(
                            "w-12 h-12 rounded-2xl flex items-center justify-center border",
                            isOutgoing ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          )}>
                            {isDeposit ? <CreditCard size={20} /> : (isOutgoing ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />)}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-white">
                              {isDeposit ? 'Self Node Deposit' : (counterParty?.name || 'External Node')}
                            </p>
                            <div className="flex items-center gap-2">
                              {!isDeposit && counterParty?.email && (
                                <p className="text-[11px] text-accent/50 font-bold uppercase tracking-widest">{counterParty.email}</p>
                              )}
                              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                                {new Date(tx.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-7">
                        <span className={clsx(
                          "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          isOutgoing ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                        )}>
                          {isDeposit ? 'DEPOSIT' : (isOutgoing ? 'SENT' : 'RECEIVED')}
                        </span>
                      </td>
                      <td className="py-7">
                        <p className={clsx("font-black text-xl", colorClass)}>
                          {isOutgoing ? '−' : '+'} ₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-1">Verified Node</p>
                      </td>
                      <td className="py-7">
                        <div className="flex items-center space-x-2">
                          <div className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            (tx.authScore || 100) > 60 ? "bg-emerald-400" : (tx.authScore || 100) > 30 ? "bg-amber-400" : "bg-red-400"
                          )} />
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            Auth Score: {tx.authScore || 100}%
                          </span>
                        </div>
                      </td>
                      <td className="py-7 px-10 text-right">
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-tighter">
                          BG-{tx._id?.slice(-8).toUpperCase()}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-8 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
              <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">
                Nodes {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} Total
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-white transition-all disabled:opacity-20"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      "w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all",
                      currentPage === page ? "bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-white/5 text-white/30 hover:text-white"
                    )}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/30 hover:text-white transition-all disabled:opacity-20"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </GlassCard>
      </main>
    </div>
  );
};

export default TransactionsPage;
