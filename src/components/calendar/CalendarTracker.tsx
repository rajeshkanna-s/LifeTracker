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
import './CalendarTracker.css';

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

/** Crisp SVG Indian Tricolor Flag (never renders as broken "IN" letters on Windows) */
const TricolorFlagIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 16"
    style={{
      width: 15,
      height: 10,
      borderRadius: 2,
      overflow: 'hidden',
      border: '1px solid rgba(15, 23, 42, 0.12)',
      flexShrink: 0
    }}
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
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatLocalDate(new Date()));

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}`;

  const monthLabelFull = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const monthLabelShort = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const isViewingTodayMonth = todayStr.startsWith(monthPrefix);

  const filteredExpenses = useMemo(() => {
    if (typeFilter === 'all') return expenses;
    if (typeFilter === 'income') return expenses.filter(e => isIncome(e));
    return expenses.filter(e => !isIncome(e));
  }, [expenses, typeFilter]);

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
        isWeekend: colIdx === 5 || colIdx === 6
      });
    }

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
        isWeekend: colIdx === 5 || colIdx === 6
      });
    }

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
        isWeekend: colIdx === 5 || colIdx === 6
      });
    }

    return days;
  }, [year, month, todayStr]);

  const monthStats = useMemo(() => {
    let mIncome = 0;
    let mExpense = 0;
    let monthFilteredCount = 0;

    for (const exp of expenses) {
      if (!exp.date || !exp.date.startsWith(monthPrefix)) continue;
      if (isIncome(exp)) {
        mIncome += Number(exp.amount) || 0;
      } else {
        mExpense += Number(exp.amount) || 0;
      }
    }

    for (const exp of filteredExpenses) {
      if (exp.date && exp.date.startsWith(monthPrefix)) {
        monthFilteredCount += 1;
      }
    }

    const net = mIncome - mExpense;
    return { mIncome, mExpense, net, monthFilteredCount };
  }, [expenses, filteredExpenses, monthPrefix]);

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
        income: dayInc
      };
    });
  }, [filteredExpenses, monthPrefix]);

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

    if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        handleNextMonth();
      } else {
        handlePrevMonth();
      }
    }
  };

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
        date: data.date || selectedDateStr
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
        date: data.date || selectedDateStr
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const selectedDayNum = selectedDateObj.getDate().toString().padStart(2, '0');
  const selectedShortMonth = selectedDateObj.toLocaleDateString('en-US', { month: 'short' });
  const selectedWeekdayFull = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const selectedHoliday = findIndianHoliday(selectedDateStr);
  const isSelectedToday = selectedDateStr === todayStr;

  const renderTransactionRow = (exp: Expense) => {
    const isInc = isIncome(exp);
    const icon = getCategoryIcon(exp);
    const metaParts = [exp.category, exp.platform, exp.payment_method, exp.time].filter(Boolean);

    return (
      <div key={exp.id} className="cal-tx-row">
        <div className="cal-tx-left">
          <div className={`cal-tx-icon ${isInc ? 'income' : ''}`}>{icon}</div>
          <div className="cal-tx-info">
            <div className="cal-tx-title-line">
              <span className="cal-tx-title">{exp.description || exp.category}</span>
              {isInc && <span className="cal-tx-inc-tag">Income</span>}
            </div>
            <div className="cal-tx-sub">{metaParts.join(' • ')}</div>
          </div>
        </div>

        <div className="cal-tx-right">
          <span className={`cal-tx-amount ${isInc ? 'income' : ''}`}>
            {isInc ? '+' : '-'}₹{Number(exp.amount).toLocaleString('en-IN')}
          </span>
          <div className="cal-tx-actions">
            <button
              type="button"
              onClick={() => handleOpenEdit(exp)}
              className="cal-icon-btn"
              title="Edit transaction"
              aria-label="Edit transaction"
            >
              <Pencil size={13} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteExpense(exp.id)}
              className="cal-icon-btn delete"
              title="Delete transaction"
              aria-label="Delete transaction"
            >
              <Trash2 size={13} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cal-shell">
      {/* ════════ Card 1: Month Navigation + Summary + Filter ════════ */}
      <div className="cal-card">
        <div className="cal-top-bar">
          <div className="cal-month-nav">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="cal-nav-arrow"
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>

            <button
              type="button"
              onClick={handleGoToday}
              title="Jump to Today"
              className="cal-month-title-btn"
            >
              <span className="cal-month-title">
                <span className="cal-month-title-full">{monthLabelFull}</span>
                <span className="cal-month-title-short">{monthLabelShort}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="cal-nav-arrow"
            >
              <ChevronRight size={16} strokeWidth={2.4} />
            </button>

            {(!isViewingTodayMonth || !isSelectedToday) && (
              <button type="button" onClick={handleGoToday} className="cal-today-chip">
                Today
              </button>
            )}
          </div>

          <div className="cal-top-actions">
            <button
              type="button"
              onClick={() => setShowHolidayModal(true)}
              aria-label="Open Holidays Calendar"
              title="2020–2035 Indian Govt Holidays"
              className="cal-holidays-btn"
            >
              <TricolorFlagIcon />
              <span className="cal-holidays-label">Holidays</span>
            </button>

            <div className="cal-view-switch">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`cal-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Calendar Grid"
                aria-label="Calendar Grid"
              >
                <LayoutGrid size={14} strokeWidth={2.2} />
                <span className="cal-view-label">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`cal-view-btn ${viewMode === 'agenda' ? 'active' : ''}`}
                title="Timeline List"
                aria-label="Timeline List"
              >
                <List size={14} strokeWidth={2.2} />
                <span className="cal-view-label">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3-Column Spacious Cashflow Summary */}
        <div className="cal-summary-strip">
          <div className="cal-summary-item">
            <span className="cal-summary-label">Income</span>
            <span className="cal-summary-val income">
              +₹{monthStats.mIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="cal-summary-item">
            <span className="cal-summary-label">Expenses</span>
            <span className="cal-summary-val expense">
              ₹{monthStats.mExpense.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="cal-summary-item">
            <span className="cal-summary-label">Net Balance</span>
            <span className={`cal-summary-val ${monthStats.net >= 0 ? 'net-pos' : 'net-neg'}`}>
              {monthStats.net >= 0 ? '+' : '-'}₹{Math.abs(monthStats.net).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Centered Segmented Filter */}
        <div className="cal-filter-track">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`cal-filter-btn ${typeFilter === 'all' ? 'active-all' : ''}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`cal-filter-btn ${typeFilter === 'expense' ? 'active-expense' : ''}`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`cal-filter-btn ${typeFilter === 'income' ? 'active-income' : ''}`}
          >
            Income
          </button>
        </div>
      </div>

      {/* ════════ VIEW 1: MONTH CALENDAR GRID + SELECTED DAY ════════ */}
      {viewMode === 'grid' && (
        <>
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="cal-grid-card"
          >
            <div className="cal-weekdays">
              {DAYS_HEADER.map((d, idx) => (
                <div key={d} className={`cal-weekday ${idx === 5 || idx === 6 ? 'weekend' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="cal-days-grid">
              {calendarDays.map(cell => {
                const isSelected = cell.dateStr === selectedDateStr;
                const data = dateDataMap[cell.dateStr];
                const hasExpense = !!(data && data.expenseTotal > 0);
                const hasIncome = !!(data && data.incomeTotal > 0);
                const hasActivity = hasExpense || hasIncome;
                const cellHoliday = findIndianHoliday(cell.dateStr);

                const cellClasses = [
                  'cal-day-cell',
                  !cell.isCurrentMonth ? 'outside' : '',
                  cell.isWeekend ? 'weekend' : '',
                  hasActivity ? 'has-activity' : '',
                  cellHoliday ? 'holiday' : '',
                  cell.isToday ? 'today' : '',
                  isSelected ? 'selected' : ''
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => handleSelectCell(cell.dateStr, cell.isCurrentMonth)}
                    title={cellHoliday ? `${cellHoliday.name} • ${cell.dateStr}` : cell.dateStr}
                    className={cellClasses}
                  >
                    <span className="cal-day-num">{cell.dayNumber}</span>
                    <span className="cal-day-dots">
                      {hasIncome && <span className="cal-dot income" />}
                      {hasExpense && <span className="cal-dot expense" />}
                      {cellHoliday && <span className="cal-dot holiday" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="cal-grid-footer">
              <div className="cal-legend-items">
                <span className="cal-legend-item">
                  <span className="cal-dot income" />
                  <span>Income</span>
                </span>
                <span className="cal-legend-item">
                  <span className="cal-dot expense" />
                  <span>Expense</span>
                </span>
                <span className="cal-legend-item">
                  <span className="cal-dot holiday" />
                  <span>Holiday</span>
                </span>
              </div>
              <span className="cal-swipe-hint">
                {monthStats.monthFilteredCount} {monthStats.monthFilteredCount === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>

          {/* Selected Day Agenda Card */}
          <div className="cal-card">
            <div className="cal-agenda-header">
              <div className="cal-agenda-date-wrap">
                <div className={`cal-date-leaf ${isSelectedToday ? 'today' : ''}`}>
                  <span className="cal-leaf-month">{selectedShortMonth}</span>
                  <span className="cal-leaf-day">{selectedDayNum}</span>
                </div>

                <div className="cal-agenda-date-info">
                  <div className="cal-agenda-title-row">
                    <span className="cal-agenda-weekday">
                      {selectedWeekdayFull}, {selectedShortMonth} {selectedDateObj.getDate()}
                    </span>
                    {isSelectedToday && <span className="cal-agenda-today-badge">Today</span>}
                  </div>

                  <div className="cal-day-pills">
                    {selectedDayTotals.spent > 0 && (
                      <span className="cal-day-pill spent">
                        Spent ₹{selectedDayTotals.spent.toLocaleString('en-IN')}
                      </span>
                    )}
                    {selectedDayTotals.income > 0 && (
                      <span className="cal-day-pill income">
                        +₹{selectedDayTotals.income.toLocaleString('en-IN')}
                      </span>
                    )}
                    {selectedDayTotals.spent === 0 && selectedDayTotals.income === 0 && (
                      <span className="cal-day-empty-meta">No transactions on this date</span>
                    )}
                  </div>
                </div>
              </div>

              <button type="button" onClick={handleOpenAdd} className="cal-add-btn">
                <Plus size={15} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {selectedHoliday && (
              <div className="cal-holiday-banner">
                <div className="cal-holiday-banner-left">
                  <Sparkles size={15} color="#d97706" />
                  <span className="cal-holiday-banner-name">{selectedHoliday.name}</span>
                </div>
                <span className="cal-holiday-banner-tag">
                  {selectedHoliday.type === 'National Holiday' ? 'National' : 'Gazetted'}
                </span>
              </div>
            )}

            {selectedDayExpenses.length === 0 ? (
              <div className="cal-empty-day">
                <div className="cal-empty-icon">
                  <CalendarIcon size={17} />
                </div>
                <p className="cal-empty-text">
                  Nothing recorded for {selectedShortMonth} {selectedDateObj.getDate()}
                </p>
                <button type="button" onClick={handleOpenAdd} className="cal-empty-btn">
                  <Plus size={14} strokeWidth={2.4} />
                  <span>Add Expense or Income</span>
                </button>
              </div>
            ) : (
              <div className="cal-tx-list">
                {selectedDayExpenses.map(exp => renderTransactionRow(exp))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════ VIEW 2: TIMELINE AGENDA LIST ════════ */}
      {viewMode === 'agenda' && (
        <div className="cal-card">
          <div className="cal-agenda-header">
            <div className="cal-agenda-date-info">
              <span className="cal-agenda-weekday">{monthLabelFull} Timeline</span>
              <span className="cal-day-empty-meta">
                {monthStats.monthFilteredCount}{' '}
                {monthStats.monthFilteredCount === 1 ? 'transaction' : 'transactions'} recorded
              </span>
            </div>

            <button type="button" onClick={handleOpenAdd} className="cal-add-btn">
              <Plus size={15} strokeWidth={2.5} />
              <span>Add</span>
            </button>
          </div>

          {monthAgendaGroups.length === 0 ? (
            <div className="cal-empty-day">
              <div className="cal-empty-icon">
                <CalendarIcon size={17} />
              </div>
              <p className="cal-empty-text">No transactions recorded in {monthLabelFull}</p>
              <button type="button" onClick={handleOpenAdd} className="cal-empty-btn">
                <Plus size={14} strokeWidth={2.4} />
                <span>Add Transaction</span>
              </button>
            </div>
          ) : (
            <div className="cal-timeline-groups">
              {monthAgendaGroups.map(group => {
                const dateObj = new Date(group.dateStr + 'T00:00:00');
                const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayMonth = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                const isGroupToday = group.dateStr === todayStr;

                return (
                  <div key={group.dateStr} className="cal-timeline-group">
                    <div className="cal-timeline-day-bar">
                      <span className="cal-timeline-day-label">
                        <span>
                          {dayMonth} • {weekday}
                        </span>
                        {isGroupToday && <span className="cal-agenda-today-badge">Today</span>}
                      </span>

                      <div className="cal-day-pills">
                        {group.spent > 0 && (
                          <span className="cal-day-pill spent">
                            -₹{group.spent.toLocaleString('en-IN')}
                          </span>
                        )}
                        {group.income > 0 && (
                          <span className="cal-day-pill income">
                            +₹{group.income.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="cal-tx-list">
                      {group.items.map(exp => renderTransactionRow(exp))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
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

      {/* Indian Govt Holidays Modal */}
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
