import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Target, ArrowUpRight, ArrowDownLeft, Wallet, Search, Lightbulb, Save, Edit2, Trash2, ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import type { Expense, ExpenseSettings, QuickAddTemplate } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { CATEGORY_EMOJIS, INCOME_CATEGORY_ICONS } from '../../data/constants';
import { getTodayTotal, getMonthTotal, getWeekTotal, getYearTotal, getNoSpendDays, getTodayString, getCurrentTimeString, getWeekStartString, getWeekEndString, getMonthExpenseTotal, getMonthIncomeTotal, getTodayExpenseTotal, getTodayIncomeTotal, getWeekExpenseTotal, getWeekIncomeTotal, isExpense, isIncome } from '../../utils/expenseUtils';
import { getFuelBadge, isFuelCategory } from '../../utils/fuelUtils';

interface ExpenseHomeProps {
  expenses: Expense[];
  settings: ExpenseSettings;
  onAddExpense: (expense: Partial<Expense>) => Promise<void>;
  onSettingsChange: (settings: ExpenseSettings) => void;
  onNavigate: (tab: 'home' | 'add' | 'reports' | 'settings') => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  onOpenAdd?: () => void;
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

const ExpenseHome: React.FC<ExpenseHomeProps> = ({ expenses, settings, onAddExpense, onSettingsChange, onNavigate, onEdit, onDelete, onOpenAdd }) => {
  const { activePartner, activePartnerId } = usePartner();
  const isP1 = activePartnerId === 'partner_1';
  const partnerName = activePartner?.name || (isP1 ? 'Rajesh' : 'Mia');
  const [dayNote, setDayNote] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
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

  const monthExpense = getMonthExpenseTotal(expenses);
  const monthIncome = getMonthIncomeTotal(expenses);
  const netBalance = monthIncome - monthExpense;
  const todayExpense = getTodayExpenseTotal(expenses);
  const todayIncome = getTodayIncomeTotal(expenses);
  const weekExpense = getWeekExpenseTotal(expenses);
  const weekIncome = getWeekIncomeTotal(expenses);

  const todayTotal = todayExpense;
  const weekTotal = weekExpense;
  const monthTotal = monthExpense;
  const avgDaily = Math.round(monthExpense / Math.max(new Date().getDate(), 1));
  const budgetPct = settings.monthlyBudget > 0 ? Math.round((monthExpense / settings.monthlyBudget) * 100) : 0;
  const noSpendDays = getNoSpendDays(expenses, new Date().getFullYear(), new Date().getMonth());

  useEffect(() => {
    const today = getTodayString();
    const existing = settings.dayNotes?.find(n => n.date === today);
    if (existing) setDayNote(existing.note);
  }, [settings.dayNotes]);

  const openQuickPrompt = (t: QuickAddTemplate) => {
    onEdit?.({
      id: '',
      type: 'expense',
      amount: t.amount,
      category: t.category,
      platform: t.platform || '',
      description: t.name,
      payment_method: 'UPI',
      date: getTodayString(),
      time: getCurrentTimeString(),
      person: 'Me',
      tags: '',
      notes: '',
      created_at: new Date().toISOString()
    });
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

    // Seed with user's saved templates first
    (settings.quickAddTemplates || []).forEach(t => {
      const key = (t.name || '').trim().toLowerCase();
      if (key) map.set(key, t);
    });

    // Only add recent transactions up to 16 items max (2 clean pages of 8 items)
    const MAX_ITEMS = Math.max(16, (settings.quickAddTemplates || []).length);
    for (const e of expenses) {
      if (map.size >= MAX_ITEMS) break;
      const name = (e.description || e.category || '').trim();
      const key = name.toLowerCase();
      if (!name || map.has(key)) continue;
      map.set(key, {
        id: `tx-${e.id}`,
        name,
        amount: Number(e.amount) || 0,
        category: e.category || 'Miscellaneous',
        platform: e.platform || '',
        icon: iconFor(e.category || 'Miscellaneous'),
      });
    }

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

  const weekStart = getWeekStartString();
  const weekEnd = getWeekEndString();

  // Recent transactions: show current week data only
  const currentWeekExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= weekStart && e.date <= weekEnd);
  }, [expenses, weekStart, weekEnd]);

  const filtered = currentWeekExpenses
    .filter(e => {
      if (txTypeFilter === 'expense') return isExpense(e);
      if (txTypeFilter === 'income') return isIncome(e);
      return true;
    })
    .filter(e => !searchTerm || e.description?.toLowerCase().includes(searchTerm.toLowerCase()) || e.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(e => !filterCat || e.category === filterCat);
  const recentExpenses = filtered;
  const categories = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="space-y-4">
      {/* Greeting & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">{greeting()}, {partnerName} 👋</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            Overview
          </h1>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onOpenAdd) {
              onOpenAdd();
            } else {
              onNavigate('add');
            }
          }}
          aria-label="Add transaction"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(124, 58, 237, 0.28)',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            height: '34px',
            lineHeight: 1
          }}
          onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
          onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </div>

      {/* 2x2 Financial Overview Grid — Perfectly Proportioned & Aligned */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Income Card */}
        <div className="rounded-2xl p-3 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[96px]" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/95">Income</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <ArrowUpRight size={13} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-xl font-black text-white truncate">+{settings.currencySymbol}{monthIncome.toLocaleString()}</p>
            <p className="text-[10px] text-white/75 mt-0.5">This Month</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-2xl p-3 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[96px]" style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/95">Expenses</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <ArrowDownLeft size={13} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-xl font-black text-white truncate">{settings.currencySymbol}{monthExpense.toLocaleString()}</p>
            <p className="text-[10px] text-white/75 mt-0.5">This Month</p>
          </div>
        </div>

        {/* Net Cash Balance Card */}
        <div className="rounded-2xl p-3 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[96px]" style={{ background: netBalance >= 0 ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/95">Net Balance</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Wallet size={13} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-xl font-black text-white truncate">
              {netBalance >= 0 ? '+' : ''}{settings.currencySymbol}{netBalance.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/75 mt-0.5">Cash Flow</p>
          </div>
        </div>

        {/* Budget Card */}
        <div className="rounded-2xl p-3 sm:p-4 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[96px]" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/95">Budget</span>
            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
              <Target size={13} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-base sm:text-xl font-black text-white truncate">{settings.monthlyBudget > 0 ? `${budgetPct}%` : '—'}</p>
            <p className="text-[10px] text-white/75 mt-0.5">
              {settings.monthlyBudget > 0
                ? `${settings.currencySymbol}${Math.max(0, settings.monthlyBudget - monthExpense).toLocaleString()} left`
                : 'Not set'}
            </p>
          </div>
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
      <div className="card-dark overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <h3 className="font-bold text-sm text-slate-900 whitespace-nowrap">
              Quick Add
            </h3>
            <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded-full border border-violet-100 shrink-0">
              {quickItems.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="text-xs text-violet-600 hover:text-violet-700 font-bold px-2 py-1 rounded-md hover:bg-violet-50 transition active:scale-95 whitespace-nowrap"
          >
            Customize
          </button>
        </div>

        {quickItems.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-2xl mb-1 opacity-40">⚡</div>
            <p className="text-xs text-slate-400">No quick items yet. Add expenses or templates.</p>
          </div>
        ) : (
          <>
            <div
              className="overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing select-none w-full"
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
                className="flex w-full"
                style={{
                  transform: `translateX(calc(-${slide * 100}% + ${currentDragOffset}px))`,
                  transition: isDraggingAny ? 'none' : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {Array.from({ length: totalSlides }).map((_, pageIdx) => (
                  <div key={pageIdx} className="quick-add-page shrink-0 w-full min-w-full max-w-full">
                    <div className="quick-add-grid">
                      {quickItems.slice(pageIdx * PER_PAGE, pageIdx * PER_PAGE + PER_PAGE).map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            if (Math.abs(currentDragOffset) > 6) return;
                            openQuickPrompt(t);
                          }}
                          className={`quick-add-card relative flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition-all duration-150 active:scale-95 group select-none min-h-[66px] sm:min-h-[72px] overflow-hidden ${justAdded === t.id
                              ? 'border-emerald-400 bg-emerald-50 shadow-xs'
                              : 'border-slate-200/90 bg-slate-50/70 hover:border-violet-300 hover:bg-violet-50/60 shadow-xs'
                            }`}
                        >
                          {justAdded === t.id && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce shadow-xs">
                              <Check size={9} className="text-white" />
                            </span>
                          )}
                          <span className="text-xl sm:text-2xl mb-0.5 filter drop-shadow-xs transform group-hover:scale-105 transition-transform">{t.icon}</span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 truncate w-full px-1 block leading-tight text-center">{t.name}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-violet-600 mt-0.5 block truncate w-full text-center">{settings.currencySymbol}{t.amount.toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Navigation & Dots */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => goTo(slide - 1)}
                  disabled={slide === 0}
                  aria-label="Previous page"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-20 disabled:pointer-events-none transition active:scale-90"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === slide
                          ? 'w-5 bg-violet-600 shadow-xs'
                          : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                        }`}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-slate-400 select-none ml-1">
                    {slide + 1}/{totalSlides}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => goTo(slide + 1)}
                  disabled={slide === totalSlides - 1}
                  aria-label="Next page"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-20 disabled:pointer-events-none transition active:scale-90"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="card-dark !p-0">
        <div className="flex items-center justify-between p-3 pb-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">Recently</h3>
            <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">
              This Week
            </span>
            <span className="px-2 py-0.5 text-xs font-black bg-violet-50 text-violet-700 border border-violet-200/60 rounded-full leading-none">
              {recentExpenses.length}
            </span>
          </div>
          <button onClick={() => onNavigate('reports')} className="text-xs text-violet-600 hover:text-violet-700 font-semibold transition">See all</button>
        </div>
        {/* Type Toggle: All / Expense / Income */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mx-3 mt-2">
          <button
            type="button"
            onClick={() => setTxTypeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${txTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTxTypeFilter('expense')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${txTypeFilter === 'expense' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setTxTypeFilter('income')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${txTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Income
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2">
          <div className="flex-1 relative flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400 pointer-events-none shrink-0 z-10" />
            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px' }}
              className="w-full pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-violet-400 placeholder:text-slate-400"
            />
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
            <h4 className="text-sm font-bold text-slate-800">No expenses this week</h4>
            <p className="text-xs text-slate-400 mt-1">{searchTerm || filterCat ? 'No matches for your search' : 'Transactions added during this week will appear here'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentExpenses.map(exp => {
              const fuelBadge = getFuelBadge(exp);
              const isInc = isIncome(exp);
              const icon = isInc
                ? (INCOME_CATEGORY_ICONS[exp.category] || '💰')
                : (CATEGORY_ICONS[exp.category] || '📦');
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-2.5 p-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border shadow-2xs ${
                      isInc ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}>
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                          {exp.description || exp.category}
                        </p>
                        {isInc && (
                          <span className="inline-flex items-center text-[9px] font-extrabold bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                            Income
                          </span>
                        )}
                        {fuelBadge?.mileage && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0"
                            title={`Mileage: ${fuelBadge.mileage} km/l${fuelBadge.distance ? ` · Dist: ${fuelBadge.distance} km` : ''}`}
                          >
                            ⛽ {fuelBadge.mileage} km/l
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {exp.payment_method ? ` • ${exp.payment_method}` : ''}
                        {exp.description && exp.category ? ` • ${exp.category}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${isInc ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isInc ? '+' : ''}{settings.currencySymbol}{Number(exp.amount).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit?.(exp)}
                        title="Edit expense"
                        aria-label="Edit expense"
                        className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 flex items-center justify-center text-slate-600 hover:text-slate-900 transition active:scale-90 cursor-pointer shadow-2xs"
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
                        title="Delete expense"
                        aria-label="Delete expense"
                        className="w-7 h-7 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200/70 flex items-center justify-center text-rose-600 hover:text-rose-800 transition active:scale-90 cursor-pointer shadow-2xs"
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
          <div>
            <textarea
              rows={2}
              value={dayNote}
              onChange={e => setDayNote(e.target.value)}
              placeholder="Add a quick note for today..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none bg-slate-50 text-slate-800"
            />
            <div className="flex items-center justify-center gap-2 pt-2">
              {editingNote && dayNote && (
                <button
                  type="button"
                  onClick={() => setEditingNote(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    padding: '8px 18px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveDayNote}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#ffffff',
                  padding: '9px 24px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(124, 58, 237, 0.28)',
                  minWidth: '130px',
                  whiteSpace: 'nowrap'
                }}
              >
                <Save size={15} />
                <span>Save Note</span>
              </button>
            </div>
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
                          <button
                type="button"
                onClick={() => setQuickPrompt(null)}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmQuickAdd}
                disabled={!promptAmount.trim() || isNaN(Number(promptAmount)) || Number(promptAmount) <= 0}
                style={{
                  flex: 1,
                  minHeight: '44px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#7c3aed',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: (!promptAmount.trim() || isNaN(Number(promptAmount)) || Number(promptAmount) <= 0) ? 'not-allowed' : 'pointer',
                  opacity: (!promptAmount.trim() || isNaN(Number(promptAmount)) || Number(promptAmount) <= 0) ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
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
