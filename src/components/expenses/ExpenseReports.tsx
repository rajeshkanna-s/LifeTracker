import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, Filter, PieChart, TrendingUp, Store, Edit2, Trash2 } from 'lucide-react';
import type { Expense, ExpenseSettings } from '../../types';
import { format, parseISO } from 'date-fns';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { getCategoryBreakdown, getMonthStartString, getTodayString } from '../../utils/expenseUtils';
import { DEFAULT_CATEGORIES, ALL_PLATFORMS, PAYMENT_METHODS } from '../../data/constants';

interface ExpenseReportsProps {
  expenses: Expense[];
  settings: ExpenseSettings;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

const ExpenseReports: React.FC<ExpenseReportsProps> = ({ expenses, settings, onEdit, onDelete }) => {
  const [filters, setFilters] = useState({
    fromDate: getMonthStartString(),
    toDate: getTodayString(),
    category: 'all',
    platform: 'all',
    paymentMethod: 'all',
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      if (d < filters.fromDate || d > filters.toDate) return false;
      if (filters.category !== 'all' && e.category !== filters.category) return false;
      if (filters.platform !== 'all' && e.platform !== filters.platform) return false;
      if (filters.paymentMethod !== 'all' && e.payment_method !== filters.paymentMethod) return false;
      return true;
    }).sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());
  }, [expenses, filters]);

  const catBreakdown = useMemo(() => getCategoryBreakdown(filteredExpenses), [filteredExpenses]);
  const totalAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const allCategories = [...DEFAULT_CATEGORIES, ...settings.customCategories];
  const allPlatforms = [...ALL_PLATFORMS, ...settings.customPlatforms];
  const allPayments = [...PAYMENT_METHODS, ...settings.customPaymentMethods];

  const selectClass = "w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white";

  // Quick CSV Export
  const exportCSV = () => {
    const headers = "Date,Time,Category,Platform,Amount,Payment Method,Notes\n";
    const rows = filteredExpenses.map(e => 
      `${e.date},${e.time || ''},"${e.category}","${e.platform || ''}",${e.amount},"${e.payment_method || ''}","${(e.description || '').replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${filters.fromDate}_to_${filters.toDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Filter size={14} className="text-emerald-500" /> Filters
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From</label>
            <input type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} className={selectClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To</label>
            <input type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} className={selectClass} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
            <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className={selectClass}>
              <option value="all">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Platform</label>
            <select value={filters.platform} onChange={e => setFilters({...filters, platform: e.target.value})} className={selectClass}>
              <option value="all">All Platforms</option>
              {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment</label>
            <select value={filters.paymentMethod} onChange={e => setFilters({...filters, paymentMethod: e.target.value})} className={selectClass}>
              <option value="all">All Methods</option>
              {allPayments.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Total Filtered</span>
          <span className="text-xl font-bold text-emerald-700">{settings.currencySymbol}{totalAmount.toLocaleString()}</span>
        </div>
        <button onClick={exportCSV} className="px-4 border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition bg-white">
          <FileSpreadsheet size={16} className="text-emerald-600" /> Export CSV
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {catBreakdown.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <PieChart size={16} className="text-purple-500" /> By Category
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={catBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={(e: any) => `${e.percentage}%`}>
                    {catBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${settings.currencySymbol}${Number(value).toLocaleString()}`} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {catBreakdown.slice(0, 6).map((item, i) => (
                <div key={item.category} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 rounded">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[80px]">{item.category}</span>
                  </div>
                  <span className="font-bold">{settings.currencySymbol}{item.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expense History List */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mt-4">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
          <Store size={16} className="text-blue-500" /> Expense History
        </h3>
        
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No expenses found for these filters.</div>
        ) : (
          <div className="space-y-1">
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="tx-item">
                <div className="tx-details">
                  <p className="tx-amount">{settings.currencySymbol}{Number(exp.amount).toLocaleString()}</p>
                  <p className="tx-category">{exp.description || exp.category}</p>
                </div>
                <div className="tx-meta">
                  <p className="tx-date">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="tx-payment">{exp.payment_method}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => onEdit?.(exp)} className="btn-action">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => { if (window.confirm('Are you sure you want to delete this expense?')) onDelete?.(exp.id); }} className="btn-action danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseReports;
