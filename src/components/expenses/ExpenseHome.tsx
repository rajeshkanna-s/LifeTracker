import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Target, ArrowUpRight, Search, Lightbulb, Save, Edit2, Trash2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Expense, ExpenseSettings, QuickAddTemplate } from '../../types';
import { CATEGORY_EMOJIS } from '../../data/constants';
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
  const [slide, setSlide] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [quickPrompt, setQuickPrompt] = useState<QuickAddTemplate | null>(null);
  const [promptAmount, setPromptAmount] = useState('');
  const trackRef = useRef<HTMLDivElement>(null);

  // Items per slide page (responsive: mobile shows fewer per row but more rows)
  const PER_PAGE = 8;

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

  const openQuickPrompt = (t: QuickAddTemplate) => {
    setQuickPrompt(t);
    setPromptAmount(String(t.amount));
  };

  const confirmQuickAdd = async () => {
    const amount = Number(promptAmount);
    if (!quickPrompt || !promptAmount.trim() || isNaN(amount) || amount <= 0) return;
    const t = quickPrompt;
    setQuickPrompt(null);
    await onAddExpense({
      amount, category: t.category, platform: t.platform,
      payment_method: 'UPI', date: getTodayString(), time: getCurrentTimeString(),
      description: t.name, person: 'Me', tags: '', notes: ''
    });
    setJustAdded(t.id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  // Build Quick Add items: saved templates + auto-derived from every transaction.
  // Deduplicated by name (case-insensitive), keeping the most recent occurrence.
  const quickItems = useMemo<QuickAddTemplate[]>(() => {
    const iconFor = (category: string) => CATEGORY_EMOJIS[category]?.[0] || '📦';
    const map = new Map<string, QuickAddTemplate>();

    // Seed with saved templates first (they take priority for icon/amount)
    (settings.quickAddTemplates || []).forEach(t => {
      const key = (t.name || '').trim().toLowerCase();
      if (key) map.set(key, t);
    });

    // expenses are ordered newest-first; only fill names not already present
    expenses.forEach(e => {
      const name = (e.description || e.category || '').trim();
      const key = name.toLowerCase();
      if (!name || map.has(key)) return;
      map.set(key, {
        id: `tx-${e.id}`,
        name,
        amount: Number(e.amount) || 0,
        category: e.category || 'Miscellaneous',
        platform: e.platform || '',
        icon: iconFor(e.category || 'Miscellaneous'),
      });
    });

    return Array.from(map.values());
  }, [settings.quickAddTemplates, expenses]);

  const totalSlides = Math.max(1, Math.ceil(quickItems.length / PER_PAGE));

  useEffect(() => {
    if (slide > totalSlides - 1) setSlide(0);
  }, [totalSlides, slide]);

  const goTo = (i: number) => setSlide(Math.max(0, Math.min(totalSlides - 1, i)));

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
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{greeting()}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {settings.currencySymbol}{monthTotal.toLocaleString()} <span className="text-sm font-normal text-slate-500">this month</span>
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
            <span className="text-xs font-medium text-slate-500">Monthly Budget</span>
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
            <p className="text-sm font-bold text-slate-900">
              {s.noSymbol ? s.value : `${settings.currencySymbol}${s.value.toLocaleString()}`}
            </p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Add — Slides */}
      <div className="card-dark">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2 text-slate-900">
            <Sparkles size={16} className="text-amber-500" /> Quick Add
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{quickItems.length}</span>
          </h3>
          <div className="flex items-center gap-2">
            {totalSlides > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => goTo(slide - 1)} disabled={slide === 0}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-90">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => goTo(slide + 1)} disabled={slide === totalSlides - 1}
                  className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-90">
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
            <button onClick={() => onNavigate('settings')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition">Customize</button>
          </div>
        </div>

        {quickItems.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-1 opacity-40">⚡</div>
            <p className="text-xs text-slate-400">No quick items yet. Add expenses or templates.</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden">
              <div ref={trackRef} className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${slide * 100}%)` }}>
                {Array.from({ length: totalSlides }).map((_, pageIdx) => (
                  <div key={pageIdx} className="shrink-0 w-full grid grid-cols-4 sm:grid-cols-4 gap-2">
                    {quickItems.slice(pageIdx * PER_PAGE, pageIdx * PER_PAGE + PER_PAGE).map(t => (
                      <button key={t.id} onClick={() => openQuickPrompt(t)}
                        className={`relative bg-slate-50 border rounded-xl p-2.5 text-center transition-all active:scale-95 group ${justAdded === t.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50'}`}>
                        {justAdded === t.id && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={11} className="text-white" />
                          </span>
                        )}
                        <div className="text-xl mb-1">{t.icon}</div>
                        <p className="text-[11px] font-semibold text-slate-800 truncate">{t.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium">{settings.currencySymbol}{t.amount.toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Slide dots */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-5 bg-violet-500' : 'w-1.5 bg-slate-300 hover:bg-slate-400'}`}
                    aria-label={`Go to slide ${i + 1}`} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card-dark !p-0">
        <div className="flex items-center justify-between p-3 pb-0">
          <h3 className="font-bold text-sm text-slate-900">Recent Transactions</h3>
          <button onClick={() => onNavigate('reports')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition">See all</button>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-violet-400 placeholder:text-slate-400" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-700 outline-none cursor-pointer">
            <option value="">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-2 opacity-30">📋</div>
            <h4 className="text-sm font-bold text-slate-800">No expenses found</h4>
            <p className="text-xs text-slate-400 mt-1">Add one or adjust your filters</p>
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
          <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900">
            <Lightbulb size={14} className="text-amber-500" /> Today's Note
          </h4>
          {!editingNote && dayNote && (
            <button onClick={() => setEditingNote(true)} className="text-xs text-violet-600 hover:text-violet-700 font-semibold">Edit</button>
          )}
        </div>
        {editingNote || !dayNote ? (
          <div className="space-y-2">
            <textarea placeholder="Any thoughts about today's spending?" value={dayNote} onChange={e => setDayNote(e.target.value)} rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 text-slate-800 placeholder:text-slate-400" />
            <button onClick={handleSaveDayNote}
              className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-violet-700 transition active:scale-95">
              <Save size={14} /> Save
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">{dayNote}</p>
        )}
      </div>
      {/* Quick Add — Amount Confirm Prompt */}
      {quickPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setQuickPrompt(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-3xl mb-1">{quickPrompt.icon}</div>
              <h4 className="text-sm font-bold text-slate-900">{quickPrompt.name}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{quickPrompt.category}</p>
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">{settings.currencySymbol}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  autoFocus
                  onFocus={e => e.currentTarget.select()}
                  value={promptAmount}
                  onChange={e => setPromptAmount(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmQuickAdd();
                    if (e.key === 'Escape') setQuickPrompt(null);
                  }}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setQuickPrompt(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition active:scale-95">
                Cancel
              </button>
              <button onClick={confirmQuickAdd}
                disabled={!promptAmount.trim() || isNaN(Number(promptAmount)) || Number(promptAmount) <= 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseHome;
