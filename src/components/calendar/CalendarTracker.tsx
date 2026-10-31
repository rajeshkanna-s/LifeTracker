import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Calendar as CalendarIcon,
  Clock,
  Pencil,
  Trash2,
  List,
  Grid,
  Filter,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Expense, TabId, ExpenseSettings } from '../../types';
import { normalizeTransaction, isIncome, formatLocalDate } from '../../utils/expenseUtils';
import { CATEGORY_EMOJIS, INCOME_CATEGORY_ICONS, getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';
import ExpenseForm from '../expenses/ExpenseForm';
import IndianCalendarModal from './IndianCalendarModal';
import { findIndianHoliday } from '../../data/indianHolidays';

interface CalendarTrackerProps {
  onNavigateTab?: (tab: TabId) => void;
}

const DAYS_HEADER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarTracker: React.FC<CalendarTrackerProps> = ({ onNavigateTab }) => {
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

  // Modal state for Add/Edit transaction
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  // Fetch all transactions for active partner
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

    // Settings for currency
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

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

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

    // Monday is 0 in ISO week: (firstDay.getDay() + 6) % 7
    const startPadding = (firstDayOfMonth.getDay() + 6) % 7;

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dNum);
      const mStr = (prevDate.getMonth() + 1).toString().padStart(2, '0');
      const dStr = dNum.toString().padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding (make complete weeks, multiple of 7)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      const mStr = (nextDate.getMonth() + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${mStr}-${dStr}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month, todayStr]);

  // Month Financial Totals
  const monthStats = useMemo(() => {
    const mPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    let mIncome = 0;
    let mExpense = 0;
    let daysWithSpending = 0;

    for (const exp of expenses) {
      if (!exp.date || !exp.date.startsWith(mPrefix)) continue;
      if (isIncome(exp)) {
        mIncome += Number(exp.amount) || 0;
      } else {
        mExpense += Number(exp.amount) || 0;
        daysWithSpending += 1;
      }
    }

    const net = mIncome - mExpense;
    const avgDaily = daysWithSpending > 0 ? Math.round(mExpense / daysWithSpending) : 0;
    return { mIncome, mExpense, net, avgDaily };
  }, [expenses, year, month]);

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
    const mPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const monthList = filteredExpenses.filter(e => e.date && e.date.startsWith(mPrefix));

    // Group by date
    const groups: Record<string, Expense[]> = {};
    for (const e of monthList) {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    }

    // Sort dates descending
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
  }, [filteredExpenses, year, month]);

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
      // Update existing
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
      // Create new
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
  const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const selectedHoliday = findIndianHoliday(selectedDateStr);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-36">
      {/* ════════ Top Month Header & Controls ════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        {/* Month Selector & Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-2xs shrink-0 border border-emerald-100 dark:border-emerald-800/60">
              <CalendarIcon size={19} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">
                {monthLabel}
              </h2>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">
                Expense & Cashflow Calendar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Toggle: Grid vs Agenda */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-full transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Month Grid View"
              >
                <Grid size={13} />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-extrabold rounded-full transition cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Agenda List View"
              >
                <List size={13} />
                <span>List</span>
              </button>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200/60 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleGoToday}
                className="px-2.5 py-0.5 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition active:scale-95 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next month"
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 active:scale-90 transition cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Real Calendar & Indian Govt Holidays Button (Top Right Corner) */}
            <button
              type="button"
              onClick={() => setShowHolidayModal(true)}
              aria-label="Open Indian Govt Holidays & Calendar"
              title="Calendar with Indian Govt Holidays for all years"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white rounded-full text-xs font-black shadow-xs active:scale-95 transition cursor-pointer shrink-0"
            >
              <CalendarIcon size={14} strokeWidth={2.4} />
              <span className="hidden sm:inline">Calendar</span>
              <span>🇮🇳</span>
            </button>
          </div>
        </div>

        {/* ════════ Streamlined Monthly Cashflow Banner ════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowUpRight size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider truncate">Income</p>
              <p className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-300 truncate">
                +₹{monthStats.mIncome.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800/60 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowDownLeft size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider truncate">Expenses</p>
              <p className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-300 truncate">
                ₹{monthStats.mExpense.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Wallet size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Net Cashflow</p>
              <p className={`text-xs sm:text-sm font-black truncate ${monthStats.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {monthStats.net >= 0 ? '+' : ''}₹{monthStats.net.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-2.5 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Clock size={14} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Daily Avg</p>
              <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                ₹{monthStats.avgDaily.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* ════════ Native App Segmented Control Filter ════════ */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-full gap-1 border border-slate-200/60 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition cursor-pointer text-center ${
              typeFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition cursor-pointer text-center ${
              typeFilter === 'expense'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-full transition cursor-pointer text-center ${
              typeFilter === 'income'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* ════════ VIEW 1: MONTH GRID VIEW ════════ */}
      {viewMode === 'grid' && (
        <>
          {/* Modern Mobile App Calendar Grid Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-5 shadow-xs">
            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center py-1.5 px-0.5 mb-2 border-b border-slate-100 dark:border-slate-800">
              {DAYS_HEADER.map((d, idx) => {
                const isWeekend = idx === 5 || idx === 6;
                return (
                  <div
                    key={d}
                    className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                      isWeekend ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {d}
                  </div>
                );
              })}
            </div>

            {/* Calendar Cells Grid (Compact, Seamless & App-Styled) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map(cell => {
                const isSelected = cell.dateStr === selectedDateStr;
                const data = dateDataMap[cell.dateStr];
                const hasExpense = data && data.expenseTotal > 0;
                const hasIncome = data && data.incomeTotal > 0;
                const cellHoliday = findIndianHoliday(cell.dateStr);

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    title={cellHoliday ? `${cellHoliday.name} • ${cell.dateStr}` : cell.dateStr}
                    className={`relative flex flex-col items-center justify-center h-12 sm:h-14 rounded-2xl transition-all duration-150 cursor-pointer active:scale-95 ${
                      !cell.isCurrentMonth
                        ? 'opacity-25 hover:opacity-40'
                        : isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black scale-102 z-10'
                        : cell.isToday
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {/* Day Number */}
                    <span
                      className={`text-xs sm:text-sm font-black transition-colors leading-none ${
                        isSelected
                          ? 'text-white'
                          : cell.isToday
                          ? 'text-emerald-800'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Financial & Holiday Indicator Dots */}
                    <div className="flex items-center justify-center gap-1 h-2 mt-1">
                      {cellHoliday && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-300' : 'bg-orange-500'
                          }`}
                          title={`Holiday: ${cellHoliday.name}`}
                        />
                      )}
                      {hasExpense && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            isSelected ? 'bg-white' : 'bg-rose-500'
                          }`}
                          title={`Expense: -₹${Math.round(data.expenseTotal).toLocaleString('en-IN')}`}
                        />
                      )}
                      {hasIncome && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            isSelected ? 'bg-emerald-200' : 'bg-emerald-500'
                          }`}
                          title={`Income: +₹${Math.round(data.incomeTotal).toLocaleString('en-IN')}`}
                        />
                      )}
                      {!hasExpense && !hasIncome && !cellHoliday && (
                        <span className="w-1.5 h-1.5 opacity-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ════════ Selected Day Inspector (Sleek Horizontal List) ════════ */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header: Date + Action */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formattedSelectedDate}
                  </h3>
                  {selectedDateStr === todayStr && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  Spent: <span className="text-rose-600 dark:text-rose-400 font-bold">₹{selectedDayTotals.spent.toLocaleString('en-IN')}</span> • Income: <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹{selectedDayTotals.income.toLocaleString('en-IN')}</span>
                </p>
                {selectedHoliday && (
                  <p className="text-[11px] font-extrabold text-orange-800 dark:text-orange-200 mt-1 flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-800 w-fit">
                    <span>🎉 {selectedHoliday.name}</span>
                    <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">({selectedHoliday.type})</span>
                  </p>
                )}
              </div>

              {/* Clean App Add Button */}
              <button
                type="button"
                onClick={handleOpenAdd}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.28)'
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-white font-extrabold text-xs rounded-full active:scale-95 transition cursor-pointer shrink-0"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {/* Transactions List */}
            <div className="space-y-1.5">
              {selectedDayExpenses.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">No transactions on this date.</p>
                  <button
                    type="button"
                    onClick={handleOpenAdd}
                    style={{
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.28)'
                    }}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white font-bold text-xs active:scale-95 transition cursor-pointer"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    <span>Add Expense or Income</span>
                  </button>
                </div>
              ) : (
                selectedDayExpenses.map((exp, idx) => {
                  const isInc = isIncome(exp);
                  const icon = isInc
                    ? INCOME_CATEGORY_ICONS[exp.category] || '💰'
                    : CATEGORY_EMOJIS[exp.category] || '📦';

                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition border border-slate-100/90 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/60 text-yellow-800 dark:text-yellow-300 text-xs font-black shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                              {exp.description || exp.category}
                            </p>
                            {isInc && (
                              <span className="inline-flex items-center text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                                Income
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {exp.category}
                            {exp.platform ? ` • ${exp.platform}` : ''}
                            {exp.payment_method ? ` • ${exp.payment_method}` : ''}
                            {exp.time ? ` • ${exp.time}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black whitespace-nowrap ${
                            isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isInc ? '+' : '-'}₹{Number(exp.amount).toLocaleString('en-IN')}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(exp)}
                            className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200/80 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-200 transition active:scale-90 cursor-pointer shadow-2xs"
                            title="Edit transaction"
                            aria-label="Edit transaction"
                          >
                            <Pencil size={12} strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/70 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-300 transition active:scale-90 cursor-pointer shadow-2xs"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={12} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
{/* ════════ VIEW 2: AGENDA TIMELINE LIST ════════ */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Transactions Timeline ({monthLabel})
            </h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {filteredExpenses.length} transactions
            </span>
          </div>

          {monthAgendaGroups.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No transactions recorded for this month.</p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 underline cursor-pointer"
              >
                + Add transaction
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {monthAgendaGroups.map(group => {
                const dateObj = new Date(group.dateStr + 'T00:00:00');
                const label = dateObj.toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
                const isGroupToday = group.dateStr === todayStr;

                return (
                  <div key={group.dateStr} className="space-y-1.5">
                    {/* Day Group Header */}
                    <div className="flex items-center justify-between text-xs font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700">
                      <span className="text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        {label}
                        {isGroupToday && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">
                            Today
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                        {group.spent > 0 && <span className="text-rose-600 dark:text-rose-400 mr-2">-₹{group.spent.toLocaleString('en-IN')}</span>}
                        {group.income > 0 && <span className="text-emerald-600 dark:text-emerald-400">+₹{group.income.toLocaleString('en-IN')}</span>}
                      </span>
                    </div>

                    {/* Day Items */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                      {group.items.map(exp => {
                        const isInc = isIncome(exp);
                        const icon = isInc
                          ? INCOME_CATEGORY_ICONS[exp.category] || '💰'
                          : CATEGORY_EMOJIS[exp.category] || '📦';

                        return (
                          <div
                            key={exp.id}
                            className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                                  isInc ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {icon}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {exp.description || exp.category}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  {exp.category} {exp.platform ? `• ${exp.platform}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`text-xs font-black ${
                                  isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {isInc ? '+' : '-'}₹{Number(exp.amount).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(exp)}
                                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                              >
                                <Trash2 size={12} />
                              </button>
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

      {/* ════════ Real Calendar & Indian Govt Holidays Modal ════════ */}
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
