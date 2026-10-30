import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Target, ArrowUpRight, Search, Lightbulb, Save, Edit2, Trash2, ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import type { Expense, ExpenseSettings, QuickAddTemplate } from '../../types';
import { usePartner } from '../../context/PartnerContext';
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
  const { activePartner, activePartnerId } = usePartner();
  const isP1 = activePartnerId === 'partner_1';
  const partnerName = activePartner?.name || (isP1 ? 'Rajesh' : 'Seetha');
  const [dayNote, setDayNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [slide, setSlide] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [quickPrompt, setQuickPrompt] = useState<QuickAddTemplate | null>(null);
  const [promptAmount, setPromptAmount] = useState('');
  const trackRef = useRef<HTMLDivElement>(null);

  // Touch and drag swipe state for Quick Add carousel
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDiffX, setTouchDiffX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const [mouseDiffX, setMouseDiffX] = useState<number>(0);
  const [isMouseDragging, setIsMouseDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setTouchDiffX(0);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const diffX = e.touches[0].clientX - touchStartX;
    const diffY = e.touches[0].clientY - touchStartY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setTouchDiffX(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    const threshold = 40;
    if (touchDiffX < -threshold && slide < totalSlides - 1) {
      goTo(slide + 1);
    } else if (touchDiffX > threshold && slide > 0) {
      goTo(slide - 1);
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setTouchDiffX(0);
    setIsSwiping(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStartX(e.clientX);
    setMouseDiffX(0);
    setIsMouseDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDragging || mouseStartX === null) return;
    setMouseDiffX(e.clientX - mouseStartX);
  };

  const handleMouseUp = () => {
    if (!isMouseDragging) return;
    const threshold = 50;
    if (mouseDiffX < -threshold && slide < totalSlides - 1) {
      goTo(slide + 1);
    } else if (mouseDiffX > threshold && slide > 0) {
      goTo(slide - 1);
    }
    setMouseStartX(null);
    setMouseDiffX(0);
    setIsMouseDragging(false);
  };

  const currentDragOffset = isSwiping ? touchDiffX : (isMouseDragging ? mouseDiffX : 0);
  const isDraggingAny = isSwiping || isMouseDragging;

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
      {/* Greeting & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">{greeting()}, {partnerName} 👋</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {settings.currencySymbol}{monthTotal.toLocaleString()} <span className="text-sm font-normal text-slate-500">this month</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('add')}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-200 active:scale-95 transition shrink-0"
        >
          <Plus size={15} />
          <span>Add</span>
        </button>
      </div>

      {/* Spending & Budget Pills */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-2xl p-3 sm:p-4 relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
              <ArrowUpRight size={13} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white/90">Spending</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{settings.currencySymbol}{todayTotal.toLocaleString()}</p>
          <p className="text-[10px] text-white/70 mt-0.5">Today</p>
        </div>
        <div className="rounded-2xl p-3 sm:p-4 relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #059669, #34d399)' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center">
              <Target size={13} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-white/90">Budget</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-white">{settings.monthlyBudget > 0 ? `${budgetPct}%` : '—'}</p>
          <p className="text-[10px] text-white/70 mt-0.5">{settings.monthlyBudget > 0 ? `${settings.currencySymbol}${(settings.monthlyBudget - monthTotal).toLocaleString()} left` : 'Not set'}</p>
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
          <div key={s.label} className="card-dark text-center !p-2.5 sm:!p-3 flex flex-col items-center justify-center min-w-0">
            <div className="text-base sm:text-lg mb-0.5">{s.icon}</div>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate w-full">
              {s.noSymbol ? s.value : `${settings.currencySymbol}${s.value.toLocaleString()}`}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate w-full">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Add — Mobile Swipeable Carousel */}
      <div className="card-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm flex items-center gap-1.5 text-slate-900">
              <Sparkles size={16} className="text-amber-500" /> Quick Add
            </h3>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              {quickItems.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {totalSlides > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => goTo(slide - 1)}
                  disabled={slide === 0}
                  aria-label="Previous page"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition active:scale-90"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-[10px] font-bold text-slate-500 px-1 select-none">
                  {slide + 1}/{totalSlides}
                </span>
                <button
                  type="button"
                  onClick={() => goTo(slide + 1)}
                  disabled={slide === totalSlides - 1}
                  aria-label="Next page"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition active:scale-90"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="text-xs text-violet-600 hover:text-violet-700 font-bold px-2 py-1 rounded-md hover:bg-violet-50 transition active:scale-95"
            >
              Customize
            </button>
          </div>
        </div>

        {quickItems.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-1 opacity-40">⚡</div>
            <p className="text-xs text-slate-400">No quick items yet. Add expenses or templates.</p>
          </div>
        ) : (
          <>
            <div 
              className="overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div
                ref={trackRef}
                className="flex"
                style={{
                  transform: `translateX(calc(-${slide * 100}% + ${currentDragOffset}px))`,
                  transition: isDraggingAny ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {Array.from({ length: totalSlides }).map((_, pageIdx) => (
                  <div key={pageIdx} className="shrink-0 w-full quick-add-grid">
                    {quickItems.slice(pageIdx * PER_PAGE, pageIdx * PER_PAGE + PER_PAGE).map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (Math.abs(currentDragOffset) > 6) return;
                          openQuickPrompt(t);
                        }}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-150 active:scale-95 group select-none min-h-[72px] ${
                          justAdded === t.id
                            ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100'
                            : 'border-slate-200/80 bg-slate-50/70 hover:border-violet-300 hover:bg-violet-50/60 shadow-xs'
                        }`}
                      >
                        {justAdded === t.id && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce shadow-xs">
                            <Check size={10} className="text-white" />
                          </span>
                        )}
                        <span className="text-xl sm:text-2xl mb-1 filter drop-shadow-xs transform group-hover:scale-110 transition-transform">{t.icon}</span>
                        <span className="text-[11px] font-bold text-slate-800 truncate w-full px-0.5 leading-tight">{t.name}</span>
                        <span className="text-[10px] font-bold text-violet-600 mt-0.5">{settings.currencySymbol}{t.amount.toLocaleString()}</span>
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
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === slide
                        ? 'w-6 bg-violet-600 shadow-xs'
                        : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
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
