import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, Filter, PieChart, TrendingUp, TrendingDown, Minus, Store, Edit2, Trash2, FileText, BarChart3, Trophy, Wallet, Layers } from 'lucide-react';
import type { Expense, ExpenseSettings } from '../../types';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import {
  getCategoryBreakdown, getMonthStartString, getTodayString, getMonthTotal,
  getSummaryStats, getComparisonRange, getPeriodComparison, getTrendSeries,
  getDimensionBreakdown, getTopExpenses,
} from '../../utils/expenseUtils';
import { exportExpensesToPDF, exportExpensesToExcel } from '../../utils/exportUtils';
import { DEFAULT_CATEGORIES, ALL_PLATFORMS, PAYMENT_METHODS } from '../../data/constants';
import type { TimeGranularity, BreakdownDimension } from '../../utils/expenseUtils';

interface ExpenseReportsProps {
  expenses: Expense[];
  settings: ExpenseSettings;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#0ea5e9", "#a3e635"];

const DIMENSION_LABELS: Record<BreakdownDimension, string> = {
  category: 'Category',
  platform: 'Platform',
  payment_method: 'Payment',
  person: 'Person',
  tags: 'Tags',
};

const ExpenseReports: React.FC<ExpenseReportsProps> = ({ expenses, settings, onEdit, onDelete }) => {
  const [filters, setFilters] = useState({
    fromDate: getMonthStartString(),
    toDate: getTodayString(),
    category: 'all',
    platform: 'all',
    paymentMethod: 'all',
  });
  const [granularity, setGranularity] = useState<TimeGranularity>('day');
  const [dimension, setDimension] = useState<BreakdownDimension>('category');

  const cs = settings.currencySymbol;
  const fmt = (n: number) => `${cs}${Number(n).toLocaleString()}`;

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

  const stats = useMemo(() => getSummaryStats(filteredExpenses, filters.fromDate, filters.toDate), [filteredExpenses, filters.fromDate, filters.toDate]);

  const comparison = useMemo(() => {
    const range = getComparisonRange(filters.fromDate, filters.toDate);
    const prevTotal = expenses.filter(e => {
      if (e.date < range.from || e.date > range.to) return false;
      if (filters.category !== 'all' && e.category !== filters.category) return false;
      if (filters.platform !== 'all' && e.platform !== filters.platform) return false;
      if (filters.paymentMethod !== 'all' && e.payment_method !== filters.paymentMethod) return false;
      return true;
    }).reduce((s, e) => s + Number(e.amount), 0);
    return { ...getPeriodComparison(totalAmount, prevTotal), range };
  }, [expenses, filters, totalAmount]);

  const trend = useMemo(() => getTrendSeries(filteredExpenses, filters.fromDate, filters.toDate, granularity), [filteredExpenses, filters.fromDate, filters.toDate, granularity]);
  const dimBreakdown = useMemo(() => getDimensionBreakdown(filteredExpenses, dimension), [filteredExpenses, dimension]);
  const topExpenses = useMemo(() => getTopExpenses(filteredExpenses, 10), [filteredExpenses]);

  // Budget vs actual (current calendar month)
  const monthSpent = useMemo(() => getMonthTotal(expenses), [expenses]);
  const categoryMonthSpend = useMemo(() => {
    const monthStart = getMonthStartString();
    const totals: Record<string, number> = {};
    expenses.filter(e => e.date >= monthStart).forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount);
    });
    return totals;
  }, [expenses]);

  const allCategories = [...DEFAULT_CATEGORIES, ...settings.customCategories];
  const allPlatforms = [...ALL_PLATFORMS, ...settings.customPlatforms];
  const allPayments = [...PAYMENT_METHODS, ...settings.customPaymentMethods];

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

  const exportPDF = () => {
    if (filteredExpenses.length === 0) { window.alert('No data to export for the selected filters.'); return; }
    try {
      exportExpensesToPDF(filteredExpenses, stats, catBreakdown, settings, filters.fromDate, filters.toDate);
    } catch (err) {
      console.error(err);
      window.alert('Failed to generate PDF. Please try again.');
    }
  };

  const exportExcel = () => {
    if (filteredExpenses.length === 0) { window.alert('No data to export for the selected filters.'); return; }
    try {
      exportExpensesToExcel(filteredExpenses, catBreakdown, settings, filters.fromDate, filters.toDate);
    } catch (err) {
      console.error(err);
      window.alert('Failed to generate Excel file. Please try again.');
    }
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
            <label className="label-unified">From</label>
            <input type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} className="input-unified" />
          </div>
          <div>
            <label className="label-unified">To</label>
            <input type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} className="input-unified" />
          </div>
          <div>
            <label className="label-unified">Category</label>
            <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="input-unified">
              <option value="all">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label-unified">Platform</label>
            <select value={filters.platform} onChange={e => setFilters({...filters, platform: e.target.value})} className="input-unified">
              <option value="all">All Platforms</option>
              {allPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label-unified">Payment</label>
            <select value={filters.paymentMethod} onChange={e => setFilters({...filters, paymentMethod: e.target.value})} className="input-unified">
              <option value="all">All Methods</option>
              {allPayments.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary + Comparison Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Total Filtered</span>
          <span className="text-xl font-bold text-emerald-700">{fmt(totalAmount)}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-600">vs Previous Period</p>
            <p className="text-[10px] text-slate-400">{comparison.range.from} → {comparison.range.to}</p>
          </div>
          <div className={`flex items-center gap-1 font-bold text-sm ${comparison.direction === 'up' ? 'text-red-500' : comparison.direction === 'down' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {comparison.direction === 'up' ? <TrendingUp size={16} /> : comparison.direction === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
            <span>{fmt(Math.abs(comparison.diff))}</span>
            {comparison.percentChange !== null && <span className="text-xs">({comparison.percentChange > 0 ? '+' : ''}{comparison.percentChange}%)</span>}
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={exportCSV} className="flex-1 sm:flex-none justify-center px-4 py-2.5 border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition bg-white">
          <FileSpreadsheet size={16} className="text-emerald-600" /> CSV
        </button>
        <button onClick={exportExcel} className="flex-1 sm:flex-none justify-center px-4 py-2.5 border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition bg-white">
          <FileSpreadsheet size={16} className="text-green-700" /> Excel
        </button>
        <button onClick={exportPDF} className="flex-1 sm:flex-none justify-center px-4 py-2.5 border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition bg-white">
          <FileText size={16} className="text-red-500" /> PDF
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-indigo-500" /> Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Total', value: fmt(stats.total) },
            { label: 'Transactions', value: stats.count.toString() },
            { label: 'Avg / Txn', value: fmt(stats.avgPerTxn) },
            { label: 'Avg / Day', value: fmt(stats.avgPerDay) },
            { label: 'Largest', value: fmt(stats.largest) },
            { label: 'Active Days', value: stats.activeDays.toString() },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{s.label}</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spending Trend */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Spending Trend
          </h3>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['day', 'week', 'month'] as TimeGranularity[]).map(g => (
              <button key={g} onClick={() => setGranularity(g)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition ${granularity === g ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No expense data available.</div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: any) => fmt(Number(value))} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts row: Category Pie + Dimension Breakdown */}
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
                  <Tooltip formatter={(value: any) => fmt(Number(value))} />
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
                  <span className="font-bold">{fmt(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown by Dimension */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Layers size={16} className="text-blue-500" /> Breakdown
            </h3>
            <select value={dimension} onChange={e => setDimension(e.target.value as BreakdownDimension)} className="input-unified !py-1 !text-xs max-w-[130px]">
              {(Object.keys(DIMENSION_LABELS) as BreakdownDimension[]).map(d => (
                <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
              ))}
            </select>
          </div>
          {dimBreakdown.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No data to break down.</div>
          ) : (
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {dimBreakdown.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="truncate max-w-[160px] font-medium text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-800">{fmt(item.amount)} <span className="text-slate-400 font-normal">({item.percentage}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Wallet size={16} className="text-amber-500" /> Budget vs Actual (This Month)
        </h3>
        {(settings.monthlyBudget > 0 || settings.categoryBudgets.length > 0) ? (
          <div className="space-y-3">
            {settings.monthlyBudget > 0 && (() => {
              const pct = Math.round((monthSpent / settings.monthlyBudget) * 100);
              const over = monthSpent >= settings.monthlyBudget;
              return (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Monthly Budget</span>
                    <span className={`font-bold ${over ? 'text-red-500' : 'text-slate-800'}`}>
                      {fmt(monthSpent)} / {fmt(settings.monthlyBudget)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className={`text-[11px] mt-1 ${over ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                    {over ? `Over by ${fmt(monthSpent - settings.monthlyBudget)}` : `${fmt(settings.monthlyBudget - monthSpent)} remaining`} · {pct}% used
                  </p>
                </div>
              );
            })()}

            {settings.categoryBudgets.filter(b => b.budget > 0).map(b => {
              const spent = categoryMonthSpend[b.category] || 0;
              const pct = Math.round((spent / b.budget) * 100);
              const over = spent >= b.budget;
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{b.category}</span>
                    <span className={`font-bold ${over ? 'text-red-500' : 'text-slate-800'}`}>{fmt(spent)} / {fmt(b.budget)} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-sm">No budgets set. Configure budgets in Settings.</div>
        )}
      </div>

      {/* Top Expenses */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-yellow-500" /> Top Expenses
        </h3>
        {topExpenses.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">No qualifying expenses.</div>
        ) : (
          <div className="space-y-1.5">
            {topExpenses.map((exp, i) => (
              <div key={exp.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{(exp.description || '').trim() || exp.category}</p>
                  <p className="text-[10px] text-slate-400">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className="text-sm font-bold text-slate-800 shrink-0">{fmt(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense History List */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
          <Store size={16} className="text-blue-500" /> Expense History
        </h3>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No expenses found for these filters.</div>
        ) : (
          <div className="space-y-1">
            {filteredExpenses.map(exp => (
              <div key={exp.id} className="tx-item">
                <div className="tx-details">
                  <p className="tx-amount">{fmt(Number(exp.amount))}</p>
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
