"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Search, Filter, Download, 
  Calendar, CreditCard, ShoppingBag, Utensils, Send, Tv, Receipt
} from 'lucide-react';
import { dummyTransactions } from '../../data/dummy';
import { GlassCard, NavBar, TrustBadge } from '../../components/Shared';
import { useAuth } from '../../context/AuthContext';

import { clsx } from 'clsx';

const TransactionsPage = () => {
  const { trustScore } = useAuth();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const itemsPerPage = 8;

  const filteredTransactions = dummyTransactions.filter(tx => {
    const matchesFilter = filter === 'All' || tx.category === filter;
    const matchesSearch = tx.merchant.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['ID', 'Merchant', 'Category', 'Amount (₹)', 'Timestamp', 'Status', 'Trust Score (%)'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      `"${tx.merchant}"`,
      tx.category,
      tx.amount,
      `"${tx.timestamp}"`,
      tx.status,
      Math.round(tx.score * 100)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `transactions_${filter.toLowerCase()}_${new Date().toISOString().slice(0,10)}.csv`;
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const categories = ['All', 'Food', 'Shopping', 'Transfer', 'Bills', 'Entertainment', 'Income'];

  return (
    <div className="min-h-screen bg-bg-deep text-white relative">
      <div className="bg-mesh">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="orb-3"></div>
      </div>

      <NavBar isCollapsed={isSidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      <main className={clsx(
        "transition-all duration-300 p-8 pt-6 min-h-screen",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="font-sora font-extrabold text-3xl md:text-4xl">Transaction History</h1>
            <p className="text-secondary mt-1">Review your spending and security events</p>
          </div>
          <div className="flex items-center space-x-4">
             <button
               onClick={exportToCSV}
               disabled={filteredTransactions.length === 0}
               className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold hover:bg-white/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
             >
                <Download size={16} />
                <span>Export CSV</span>
             </button>
             <TrustBadge score={trustScore} />
          </div>
        </header>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
          <div className="lg:col-span-1">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-secondary focus-within:border-accent transition-all">
                <Search size={18} className="mr-3" />
                <input 
                  type="text" 
                  placeholder="Search merchant..." 
                  value={search}
                  onChange={handleSearchChange}
                  className="bg-transparent border-none outline-none text-sm w-full" 
                />
             </div>
          </div>
          <div className="lg:col-span-3 flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
             {categories.map((cat) => (
                <button 
                  key={cat}
                  onClick={() => handleFilterChange(cat)}
                  className={clsx(
                    "px-6 py-3 rounded-xl text-sm font-bold border transition-all whitespace-nowrap",
                    filter === cat ? "bg-accent border-accent text-white" : "border-white/10 bg-white/5 text-secondary hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
             ))}
          </div>
        </div>

        {/* Transaction Table */}
        <GlassCard className="p-0 overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-secondary text-xs uppercase tracking-widest font-bold">
                  <th className="py-5 px-8">Merchant / Time</th>
                  <th className="py-5">Category</th>
                  <th className="py-5">Amount</th>
                  <th className="py-5">Status</th>
                  <th className="py-5">Risk at Transaction</th>
                  <th className="py-5 px-8 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-white/[0.02] transition-all">
                    <td className="py-6 px-8">
                       <div className="flex items-center space-x-5">
                          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center text-white", {
                            "bg-accent-teal/20 text-accent-teal": tx.category === "Food",
                            "bg-accent/20 text-accent": tx.category === "Shopping",
                            "bg-trust-watch/20 text-trust-watch": tx.category === "Transfer",
                            "bg-accent-violet/20 text-accent-violet": tx.category === "Entertainment",
                            "bg-trust-safe/20 text-trust-safe": tx.category === "Income",
                            "bg-trust-danger/20 text-trust-danger": tx.category === "Bills",
                            "bg-secondary/20 text-secondary": tx.category === "Travel"
                          })}>
                             {tx.category === "Food" && <Utensils size={20} />}
                             {tx.category === "Shopping" && <ShoppingBag size={20} />}
                             {tx.category === "Transfer" && <Send size={20} />}
                             {tx.category === "Entertainment" && <Tv size={20} />}
                             {tx.category === "Income" && <CreditCard size={20} />}
                             {tx.category === "Bills" && <Receipt size={20} />}
                             {tx.category === "Travel" && <Calendar size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-primary">{tx.merchant}</p>
                            <p className="text-xs text-secondary font-medium">{tx.timestamp}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-6">
                       <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-secondary uppercase tracking-widest leading-none block w-fit">
                          {tx.category}
                       </span>
                    </td>
                    <td className="py-6">
                       <p className={clsx("font-bold text-lg", tx.amount > 0 ? "text-trust-safe" : "text-white")}>
                          {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString()}` : `- ₹${Math.abs(tx.amount).toLocaleString()}`}
                       </p>
                    </td>
                    <td className="py-6">
                       <div className="flex items-center space-x-2">
                          <Check size={14} className="text-trust-safe" />
                          <span className="text-sm font-medium text-secondary">Completed</span>
                       </div>
                    </td>
                    <td className="py-6">
                       <div className="flex items-center space-x-4">
                          <div className="flex-1 max-w-[100px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div 
                                className={clsx("h-full", tx.score > 0.9 ? "bg-trust-safe" : "bg-trust-watch")} 
                                style={{ width: `${Math.round(tx.score * 100)}%` }}
                             />
                          </div>
                          <span className="text-sm font-bold text-secondary">{Math.round(tx.score * 100)}%</span>
                       </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                       <button className="p-2 hover:bg-white/10 rounded-lg text-secondary transition-all">
                          <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
            <p className="text-secondary text-sm font-medium">
              Showing {paginatedTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
            </p>
            <div className="flex items-center space-x-2">
               <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-secondary hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
               
               {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={clsx(
                      "w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all",
                      currentPage === page ? "bg-accent text-white" : "bg-white/5 border border-white/10 text-secondary hover:bg-white/10"
                    )}
                  >
                    {page}
                  </button>
               ))}

               <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-secondary hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </GlassCard>
      </main>
    </div>
  );
};

export default TransactionsPage;

// Local components to avoid imports
function Check({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
