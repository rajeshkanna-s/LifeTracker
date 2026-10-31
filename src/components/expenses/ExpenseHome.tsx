import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Target, ArrowUpRight, ArrowDownLeft, Wallet, Search, Lightbulb, Save, Edit2, Trash2, ChevronLeft, ChevronRight, Check, Plus } from 'lucide-react';
import type { Expense, ExpenseSettings, QuickAddTemplate } from '../../types';
import { usePartner } from '../../context/PartnerContext';
import { CATEGORY_EMOJIS, INCOME_CATEGORY_ICONS } from '../../data/constants';
import { formatLocalDate, getTodayTotal, getMonthTotal, getWeekTotal, getYearTotal, getNoSpendDays, getTodayString, getCurrentTimeString, getWeekStartString, getWeekEndString, getMonthExpenseTotal, getMonthIncomeTotal, getTodayExpenseTotal, getTodayIncomeTotal, getWeekExpenseTotal, getWeekIncomeTotal, isExpense, isIncome } from '../../utils/expenseUtils';
import { getFuelBadge, isFuelCategory } from '../../utils/fuelUtils';
import { NoSpendChallengeModal } from './NoSpendChallengeModal';
import { SharedShoppingListModal } from './SharedShoppingListModal';
import { RecurringBillsModal } from './RecurringBillsModal';

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
  const [showNoSpendModal, setShowNoSpendModal] = useState(false);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);

  // Expiring Warranties (Only before 1 month: <= 30 days and >= today)
  const expiringWarranties = useMemo(() => {
    const warranties = (settings as any).customWarranties || [];
    const today = new Date();
    const todayStr = formatLocalDate(today);
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    const thirtyDaysStr = formatLocalDate(thirtyDaysLater);

    return warranties.map((w: any) => {
      if (!w.purchaseDate || !w.durationMonths) return null;
      const pDate = new Date(w.purchaseDate);
      pDate.setMonth(pDate.getMonth() + Number(w.durationMonths));
      const expStr = formatLocalDate(pDate);
      const diffDays = Math.max(0, Math.ceil((pDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      return { ...w, expiryDate: expStr, diffDays };
    }).filter((w: any) => w && w.expiryDate >= todayStr && w.expiryDate <= thirtyDaysStr);
  }, [settings]);

  // Active Goals for Progress Bar Widget
  const activeGoals = useMemo(() => {
    const goals = (settings as any).customGoals || [];
    return goals.filter((g: any) => g.status !== 'reached' && g.savedAmount < g.targetAmount).slice(0, 3);
  }, [settings]);

  // Recurring Bills due soon
  const dueRecurringBills = useMemo(() => {
    const rbs = (settings as any).recurringBills || [];
    const currentDay = new Date().getDate();
    return rbs.filter((b: any) => Math.abs(b.dueDay - currentDay) <= 3);
  }, [settings]);
  const [filterCat, setFilterCat] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [slide, setSlide] = useState(0);
  const [justAdded, setJustAdded] = useState<string | null>(null);
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
          <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">{greeting()}, {partnerName} 👋</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
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
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Budget</span>
            <span className={`text-xs font-bold ${budgetPct >= 100 ? 'text-red-500' : budgetPct >= 80 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
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
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate w-full">
              {s.noSymbol ? s.value : `${settings.currencySymbol}${s.value.toLocaleString()}`}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 truncate w-full">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Expiring Warranties Banner — Only displays within 1 month (<= 30 days) */}
      {expiringWarranties.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Warranty Expiring Soon
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  {expiringWarranties.length} item{expiringWarranties.length > 1 ? 's' : ''} expiring within 30 days
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
              Expiring Soon
            </span>
          </div>
          <div className="space-y-1.5">
            {expiringWarranties.map((w: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{w.productName}</span>
                  {w.brand && <span className="text-[10px] text-slate-400">({w.brand})</span>}
                </div>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 shrink-0 ml-2">
                  Expires in {w.diffDays} day{w.diffDays === 1 ? '' : 's'} ({w.expiryDate})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Goals Progress Bars */}
      {activeGoals.length > 0 && (
        <div className="card-dark">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Target size={13} className="text-violet-600 dark:text-violet-400 shrink-0" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  lineHeight: '1',
                  margin: 0
                }}
                className="text-slate-500 dark:text-slate-400"
              >
                Active Goals Progress
              </span>
            </div>
            <span
              style={{ fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: '1' }}
              className="text-violet-600 dark:text-violet-400 shrink-0 bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded-full border border-violet-200/50 dark:border-violet-800/40"
            >
              {activeGoals.length} Active
            </span>
          </div>
          <div className="space-y-2">
            {activeGoals.map((g: any, i: number) => {
              const pct = Math.min(100, Math.round(((g.savedAmount || 0) / (g.targetAmount || 1)) * 100));
              return (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1 min-w-0">
                    <span className="text-slate-800 dark:text-slate-200 truncate">{g.name}</span>
                    <span className="text-violet-600 dark:text-violet-400 font-bold ml-2 shrink-0 whitespace-nowrap text-[11px]">
                      {settings.currencySymbol}{(g.savedAmount || 0).toLocaleString()} / {settings.currencySymbol}{(g.targetAmount || 0).toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Power Tools — No-Spend Streak, Shared List, Recurring Bills */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setShowNoSpendModal(true)}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 hover:border-violet-300 dark:hover:border-violet-500 shadow-2xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-300 text-sm">
            🎯
          </div>
          <span className="text-[11px] font-bold leading-tight">No-Spend</span>
          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Streak & Badges</span>
        </button>

        <button
          type="button"
          onClick={() => setShowShoppingListModal(true)}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 hover:border-violet-300 dark:hover:border-violet-500 shadow-2xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-300 text-sm">
            🛒
          </div>
          <span className="text-[11px] font-bold leading-tight">Shared List</span>
          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Rajesh & Mia</span>
        </button>

        <button
          type="button"
          onClick={() => setShowRecurringModal(true)}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 hover:border-violet-300 dark:hover:border-violet-500 shadow-2xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-300 text-sm">
            🔄
          </div>
          <span className="text-[11px] font-bold leading-tight">Recurring</span>
          <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">Bills & Dues</span>
        </button>
      </div>

      {/* Quick Add — Mobile Swipeable Carousel */}
      <div className="card-dark overflow-hidden">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <span style={{ fontSize: '12px', fontWeight: 700, margin: 0 }} className="text-slate-900 dark:text-slate-100 whitespace-nowrap">
              Quick Add
            </span>
            <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-1.5 py-0.5 rounded-full border border-violet-100 dark:border-violet-800/50 shrink-0">
              {quickItems.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-bold px-2 py-1 rounded-md hover:bg-violet-50 dark:hover:bg-violet-950/40 transition active:scale-95 whitespace-nowrap cursor-pointer"
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
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 shadow-xs'
                              : 'border-slate-200/90 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80 hover:border-violet-300 dark:hover:border-violet-500 shadow-xs'
                            }`}
                        >
                          {justAdded === t.id && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce shadow-xs">
                              <Check size={9} className="text-white" />
                            </span>
                          )}
                          <span className="text-xl sm:text-2xl mb-0.5 filter drop-shadow-xs transform group-hover:scale-105 transition-transform">{t.icon}</span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate w-full px-1 block leading-tight text-center">{t.name}</span>
                          <span className="text-[9px] sm:text-[10px] font-bold text-violet-600 dark:text-violet-400 mt-0.5 block truncate w-full text-center">{settings.currencySymbol}{t.amount.toLocaleString()}</span>
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
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none transition active:scale-90"
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
                          : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                        }`}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 select-none ml-1">
                    {slide + 1}/{totalSlides}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => goTo(slide + 1)}
                  disabled={slide === totalSlides - 1}
                  aria-label="Next page"
                  className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-20 disabled:pointer-events-none transition active:scale-90"
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
            <span style={{ fontSize: '12px', fontWeight: 700, margin: 0 }} className="text-slate-900 dark:text-slate-100">
              Recently
            </span>
            <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/50 px-2 py-0.5 rounded-full border border-violet-100 dark:border-violet-800/50">
              This Week
            </span>
            <span className="px-2 py-0.5 text-xs font-black bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/50 rounded-full leading-none">
              {recentExpenses.length}
            </span>
          </div>
          <button onClick={() => onNavigate('reports')} className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold transition cursor-pointer">See all</button>
        </div>
        {/* Type Toggle: All / Expense / Income */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mx-3 mt-2 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setTxTypeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${txTypeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTxTypeFilter('expense')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${txTypeFilter === 'expense' ? 'bg-rose-500 text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setTxTypeFilter('income')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${txTypeFilter === 'income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            Income
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-3 py-2">
          <div className="flex-1 relative flex items-center">
            <Search size={15} className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none shrink-0 z-10" />
            <input
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px' }}
              className="w-full pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-violet-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-700 dark:text-slate-200 outline-none cursor-pointer">
            <option value="">All</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {recentExpenses.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="text-3xl mb-2 opacity-30">📋</div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No expenses this week</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{searchTerm || filterCat ? 'No matches for your search' : 'Transactions added during this week will appear here'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentExpenses.map(exp => {
              const fuelBadge = getFuelBadge(exp);
              const isInc = isIncome(exp);
              const icon = isInc
                ? (INCOME_CATEGORY_ICONS[exp.category] || '💰')
                : (CATEGORY_ICONS[exp.category] || '📦');
              return (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-2.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 border shadow-2xs ${
                      isInc ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                          {exp.description || exp.category}
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
                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {exp.payment_method ? ` • ${exp.payment_method}` : ''}
                        {exp.description && exp.category ? ` • ${exp.category}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <span className={`text-xs sm:text-sm font-black whitespace-nowrap ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {isInc ? '+' : ''}{settings.currencySymbol}{Number(exp.amount).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit?.(exp)}
                        title="Edit expense"
                        aria-label="Edit expense"
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition active:scale-90 cursor-pointer shadow-2xs"
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

      {/* Day Note */}
      <div className="card-dark">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Lightbulb size={14} className="text-amber-500" /> Today's Note
          </h4>
          {!editingNote && dayNote && (
            <button onClick={() => setEditingNote(true)} className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold cursor-pointer">Edit</button>
          )}
        </div>
        {editingNote || !dayNote ? (
          <div>
            <textarea
              rows={2}
              value={dayNote}
              onChange={e => setDayNote(e.target.value)}
              placeholder="Add a quick note for today..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <div className="flex items-center justify-center gap-2 pt-2">
              {editingNote && dayNote && (
                <button
                  type="button"
                  onClick={() => setEditingNote(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
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
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">{dayNote}</p>
        )}
      </div>

      {/* No Spend Challenge Modal */}
      {showNoSpendModal && (
        <NoSpendChallengeModal
          isOpen={showNoSpendModal}
          onClose={() => setShowNoSpendModal(false)}
          expenses={expenses}
          settings={settings}
          onUpdateSettings={async (patch) => {
            onSettingsChange({ ...settings, ...patch });
          }}
        />
      )}

      {/* Shared Shopping List Modal */}
      {showShoppingListModal && (
        <SharedShoppingListModal
          isOpen={showShoppingListModal}
          onClose={() => setShowShoppingListModal(false)}
          onAddExpense={async (exp) => {
            await onAddExpense(exp);
          }}
        />
      )}

      {/* Recurring Bills Modal */}
      {showRecurringModal && (
        <RecurringBillsModal
          isOpen={showRecurringModal}
          onClose={() => setShowRecurringModal(false)}
          settings={settings}
          expenses={expenses}
          onUpdateSettings={async (patch) => {
            onSettingsChange({ ...settings, ...patch });
          }}
          onAddExpense={async (exp) => {
            await onAddExpense(exp);
          }}
        />
      )}
    </div>
  );
};

export default ExpenseHome;
