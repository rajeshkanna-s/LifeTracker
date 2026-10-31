import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, Filter, PieChart, TrendingUp, TrendingDown, Minus, Store, Edit2, Trash2, FileText, BarChart3, Trophy, Wallet, Layers, ArrowDownLeft, ArrowUpRight, Percent, Sparkles, Tag, Download } from 'lucide-react';
import type { Expense, ExpenseSettings } from '../../types';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import {
  getCategoryBreakdown, getMonthStartString, getTodayString, getMonthTotal,
  getSummaryStats, getComparisonRange, getPeriodComparison, getTrendSeries,
  getDimensionBreakdown, getTopExpenses,
} from '../../utils/expenseUtils';
import { exportExpensesToPDF, exportExpensesToExcel, exportMonthlyFinancialStatementPDF } from '../../utils/exportUtils';
import { usePartner } from '../../context/PartnerContext';
import { getFuelBadge } from '../../utils/fuelUtils';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, ALL_PLATFORMS, INCOME_PLATFORMS, PAYMENT_METHODS, INCOME_CATEGORY_ICONS } from '../../data/constants';
import { isExpense, isIncome } from '../../utils/expenseUtils';
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
    type: 'all' as 'all' | 'expense' | 'income',
    category: 'all',
    platform: 'all',
    paymentMethod: 'all',
  });
  const [granularity, setGranularity] = useState<TimeGranularity>('day');
  const [dimension, setDimension] = useState<BreakdownDimension>('category');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const { activePartner, activePartnerId } = usePartner();
  const partnerName = activePartner?.name || (activePartnerId === 'partner_1' ? 'Rajesh' : 'Mia');

  const cs = settings.currencySymbol;
  const fmt = (n: number) => {
    const val = Number(n) || 0;
    if (val < 0) {
      return `-${cs}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
    return `${cs}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = e.date;
      if (d < filters.fromDate || d > filters.toDate) return false;
      if (filters.type === 'expense' && !isExpense(e)) return false;
      if (filters.type === 'income' && !isIncome(e)) return false;
      if (filters.category !== 'all' && e.category !== filters.category) return false;
      if (filters.platform !== 'all' && e.platform !== filters.platform) return false;
      if (filters.paymentMethod !== 'all' && e.payment_method !== filters.paymentMethod) return false;
      if (selectedTag !== 'all' && (!e.tags || !e.tags.toLowerCase().includes(selectedTag.toLowerCase()))) return false;
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

  const totalIncome = useMemo(() => filteredExpenses.filter(isIncome).reduce((s, e) => s + Number(e.amount), 0), [filteredExpenses]);
  const totalExpense = useMemo(() => filteredExpenses.filter(isExpense).reduce((s, e) => s + Number(e.amount), 0), [filteredExpenses]);
  const netCashFlow = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netCashFlow / totalIncome) * 100)) : 0;

  // 6-Month Income vs Expense Bar Data
  const monthlyBarData = useMemo(() => {
    const list: { month: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      let inc = 0;
      let exp = 0;
      for (const e of expenses) {
        if (!e.date || !e.date.startsWith(prefix)) continue;
        if (isIncome(e)) inc += Number(e.amount) || 0;
        else exp += Number(e.amount) || 0;
      }
      list.push({ month: label, income: inc, expense: exp });
    }
    return list;
  }, [expenses]);

  // Month-over-Month Category Comparison
  const monthOverMonthCategoryComparison = useMemo(() => {
    const now = new Date();
    const currPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const currMap: Record<string, number> = {};
    const prevMap: Record<string, number> = {};

    for (const e of expenses) {
      if (!e.date || isIncome(e)) continue;
      const cat = e.category || 'Miscellaneous';
      if (e.date.startsWith(currPrefix)) {
        currMap[cat] = (currMap[cat] || 0) + Number(e.amount);
      } else if (e.date.startsWith(prevPrefix)) {
        prevMap[cat] = (prevMap[cat] || 0) + Number(e.amount);
      }
    }

    const allCats = Array.from(new Set([...Object.keys(currMap), ...Object.keys(prevMap)]));
    const comparisons = allCats.map(cat => {
      const curr = currMap[cat] || 0;
      const prev = prevMap[cat] || 0;
      const diff = curr - prev;
      return { category: cat, currentMonth: curr, previousMonth: prev, diff };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    const topIncrease = comparisons.find(c => c.diff > 0);
    const topDecrease = comparisons.find(c => c.diff < 0);

    return { comparisons, topIncrease, topDecrease };
  }, [expenses]);

  // Export Full Monthly Financial Statement
  const exportMonthlyStatement = () => {
    try {
      const currentMonthLabel = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      exportMonthlyFinancialStatementPDF({
        partnerName,
        monthYearStr: currentMonthLabel,
        totalIncome,
        totalExpense,
        netSavings: netCashFlow,
        savingsRate,
        categoryBreakdown: catBreakdown,
        topExpenses,
        goals: (settings as any).customGoals || [],
        currencySymbol: settings.currencySymbol
      });
    } catch (err) {
      console.error('Error generating monthly statement PDF:', err);
      window.alert('Failed to generate monthly statement. Please check console.');
    }
  };

  const allCategories = filters.type === 'income'
    ? DEFAULT_INCOME_CATEGORIES
    : filters.type === 'expense'
    ? [...DEFAULT_CATEGORIES, ...settings.customCategories]
    : Array.from(new Set([...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES, ...settings.customCategories]));
  const allPlatforms = [...ALL_PLATFORMS, ...settings.customPlatforms];
  const allPayments = [...PAYMENT_METHODS, ...settings.customPaymentMethods];

  // Quick CSV Export
  const exportCSV = () => {
    const headers = "Date,Time,Type,Category,Platform,Amount,Payment Method,Notes\n";
    const rows = filteredExpenses.map(e =>
      `${e.date},${e.time || ''},"${isIncome(e) ? 'Income' : 'Expense'}","${e.category}","${e.platform || ''}",${e.amount},"${e.payment_method || ''}","${(e.description || '').replace(/"/g, '""')}"`
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
    <div className="space-y-4 pb-36">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <Filter size={14} className="text-emerald-500 shrink-0" />
          <span style={{ fontSize: '11px', fontWeight: 700, margin: 0 }} className="text-slate-800 dark:text-slate-100">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="label-unified">From</label>
            <input type="date" value={filters.fromDate} onChange={e => setFilters({...filters, fromDate: e.target.value})} className="input-unified" />
          </div>
          <div>
            <label className="label-unified">To</label>
            <input type="date" value={filters.toDate} onChange={e => setFilters({...filters, toDate: e.target.value})} className="input-unified" />
          </div>
          <div>
            <label className="label-unified">Type</label>
            <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value as any, category: 'all'})} className="input-unified font-semibold">
              <option value="all">All (Income & Exp)</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
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

        {/* Smart Tag Filters Bar */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider shrink-0 flex items-center gap-1">
            <Tag size={12} /> Tags:
          </span>
          {['all', '#reimbursable', '#tax-deductible', '#shared', '#personal', '#medical', '#recurring'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              style={{ borderRadius: '9999px' }}
              className={`px-3 py-1 text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedTag === tag
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tag === 'all' ? 'All Tags' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Row */}
      {filters.type === 'all' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Income Card */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 sm:p-3.5 min-w-0 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                Total Income
              </span>
              <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight size={12} />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 mt-1.5 break-words leading-tight">
              +{fmt(totalIncome)}
            </p>
          </div>

          {/* Expenses Card */}
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 sm:p-3.5 min-w-0 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
                Total Expenses
              </span>
              <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ArrowDownLeft size={12} />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-300 mt-1.5 break-words leading-tight">
              {fmt(totalExpense)}
            </p>
          </div>

          {/* Net Cash Flow Card */}
          <div className={`border rounded-2xl p-3 sm:p-3.5 min-w-0 shadow-2xs ${
            netCashFlow >= 0
              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wide ${
                netCashFlow >= 0 ? 'text-sky-800 dark:text-sky-300' : 'text-red-800 dark:text-red-300'
              }`}>
                Net Cash Flow
              </span>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                netCashFlow >= 0 ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400' : 'bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400'
              }`}>
                <Wallet size={12} />
              </div>
            </div>
            <p className={`text-base sm:text-lg font-black mt-1.5 break-words leading-tight ${
              netCashFlow >= 0 ? 'text-sky-700 dark:text-sky-300' : 'text-red-700 dark:text-red-300'
            }`}>
              {netCashFlow >= 0 ? '+' : ''}{fmt(netCashFlow)}
            </p>
          </div>

          {/* Savings Rate Card */}
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-3 sm:p-3.5 min-w-0 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                Savings Rate
              </span>
              <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Percent size={12} />
              </div>
            </div>
            <p className="text-base sm:text-lg font-black text-purple-700 dark:text-purple-300 mt-1.5 break-words leading-tight">
              {savingsRate}%
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className={`border rounded-xl p-3 flex items-center justify-between ${filters.type === 'income' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-100 dark:border-emerald-800/60' : 'bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/40 border-rose-100 dark:border-rose-800/60'}`}>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{filters.type === 'income' ? 'Total Income' : 'Total Expenses'}</span>
            <span className={`text-xl font-bold ${filters.type === 'income' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {filters.type === 'income' ? '+' : ''}{fmt(totalAmount)}
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">vs Previous Period</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{comparison.range.from} → {comparison.range.to}</p>
            </div>
            <div className={`flex items-center gap-1 font-bold text-sm ${comparison.direction === 'up' ? 'text-red-500 dark:text-red-400' : comparison.direction === 'down' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {comparison.direction === 'up' ? <TrendingUp size={16} /> : comparison.direction === 'down' ? <TrendingDown size={16} /> : <Minus size={16} />}
              <span>{fmt(Math.abs(comparison.diff))}</span>
              {comparison.percentChange !== null && <span className="text-xs">({comparison.percentChange > 0 ? '+' : ''}{comparison.percentChange}%)</span>}
            </div>
          </div>
        </div>
      )}

      {/* Month-over-Month Category Comparison Card */}
      {monthOverMonthCategoryComparison.topIncrease && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <TrendingUp size={15} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Month-over-Month Comparison
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                Spending shifts compared to last month
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {monthOverMonthCategoryComparison.topIncrease && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Highest Increase
                  </span>
                  <span className="text-xs font-black text-rose-700 dark:text-rose-300">
                    +{cs}{Math.abs(monthOverMonthCategoryComparison.topIncrease.diff).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {monthOverMonthCategoryComparison.topIncrease.category}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    vs last month
                  </span>
                </div>
              </div>
            )}

            {monthOverMonthCategoryComparison.topDecrease ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Highest Savings
                  </span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                    -{cs}{Math.abs(monthOverMonthCategoryComparison.topDecrease.diff).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {monthOverMonthCategoryComparison.topDecrease.category}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    vs last month
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                Keep tracking to unlock reduction insights!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-Generated Monthly Statement PDF Hero Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 text-white rounded-2xl p-3.5 sm:p-4 shadow-md border border-indigo-500/30 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center shrink-0 text-indigo-300 dark:text-indigo-400">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight">
                Monthly Financial Statement
              </h4>
              <p className="text-[11px] text-indigo-100 dark:text-slate-400 font-medium leading-tight mt-0.5">
                Complete income, expenses, category shares & goal summary
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportMonthlyStatement}
            style={{ borderRadius: '12px' }}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 dark:bg-indigo-600 dark:hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shrink-0 shadow-sm"
          >
            <Download size={14} />
            <span>Download Statement (PDF)</span>
          </button>
        </div>
      </div>

      {/* Quick Export Data Buttons */}
      <div className="grid grid-cols-3 gap-2 w-full">
        <button
          onClick={exportCSV}
          style={{ borderRadius: '12px' }}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs"
        >
          <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
          <span>CSV</span>
        </button>
        <button
          onClick={exportExcel}
          style={{ borderRadius: '12px' }}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs"
        >
          <FileSpreadsheet size={15} className="text-green-600 shrink-0" />
          <span>Excel</span>
        </button>
        <button
          onClick={exportPDF}
          style={{ borderRadius: '12px' }}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition active:scale-95 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-2xs"
        >
          <FileText size={15} className="text-red-500 shrink-0" />
          <span>Raw PDF</span>
        </button>
      </div>

      {/* Summary Statistics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <BarChart3 size={15} className="text-indigo-500 shrink-0" />
          <span style={{ fontSize: '11px', fontWeight: 700, margin: 0 }} className="text-slate-800 dark:text-slate-100">
            Summary
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Total', value: fmt(stats.total) },
            { label: 'Transactions', value: stats.count.toString() },
            { label: 'Avg / Txn', value: fmt(stats.avgPerTxn) },
            { label: 'Avg / Day', value: fmt(stats.avgPerDay) },
            { label: 'Largest', value: fmt(stats.largest) },
            { label: 'Active Days', value: stats.activeDays.toString() },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-800/80 rounded-lg p-2 sm:p-2.5 text-center min-w-0 border border-slate-100 dark:border-slate-700/60">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-400 font-semibold">{s.label}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 break-words leading-snug">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 6-Month Income vs Expense Bar Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 min-w-0 shadow-2xs">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <BarChart3 size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span style={{ fontSize: '11px', fontWeight: 700, margin: 0 }} className="text-slate-900 dark:text-slate-100">
              6-Month Income vs Expense Trajectory
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">Monthly Cashflow</span>
        </div>
        <div className="h-[210px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBarData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: any) => fmt(Number(value))} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Spending Trend */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-w-0">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={15} className="text-emerald-500 shrink-0" />
            <span style={{ fontSize: '11px', fontWeight: 700, margin: 0 }} className="text-slate-800 dark:text-slate-100">
              Spending Trend
            </span>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            {(['day', 'week', 'month'] as TimeGranularity[]).map(g => (
              <button key={g} onClick={() => setGranularity(g)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition cursor-pointer ${granularity === g ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {g}
              </button>
            ))}
          </div>
        </div>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No expense data available.</div>
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-w-0">
            <div className="flex items-center gap-1.5 mb-4">
              <PieChart size={15} className="text-purple-500 shrink-0" />
              <span style={{ fontSize: '11px', fontWeight: 700, margin: 0 }} className="text-slate-800 dark:text-slate-100">
                By Category
              </span>
            </div>
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
                <div key={item.category} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[80px] text-slate-800 dark:text-slate-200">{item.category}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{fmt(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Breakdown by Dimension */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 min-w-0">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <Layers size={15} className="text-blue-500 shrink-0" />
              <span style={{ fontSize: '11px', fontWeight: 700, margin: 0 }} className="text-slate-800 dark:text-slate-100">
                Breakdown
              </span>
            </div>
            <select value={dimension} onChange={e => setDimension(e.target.value as BreakdownDimension)} className="input-unified !py-1 !text-xs max-w-[130px]">
              {(Object.keys(DIMENSION_LABELS) as BreakdownDimension[]).map(d => (
                <option key={d} value={d}>{DIMENSION_LABELS[d]}</option>
              ))}
            </select>
          </div>
          {dimBreakdown.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No data to break down.</div>
          ) : (
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {dimBreakdown.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="truncate max-w-[160px] font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{fmt(item.amount)} <span className="text-slate-400 dark:text-slate-500 font-normal">({item.percentage}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-1.5 mb-3 min-w-0">
          <Wallet size={14} className="text-amber-500 shrink-0" />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              lineHeight: '1',
              margin: 0
            }}
            className="text-slate-700 dark:text-slate-200"
          >
            Budget vs Actual (This Month)
          </span>
        </div>
        {(settings.monthlyBudget > 0 || settings.categoryBudgets.length > 0) ? (
          <div className="space-y-3">
            {settings.monthlyBudget > 0 && (() => {
              const pct = Math.round((monthSpent / settings.monthlyBudget) * 100);
              const over = monthSpent >= settings.monthlyBudget;
              return (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 rounded-lg">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Monthly Budget</span>
                    <span className={`font-bold ${over ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>
                      {fmt(monthSpent)} / {fmt(settings.monthlyBudget)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className={`text-[11px] mt-1 ${over ? 'text-red-500 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
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
                    <span className="font-medium text-slate-700 dark:text-slate-300">{b.category}</span>
                    <span className={`font-bold ${over ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{fmt(spent)} / {fmt(b.budget)} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">No budgets set. Configure budgets in Settings.</div>
        )}
      </div>

      {/* Top Expenses */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-1.5 mb-3">
          <Trophy size={15} className="text-yellow-500 shrink-0" />
          <span style={{ fontSize: '11px', fontWeight: 800, margin: 0 }} className="text-slate-900 dark:text-slate-100">
            Top Expenses
          </span>
        </div>
        {topExpenses.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm">No qualifying expenses.</div>
        ) : (
          <div className="space-y-1.5">
            {topExpenses.map((exp, i) => (
              <div key={exp.id} className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl transition border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-black shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{(exp.description || '').trim() || exp.category}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                      {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {exp.payment_method ? ` • ${exp.payment_method}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">{fmt(exp.amount)}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(exp)}
                      title="Edit expense"
                      aria-label="Edit expense"
                      className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition active:scale-90 cursor-pointer shadow-2xs"
                    >
                      <Edit2 size={12} strokeWidth={2.2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (window.confirm('Are you sure you want to delete this expense?')) onDelete?.(exp.id); }}
                      title="Delete expense"
                      aria-label="Delete expense"
                      className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/70 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition active:scale-90 cursor-pointer shadow-2xs"
                    >
                      <Trash2 size={12} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense History List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50">
              <Store size={16} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, margin: 0, lineHeight: 1 }} className="text-slate-900 dark:text-slate-100">
              Expense History
            </span>
            <span className="px-2 py-0.5 text-xs font-black bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50 rounded-full leading-none">
              {filteredExpenses.length}
            </span>
          </div>
          {filteredExpenses.length > 0 && (
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              Total: {fmt(filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0))}
            </span>
          )}
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No expenses found for these filters.</div>
        ) : (
          <div className="space-y-1.5">
            {filteredExpenses.map((exp, i) => {
              const fuelBadge = getFuelBadge(exp);
              const isInc = isIncome(exp);
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl transition border border-slate-100/90 dark:border-slate-700/60"
                >
                  {/* Left: Number circle + Details */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs font-black shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                          {(exp.description || '').trim() || exp.category}
                        </p>
                        {isInc && (
                          <span className="inline-flex items-center text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                            Income
                          </span>
                        )}
                        {fuelBadge?.mileage && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0"
                            title={`Mileage: ${fuelBadge.mileage} km/l${fuelBadge.distance ? ` · Dist: ${fuelBadge.distance} km` : ''}`}
                          >
                            ⛽ {fuelBadge.mileage} km/l
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {exp.payment_method ? ` • ${exp.payment_method}` : ''}
                        {exp.description && exp.category ? ` • ${exp.category}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount + Actions */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {isInc ? '+' : ''}{fmt(Number(exp.amount))}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit?.(exp)}
                        aria-label="Edit expense"
                        title="Edit expense"
                        className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition active:scale-90 cursor-pointer shadow-2xs"
                      >
                        <Edit2 size={12} strokeWidth={2.2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this expense?')) {
                            onDelete?.(exp.id);
                          }
                        }}
                        aria-label="Delete expense"
                        title="Delete expense"
                        className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/70 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition active:scale-90 cursor-pointer shadow-2xs"
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseReports;
