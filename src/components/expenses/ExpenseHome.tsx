import React, { useState, useEffect } from 'react';
import { Sparkles, Target, ArrowUpRight, Search, Lightbulb, Save, Edit2, Trash2 } from 'lucide-react';
import type { Expense, ExpenseSettings, QuickAddTemplate } from '../../types';
import { getTodayTotal, getMonthTotal, getWeekTotal, getYearTotal, getNoSpendDays, getTodayString, getCurrentTimeString } from '../../utils/expenseUtils';

interface ExpenseHomeProps {
  expenses: Expense[];
  settings: ExpenseSettings;
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
  onSettingsChange: (settings: ExpenseSettings) => void;
  onNavigate: (tab: 'home' | 'add' | 'reports' | 'settings') => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  'Food': '🍕', 'Grocery': '🛒', 'Vegetables': '🥬', 'Petrol / Fuel': '⛽',
  'Travel / Transport': '🚗', 'Mobile Recharge': '📱', 'Internet Bill': '🌐',
  'Electricity Bill': '⚡', 'Rent / Home Loan': '🏠', 'EMIs / Loans': '🏦',
  'Education': '📚', 'Health / Medical': '🏥', 'Entertainment': '🎬',
  'Cinema / Movies': '🎬', 'Dress / Clothing': '👕', 'Shopping': '🛍️',
  'Office': '💼', 'Kids / Family': '👨‍👩‍👧', 'Gifts / Donations': '🎁',
  'Home Maintenance': '🔧', 'Savings / Investments': '💰', 'Social / Events': '🎉',
  'Miscellaneous': '📦',
};

const ExpenseHome: React.FC<ExpenseHomeProps> = ({ expenses, settings, onAddExpense, onSettingsChange, onNavigate, onEdit, onDelete }) => {
  const [dayNote, setDayNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const todayTotal = getTodayTotal(expenses);
  const weekTotal = getWeekTotal(expenses);
  const monthTotal = getMonthTotal(expenses);
  const avgDaily = Math.round(monthTotal / Math.max(new Date().getDate(), 1));
  const budgetPct = settings.monthlyBudget > 0 ? Math.round((monthTotal / settings.monthlyBudget) * 100) : 0;
  const noSpendDays = getNoSpendDays(expenses, new Date().getFullYear(), new Date().getMonth());

  useEffect(() => {
    const today = getTodayString();
    const existing = settings.dayNotes?.find(n => n.date === today);
    if (existing) setDayNote(existing.note);
  }, [settings.dayNotes]);

  const handleQuickAdd = async (t: QuickAddTemplate) => {
    await onAddExpense({
      amount: t.amount, category: t.category, platform: t.platform,
      payment_method: 'UPI', date: getTodayString(), time: getCurrentTimeString(),
      description: t.name, person: 'Me', tags: '', notes: ''
    });
  };

  const handleSaveDayNote = () => {
    const today = getTodayString();
    const updatedNotes = (settings.dayNotes || []).filter(n => n.date !== today);
    if (dayNote.trim()) updatedNotes.push({ date: today, note: dayNote.trim() });
    onSettingsChange({ ...settings, dayNotes: updatedNotes });
    setEditingNote(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const filtered = expenses
    .filter(e => !searchTerm || e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || e.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(e => !filterCat || e.category === filterCat);
  const recentExpenses = filtered.slice(0, 10);
  const categories = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{greeting()}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
            {settings.currencySymbol}{monthTotal.toLocaleString()} <span className="text-sm font-normal text-gray-500">this month</span>
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
          {(settings.familyMembers?.[0] || 'M').charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Spending & Budget Pills */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 relative overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <ArrowUpRight size={14} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white/80">Spending</span>
          </div>
          <p className="text-xl font-bold text-white">{settings.currencySymbol}{todayTotal.toLocaleString()}</p>
          <p className="text-[10px] text-white/60 mt-1">Today</p>
        </div>
        <div className="rounded-2xl p-4 relative overflow-hidden shadow-md" style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <Target size={14} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white/80">Budget</span>
          </div>
          <p className="text-xl font-bold text-white">{settings.monthlyBudget > 0 ? `${budgetPct}%` : '—'}</p>
          <p className="text-[10px] text-white/60 mt-1">{settings.monthlyBudget > 0 ? `${settings.currencySymbol}${(settings.monthlyBudget - monthTotal).toLocaleString()} left` : 'Not set'}</p>
        </div>
      </div>

      {/* Budget Progress */}
      {settings.monthlyBudget > 0 && (
        <div className="card-dark">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Monthly Budget</span>
            <span className={`text-xs font-bold ${budgetPct >= 100 ? 'text-red-500' : budgetPct >= 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {settings.currencySymbol}{monthTotal.toLocaleString()} / {settings.currencySymbol}{settings.monthlyBudget.toLocaleString()}
            </span>
          </div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{
              width: `${Math.min(budgetPct, 100)}%`,
              background: budgetPct >= 100 ? 'linear-gradient(90deg, #ef4444, #f97316)' : budgetPct >= 80 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #10b981, #34d399)'
            }} />
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Today', value: todayTotal, icon: '📅' },
          { label: 'Week', value: weekTotal, icon: '📊' },
          { label: 'No-Spend', value: noSpendDays, icon: '🎯', noSymbol: true },
          { label: 'Avg/Day', value: avgDaily, icon: '📈' },
        ].map(s => (
          <div key={s.label} className="card-dark text-center !p-3">
            <div className="text-lg mb-1">{s.icon}</div>
            <p className="text-sm font-bold text-gray-900">
              {s.noSymbol ? s.value : `${settings.currencySymbol}${s.value.toLocaleString()}`}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Add */}
      <div className="card-dark">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2 text-gray-900">
            <Sparkles size={16} className="text-amber-500" /> Quick Add
          </h3>
          <button onClick={() => onNavigate('settings')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition">Customize</button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(settings.quickAddTemplates || []).slice(0, 6).map(t => (
            <button key={t.id} onClick={() => handleQuickAdd(t)}
              className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center hover:border-violet-400 hover:bg-violet-50 transition-all active:scale-95 group">
              <div className="text-xl mb-1">{t.icon}</div>
              <p className="text-[11px] font-semibold text-gray-800 truncate">{t.name}</p>
              <p className="text-[9px] text-gray-400 font-medium">{settings.currencySymbol}{t.amount}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card-dark !p-0">
        <div className="flex items-center justify-between p-3 pb-0">
          <h3 className="font-bold text-sm text-gray-900">Recent Transactions</h3>
          <button onClick={() => onNavigate('reports')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition">See all</button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-violet-400 placeholder:text-gray-400" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-700 outline-none cursor-pointer">
            <option value="">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-2 opacity-30">📋</div>
            <h4 className="text-sm font-bold text-gray-800">No expenses found</h4>
            <p className="text-xs text-gray-400 mt-1">Add one or adjust your filters</p>
          </div>
        ) : (
          <div className="px-1">
            {recentExpenses.map(exp => (
              <div key={exp.id} className="tx-item">
                <div className="tx-icon">{CATEGORY_ICONS[exp.category] || '📦'}</div>
                <div className="tx-details">
                  <p className="tx-amount">{settings.currencySymbol}{Number(exp.amount).toLocaleString()}</p>
                  <p className="tx-category">{exp.description || exp.category}</p>
                </div>
                <div className="tx-meta">
                  <p className="tx-date">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
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

      {/* Day Note */}
      <div className="card-dark">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-gray-900">
            <Lightbulb size={14} className="text-amber-500" /> Today's Note
          </h4>
          {!editingNote && dayNote && (
            <button onClick={() => setEditingNote(true)} className="text-xs text-violet-600 hover:text-violet-700 font-semibold">Edit</button>
          )}
        </div>
        {editingNote || !dayNote ? (
          <div className="space-y-2">
            <textarea placeholder="Any thoughts about today's spending?" value={dayNote} onChange={e => setDayNote(e.target.value)} rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 text-gray-800 placeholder:text-gray-400" />
            <button onClick={handleSaveDayNote}
              className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-violet-700 transition active:scale-95">
              <Save size={14} /> Save
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-200">{dayNote}</p>
        )}
      </div>
    </div>
  );
};

export default ExpenseHome;
