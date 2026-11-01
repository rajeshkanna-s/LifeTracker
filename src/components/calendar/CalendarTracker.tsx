import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Pencil,
  Trash2,
  List,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Expense, TabId, ExpenseSettings } from '../../types';
import { normalizeTransaction, isIncome, formatLocalDate } from '../../utils/expenseUtils';
import { CATEGORY_ICONS, CATEGORY_EMOJIS, INCOME_CATEGORY_ICONS, getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';
import ExpenseForm from '../expenses/ExpenseForm';
import IndianCalendarModal from './IndianCalendarModal';
import { findIndianHoliday } from '../../data/indianHolidays';

interface CalendarTrackerProps {
  onNavigateTab?: (tab: TabId) => void;
}

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getCategoryIcon = (exp: Expense): string => {
  if (isIncome(exp)) {
    return INCOME_CATEGORY_ICONS[exp.category] || '💰';
  }
  const icon = CATEGORY_ICONS[exp.category];
  if (icon) return icon;
  const emojiArray = CATEGORY_EMOJIS[exp.category];
  if (Array.isArray(emojiArray)) return emojiArray[0] || '📦';
  if (typeof emojiArray === 'string') return emojiArray;
  return '📦';
};

/** Compact INR formatter for calendar day cells (e.g. 800 -> "800", 1200 -> "1.2k", 52087 -> "52k", 150000 -> "1.5L") */
const formatCompactCellAmount = (val: number): string => {
  const abs = Math.abs(val);
  if (abs >= 10000000) {
    return `${(abs / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (abs >= 100000) {
    return `${(abs / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (abs >= 10000) {
    return `${Math.round(abs / 1000)}k`;
  }
  if (abs >= 1000) {
    return `${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${Math.round(abs)}`;
};

/** Crisp SVG Indian Tricolor Flag (never renders as broken "IN" letters on Windows) */
const TricolorFlagIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-2.5' }) => (
  <svg
    viewBox="0 0 24 16"
    className={`${className} rounded-[2px] shadow-2xs shrink-0 overflow-hidden border border-black/10`}
    aria-hidden="true"
  >
    <rect width="24" height="5.33" y="0" fill="#FF9933" />
    <rect width="24" height="5.34" y="5.33" fill="#FFFFFF" />
    <rect width="24" height="5.33" y="10.67" fill="#138808" />
    <circle cx="12" cy="8" r="2" fill="none" stroke="#000080" strokeWidth="1.1" />
  </svg>
);

export const CalendarTracker: React.FC<CalendarTrackerProps> = () => {
  const { activePartnerId } = usePartner();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return formatLocalDate(new Date());
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [loading, setLoading] = useState(true);

  // View state: 'grid' (month view) or 'agenda' (timeline list)
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  // Type filter: 'all' | 'expense' | 'income'
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Modal state for Add/Edit transaction & Holidays
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  // Touch swipe tracking for native mobile month navigation
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, [activePartnerId]);

  const fetchExpenses = async () => {
    setLoading(true);

    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('date', { ascending: false });

    if (expData) {
      setExpenses(expData.map(normalizeTransaction));
    } else {
      setExpenses([]);
    }

    const { data: setObj } = await supabase
      .from('expense_settings')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const defaults = getDefaultExpenseSettings(activePartnerId);
    if (setObj && setObj.settings_json) {
      setSettings({ ...defaults, ...setObj.settings_json });
    } else {
      setSettings(defaults);
    }

    setLoading(false);
  };

  // Calendar Month Info
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  const monthLabelFull = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthLabelShort = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const isViewingTodayMonth = todayStr.startsWith(monthPrefix);

  // Filtered transactions by typeFilter
  const filteredExpenses = useMemo(() => {
    if (typeFilter === 'all') return expenses;
    if (typeFilter === 'income') return expenses.filter(e => isIncome(e));
    return expenses.filter(e => !isIncome(e));
  }, [expenses, typeFilter]);

  // Aggregated data map by date string (YYYY-MM-DD)
  const dateDataMap = useMemo(() => {
    const map: Record<
      string,
      {
        expenseTotal: number;
        incomeTotal: number;
        txCount: number;
      }
    > = {};

    for (const exp of filteredExpenses) {
      if (!exp.date) continue;
      if (!map[exp.date]) {
        map[exp.date] = { expenseTotal: 0, incomeTotal: 0, txCount: 0 };
      }
      map[exp.date].txCount += 1;
      if (isIncome(exp)) {
        map[exp.date].incomeTotal += Number(exp.amount) || 0;
      } else {
        map[exp.date].expenseTotal += Number(exp.amount) || 0;
      }
    }

    return map;
  }, [filteredExpenses]);

  // Calendar Days Grid (Monday start)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const startPadding = (firstDayOfMonth.getDay() + 6) % 7;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const mStr = (prevDate.getMonth() + 1).toString().padStart(2, '0');
      const dStr = dNum.toString().padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${mStr}-${dStr}`;
      const colIdx = days.length % 7;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: colIdx === 5 || colIdx === 6,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      const colIdx = days.length % 7;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: colIdx === 5 || colIdx === 6,
      });
    }

    // Next month padding
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const mStr = (nextDate.getMonth() + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${mStr}-${dStr}`;
      const colIdx = days.length % 7;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: colIdx === 5 || colIdx === 6,
      });
    }

    return days;
  }, [year, month, todayStr]);

  // Month Financial Totals
  const monthStats = useMemo(() => {
    let mIncome = 0;
    let mExpense = 0;
    const spendingDays = new Set<string>();
    let monthFilteredCount = 0;

    for (const exp of expenses) {
      if (!exp.date || !exp.date.startsWith(monthPrefix)) continue;
      if (isIncome(exp)) {
        mIncome += Number(exp.amount) || 0;
      } else {
        mExpense += Number(exp.amount) || 0;
        spendingDays.add(exp.date);
      }
    }

    for (const exp of filteredExpenses) {
      if (exp.date && exp.date.startsWith(monthPrefix)) {
        monthFilteredCount += 1;
      }
    }

    const net = mIncome - mExpense;
    const avgDaily = spendingDays.size > 0 ? Math.round(mExpense / spendingDays.size) : 0;
    return { mIncome, mExpense, net, avgDaily, monthFilteredCount };
  }, [expenses, filteredExpenses, monthPrefix]);

  // Selected Day Items
  const selectedDayExpenses = useMemo(() => {
    return filteredExpenses.filter(e => e.date === selectedDateStr);
  }, [filteredExpenses, selectedDateStr]);

  const selectedDayTotals = useMemo(() => {
    let spent = 0;
    let income = 0;
    for (const exp of selectedDayExpenses) {
      if (isIncome(exp)) income += Number(exp.amount) || 0;
      else spent += Number(exp.amount) || 0;
    }
    return { spent, income, net: income - spent };
  }, [selectedDayExpenses]);

  // Agenda View Grouped Transactions (Current Month)
  const monthAgendaGroups = useMemo(() => {
    const monthList = filteredExpenses.filter(e => e.date && e.date.startsWith(monthPrefix));

    const groups: Record<string, Expense[]> = {};
    for (const e of monthList) {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    }

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(dStr => {
      const items = groups[dStr];
      let daySpent = 0;
      let dayInc = 0;
      for (const it of items) {
        if (isIncome(it)) dayInc += Number(it.amount) || 0;
        else daySpent += Number(it.amount) || 0;
      }
      return {
        dateStr: dStr,
        items,
        spent: daySpent,
        income: dayInc,
      };
    });
  }, [filteredExpenses, monthPrefix]);

  // Navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatLocalDate(now));
  };

  const handleSelectCell = (cellDateStr: string, isCurrentMonth: boolean) => {
    setSelectedDateStr(cellDateStr);
    if (!isCurrentMonth) {
      const parts = cellDateStr.split('-');
      if (parts.length === 3) {
        setCurrentDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
      }
    }
  };

  // Touch swipe handlers for mobile month swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Horizontal swipe threshold (55px) and ensure horizontal intent
    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        handleNextMonth();
      } else {
        handlePrevMonth();
      }
    }
  };

  // Add / Edit Transaction Handlers
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setShowFormModal(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('partner_id', activePartnerId);

    if (!error) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleSubmitExpense = async (data: Partial<Expense>) => {
    const isInc = data.type === 'income';
    let tags = data.tags || '';
    if (isInc) {
      if (!tags.includes('Income')) tags = tags ? `${tags}, Income` : 'Income';
    } else {
      tags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.toLowerCase() !== 'income')
        .join(', ');
    }

    const { type: _type, ...dbFields } = data;

    if (editingExpense) {
      const payload = {
        ...dbFields,
        tags,
        partner_id: activePartnerId,
        date: data.date || selectedDateStr,
      };

      const { data: updated } = await supabase
        .from('expenses')
        .update(payload)
        .eq('id', editingExpense.id)
        .eq('partner_id', activePartnerId)
        .select()
        .single();

      if (updated) {
        setExpenses(prev => prev.map(e => (e.id === editingExpense.id ? normalizeTransaction(updated) : e)));
      }
    } else {
      const payload = {
        ...dbFields,
        tags,
        partner_id: activePartnerId,
        date: data.date || selectedDateStr,
      };

      const { data: newRow } = await supabase.from('expenses').insert(payload).select().single();
      if (newRow) {
        setExpenses(prev => [normalizeTransaction(newRow), ...prev]);
      }
    }

    setShowFormModal(false);
    setEditingExpense(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const selectedDayNum = selectedDateObj.getDate().toString().padStart(2, '0');
  const selectedShortMonth = selectedDateObj.toLocaleDateString('en-US', { month: 'short' });
  const selectedWeekdayFull = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const selectedMonthYear = selectedDateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const selectedHoliday = findIndianHoliday(selectedDateStr);
  const isSelectedToday = selectedDateStr === todayStr;

  return (
    <div className="space-y-3 max-w-4xl mx-auto pb-32">
      {/* ════════ Native App Top Control & Cashflow Card ════════ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-3 sm:p-4 shadow-xs space-y-2.5">
        {/* Row 1: Integrated Month Navigator + Quick Actions */}
        <div className="flex items-center justify-between gap-1.5">
          {/* Month Stepper */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center active:scale-90 transition cursor-pointer shrink-0"
            >
              <ChevronLeft size={17} strokeWidth={2.4} />
            </button>

            <button
              type="button"
              onClick={handleGoToday}
              title="Tap to jump to Today"
              className="px-2 py-1 rounded-xl hover:bg-slate-50 transition cursor-pointer text-left min-w-0"
            >
              <span className="text-[15px] sm:text-lg font-black text-slate-900 tracking-tight leading-none block truncate sm:hidden">
                {monthLabelShort}
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none hidden sm:block truncate">
                {monthLabelFull}
              </span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center active:scale-90 transition cursor-pointer shrink-0"
            >
              <ChevronRight size={17} strokeWidth={2.4} />
            </button>

            {(!isViewingTodayMonth || !isSelectedToday) && (
              <button
                type="button"
                onClick={handleGoToday}
                className="ml-0.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-[11px] font-extrabold transition active:scale-95 cursor-pointer shrink-0"
              >
                Today
              </button>
            )}
          </div>

          {/* Right Action Pills: Holidays + View Switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowHolidayModal(true)}
              aria-label="Open Holidays Calendar"
              title="2020–2035 Indian Govt Holidays"
              className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 bg-amber-50 hover:bg-amber-100/80 text-slate-800 border border-amber-200/90 rounded-xl text-[11px] font-extrabold shadow-2xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <TricolorFlagIcon />
              <span>Holidays</span>
            </button>

            {/* Compact Segmented View Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70 h-8">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 h-7 px-2 sm:px-2.5 text-[11px] font-extrabold rounded-[10px] transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Calendar Grid"
                aria-label="Calendar Grid"
              >
                <LayoutGrid size={13} strokeWidth={2.3} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 h-7 px-2 sm:px-2.5 text-[11px] font-extrabold rounded-[10px] transition cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Timeline List"
                aria-label="Timeline List"
              >
                <List size={14} strokeWidth={2.3} />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Compact 4-Column App Cashflow Strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-200/75 bg-slate-50/90 border border-slate-200/70 rounded-2xl py-2 px-1">
          <div className="px-1.5 sm:px-3 text-center sm:text-left min-w-0">
            <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 truncate">
              Income
            </p>
            <p className="text-[11px] sm:text-sm font-black text-emerald-700 tabular-nums tracking-tight truncate mt-0.5">
              +₹{monthStats.mIncome.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="px-1.5 sm:px-3 text-center sm:text-left min-w-0">
            <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-rose-500 truncate">
              Spent
            </p>
            <p className="text-[11px] sm:text-sm font-black text-rose-600 tabular-nums tracking-tight truncate mt-0.5">
              ₹{monthStats.mExpense.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="px-1.5 sm:px-3 text-center sm:text-left min-w-0">
            <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
              Net Flow
            </p>
            <p
              className={`text-[11px] sm:text-sm font-black tabular-nums tracking-tight truncate mt-0.5 ${
                monthStats.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {monthStats.net >= 0 ? '+' : '-'}₹{Math.abs(monthStats.net).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="px-1.5 sm:px-3 text-center sm:text-left min-w-0">
            <p className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-indigo-500 truncate">
              Avg/Day
            </p>
            <p className="text-[11px] sm:text-sm font-black text-slate-800 tabular-nums tracking-tight truncate mt-0.5">
              ₹{monthStats.avgDaily.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Row 3: Sleek Native Segmented Filter */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`flex-1 py-1 text-[11px] sm:text-xs font-extrabold rounded-lg transition cursor-pointer text-center ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`flex-1 py-1 text-[11px] sm:text-xs font-extrabold rounded-lg transition cursor-pointer text-center ${
              typeFilter === 'expense'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`flex-1 py-1 text-[11px] sm:text-xs font-extrabold rounded-lg transition cursor-pointer text-center ${
              typeFilter === 'income'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* ════════ VIEW 1: NATIVE APP MONTH GRID ════════ */}
      {viewMode === 'grid' && (
        <>
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="bg-white border border-slate-200/80 rounded-3xl p-2.5 sm:p-4 shadow-xs select-none"
          >
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center pb-2 mb-1.5 border-b border-slate-100">
              {DAYS_HEADER.map((d, idx) => {
                const isWeekend = idx === 5 || idx === 6;
                return (
                  <div
                    key={d}
                    className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${
                      isWeekend ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* Interactive Day Tiles with Micro Cashflow Amounts */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map(cell => {
                const isSelected = cell.dateStr === selectedDateStr;
                const data = dateDataMap[cell.dateStr];
                const hasExpense = !!(data && data.expenseTotal > 0);
                const hasIncome = !!(data && data.incomeTotal > 0);
                const hasActivity = hasExpense || hasIncome;
                const cellHoliday = findIndianHoliday(cell.dateStr);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleSelectCell(cell.dateStr, cell.isCurrentMonth)}
                    title={cellHoliday ? `${cellHoliday.name} • ${cell.dateStr}` : cell.dateStr}
                    className={`relative flex flex-col items-center justify-between min-h-[54px] sm:min-h-[66px] py-1.5 px-0.5 rounded-2xl transition-all duration-150 cursor-pointer active:scale-95 ${
                      !cell.isCurrentMonth
                        ? 'opacity-30 hover:opacity-55 bg-transparent'
                        : isSelected
                        ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/25 z-10'
                        : cell.isToday
                        ? 'bg-emerald-50/90 text-emerald-900 border-2 border-emerald-500 shadow-2xs'
                        : cellHoliday
                        ? 'bg-amber-50/70 hover:bg-amber-50 text-slate-900 border border-amber-200/80'
                        : hasActivity
                        ? 'bg-slate-50/90 hover:bg-slate-100/80 text-slate-900 border border-slate-200/70'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    {/* Holiday Corner Dot */}
                    {cellHoliday && (
                      <span
                        className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-300' : 'bg-orange-500'
                        }`}
                      />
                    )}

                    {/* Day Number */}
                    <span
                      className={`text-xs sm:text-sm leading-none tabular-nums ${
                        isSelected
                          ? 'font-black text-white'
                          : cell.isToday
                          ? 'font-black text-emerald-700'
                          : hasActivity || cellHoliday
                          ? 'font-extrabold text-slate-900'
                          : cell.isWeekend
                          ? 'font-bold text-slate-600'
                          : 'font-semibold text-slate-700'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Micro Cashflow Preview Inside Tile */}
                    <div className="flex flex-col items-center justify-end gap-0.5 w-full min-h-[20px] leading-none">
                      {hasIncome && (
                        <span
                          className={`text-[8.5px] sm:text-[10px] font-extrabold tabular-nums tracking-tight leading-none truncate max-w-full px-0.5 ${
                            isSelected ? 'text-emerald-100' : 'text-emerald-600'
                          }`}
                        >
                          +{formatCompactCellAmount(data.incomeTotal)}
                        </span>
                      )}
                      {hasExpense && (
                        <span
                          className={`text-[8.5px] sm:text-[10px] font-extrabold tabular-nums tracking-tight leading-none truncate max-w-full px-0.5 ${
                            isSelected ? 'text-white' : 'text-rose-600'
                          }`}
                        >
                          -{formatCompactCellAmount(data.expenseTotal)}
                        </span>
                      )}
                      {!hasIncome && !hasExpense && cellHoliday && (
                        <span
                          className={`text-[8px] font-bold truncate max-w-[92%] leading-none ${
                            isSelected ? 'text-amber-200' : 'text-orange-600'
                          }`}
                        >
                          Holiday
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subtle Legend Footer */}
            <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-slate-100 px-1 text-[10px] font-bold text-slate-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Income
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Spent
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Holiday
                </span>
              </div>
              <span className="sm:hidden text-[9.5px] text-slate-400 font-semibold">
                Swipe ↔ month
              </span>
            </div>
          </div>

          {/* ════════ Native App Selected Day Agenda Sheet ════════ */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-3">
            {/* Day Sheet Header */}
            <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                {/* Calendar Leaf Badge */}
                <div
                  className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 leading-none border ${
                    isSelectedToday
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-slate-50 text-slate-800 border-slate-200/90'
                  }`}
                >
                  <span
                    className={`text-[9px] font-extrabold uppercase tracking-wider ${
                      isSelectedToday ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {selectedShortMonth}
                  </span>
                  <span className="text-[15px] font-black tabular-nums mt-0.5">
                    {selectedDayNum}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                      {selectedWeekdayFull}
                    </h3>
                    <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
                      • {selectedMonthYear}
                    </span>
                    {isSelectedToday && (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full leading-none">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Daily Summary Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {selectedDayTotals.spent > 0 && (
                      <span className="inline-flex items-center text-[11px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg tabular-nums leading-none">
                        Spent ₹{selectedDayTotals.spent.toLocaleString('en-IN')}
                      </span>
                    )}
                    {selectedDayTotals.income > 0 && (
                      <span className="inline-flex items-center text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg tabular-nums leading-none">
                        +₹{selectedDayTotals.income.toLocaleString('en-IN')}
                      </span>
                    )}
                    {selectedDayTotals.spent === 0 && selectedDayTotals.income === 0 && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        No transactions logged
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Primary Add Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm shadow-emerald-600/20 active:scale-95 transition cursor-pointer shrink-0"
              >
                <Plus size={15} strokeWidth={2.6} />
                <span>Add</span>
              </button>
            </div>

            {/* Holiday Banner if applicable */}
            {selectedHoliday && (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-amber-50/90 border border-amber-200/80">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  <p className="text-xs font-extrabold text-amber-950 truncate">
                    {selectedHoliday.name}
                  </p>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md bg-white text-amber-700 border border-amber-200/70 shrink-0">
                  {selectedHoliday.type === 'National Holiday' ? 'National' : 'Gazetted'}
                </span>
              </div>
            )}

            {/* Selected Day Transactions List */}
            {selectedDayExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center">
                <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 mb-2 shadow-2xs">
                  <CalendarIcon size={16} />
                </div>
                <p className="text-xs font-bold text-slate-600">
                  Nothing recorded for {selectedShortMonth} {selectedDateObj.getDate()}
                </p>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-xs active:scale-95 transition cursor-pointer shadow-2xs"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  <span>Add Expense or Income</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayExpenses.map(exp => {
                  const isInc = isIncome(exp);
                  const icon = getCategoryIcon(exp);

                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-50/60 hover:bg-slate-50 rounded-2xl transition border border-slate-200/75"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border select-none ${
                            isInc
                              ? 'bg-emerald-50 border-emerald-200/80'
                              : 'bg-white border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-snug">
                              {exp.description || exp.category}
                            </p>
                            {isInc && (
                              <span className="inline-flex items-center text-[9px] font-extrabold bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded-md leading-none shrink-0">
                                Income
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            <span>{exp.category}</span>
                            {exp.platform && <span>• {exp.platform}</span>}
                            {exp.payment_method && <span>• {exp.payment_method}</span>}
                            {exp.time && <span>• {exp.time}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black tabular-nums whitespace-nowrap ${
                            isInc ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {isInc ? '+' : '-'}₹{Number(exp.amount).toLocaleString('en-IN')}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(exp)}
                            className="w-7 h-7 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 transition active:scale-90 cursor-pointer shadow-2xs"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Pencil size={12} strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/70 flex items-center justify-center text-rose-600 transition active:scale-90 cursor-pointer"
                            title="Delete transaction"
                            aria-label="Delete transaction"
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
        </>
      )}

      {/* ════════ VIEW 2: NATIVE TIMELINE LIST ════════ */}
      {viewMode === 'agenda' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-3.5 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-slate-900 truncate">
                {monthLabelFull} Timeline
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {monthStats.monthFilteredCount} {monthStats.monthFilteredCount === 1 ? 'transaction' : 'transactions'} this month
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm shadow-emerald-600/20 active:scale-95 transition cursor-pointer shrink-0"
            >
              <Plus size={15} strokeWidth={2.6} />
              <span>Add</span>
            </button>
          </div>

          {monthAgendaGroups.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">
                No transactions recorded in {monthLabelFull}.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition cursor-pointer shadow-xs active:scale-95"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add Transaction</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {monthAgendaGroups.map(group => {
                const dateObj = new Date(group.dateStr + 'T00:00:00');
                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayMonth = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                const isGroupToday = group.dateStr === todayStr;

                return (
                  <div key={group.dateStr} className="space-y-2">
                    {/* Sticky-style Day Group Pill Bar */}
                    <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/75">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-black text-slate-900">
                          {dayMonth} • {weekday}
                        </span>
                        {isGroupToday && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold leading-none">
                            Today
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {group.spent > 0 && (
                          <span className="inline-flex items-center text-[11px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 tabular-nums">
                            -₹{group.spent.toLocaleString('en-IN')}
                          </span>
                        )}
                        {group.income > 0 && (
                          <span className="inline-flex items-center text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 tabular-nums">
                            +₹{group.income.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day Items */}
                    <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                      {group.items.map(exp => {
                        const isInc = isIncome(exp);
                        const icon = getCategoryIcon(exp);

                        return (
                          <div
                            key={exp.id}
                            className="p-2.5 sm:p-3.5 bg-white flex items-center justify-between gap-2.5 hover:bg-slate-50/70 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 border select-none ${
                                  isInc
                                    ? 'bg-emerald-50 border-emerald-200/80'
                                    : 'bg-slate-50 border-slate-200/80'
                                }`}
                              >
                                {icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-snug">
                                    {exp.description || exp.category}
                                  </p>
                                  {isInc && (
                                    <span className="inline-flex items-center text-[9px] font-extrabold bg-emerald-100/80 text-emerald-800 px-1.5 py-0.5 rounded-md leading-none shrink-0">
                                      Income
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate mt-0.5">
                                  <span>{exp.category}</span>
                                  {exp.platform && <span>• {exp.platform}</span>}
                                  {exp.payment_method && <span>• {exp.payment_method}</span>}
                                  {exp.time && <span>• {exp.time}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-xs sm:text-sm font-black tabular-nums whitespace-nowrap ${
                                  isInc ? 'text-emerald-600' : 'text-slate-900'
                                }`}
                              >
                                {isInc ? '+' : '-'}₹{Number(exp.amount).toLocaleString('en-IN')}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(exp)}
                                  className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
                                  title="Edit transaction"
                                  aria-label="Edit transaction"
                                >
                                  <Pencil size={12} strokeWidth={2.2} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition active:scale-95 cursor-pointer"
                                  title="Delete transaction"
                                  aria-label="Delete transaction"
                                >
                                  <Trash2 size={12} strokeWidth={2.2} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════ Add / Edit Transaction Modal ════════ */}
      {showFormModal && (
        <ExpenseForm
          initialData={editingExpense || { date: selectedDateStr }}
          settings={settings}
          onSubmit={handleSubmitExpense}
          onClose={() => {
            setShowFormModal(false);
            setEditingExpense(null);
          }}
        />
      )}

      {/* ════════ Indian Govt Holidays Modal ════════ */}
      <IndianCalendarModal
        isOpen={showHolidayModal}
        onClose={() => setShowHolidayModal(false)}
        initialDate={currentDate}
        onSelectDate={dStr => {
          setSelectedDateStr(dStr);
          const parts = dStr.split('-');
          if (parts.length === 3) {
            setCurrentDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
          }
        }}
      />
    </div>
  );
};

export default CalendarTracker;
