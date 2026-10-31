import React, { useState, useMemo } from 'react';
import { formatLocalDate } from '../../utils/expenseUtils';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Flag,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  getIndianHolidaysForYear,
  getIndianHolidaysForMonth,
  findIndianHoliday,
  type IndianHoliday
} from '../../data/indianHolidays';

interface IndianCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (dateStr: string) => void;
  initialDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const IndianCalendarModal: React.FC<IndianCalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  initialDate = new Date()
}) => {
  const [viewYear, setViewYear] = useState<number>(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => initialDate.getMonth()); // 0-11
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return formatLocalDate(initialDate);
  });

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Available years: 2020 through 2035
  const availableYears = useMemo(() => {
    const list: number[] = [];
    for (let y = 2020; y <= 2035; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Holidays for current view month
  const monthHolidays = useMemo(() => {
    return getIndianHolidaysForMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // Holidays dictionary for the whole year for fast lookup in grid
  const yearHolidaysMap = useMemo(() => {
    const all = getIndianHolidaysForYear(viewYear);
    const map = new Map<string, IndianHoliday>();
    for (const h of all) {
      map.set(h.date, h);
    }
    return map;
  }, [viewYear]);

  // Calendar matrix calculation for viewYear and viewMonth
  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    // Day of week: 0=Sun, 1=Mon, ..., 6=Sat. Convert so Mon=0, Sun=6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean; holiday?: IndianHoliday }[] = [];

    // Previous month filler days
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dNum);
      const dStr = formatLocalDate(prevDate);
      cells.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        holiday: yearHolidaysMap.get(dStr)
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        holiday: yearHolidaysMap.get(dStr)
      });
    }

    // Next month filler days to complete standard 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const dStr = formatLocalDate(nextDate);
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: false,
        holiday: yearHolidaysMap.get(dStr)
      });
    }

    return cells;
  }, [viewYear, viewMonth, yearHolidaysMap]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => Math.max(2020, y - 1));
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => Math.min(2035, y + 1));
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateStr(formatLocalDate(now));
  };

  const selectedHoliday = selectedDateStr ? findIndianHoliday(selectedDateStr) : undefined;

  const handleDayClick = (cell: { dateStr: string; dayNum: number; isCurrentMonth: boolean }) => {
    setSelectedDateStr(cell.dateStr);
    const clickedDate = new Date(cell.dateStr + 'T00:00:00');
    if (clickedDate.getMonth() !== viewMonth) {
      setViewMonth(clickedDate.getMonth());
      setViewYear(clickedDate.getFullYear());
    }
  };

  const handleApplyDate = (dStr: string) => {
    if (onSelectDate) {
      onSelectDate(dStr);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* ════════ Header ════════ */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CalendarIcon size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-extrabold text-white leading-tight">Calendar</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white leading-none">
                  🇮🇳 Holidays
                </span>
              </div>
              <p className="text-[11px] text-white/80 font-medium leading-tight mt-0.5">
                All years (2020–2035) with Gazetted & National Holidays
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition active:scale-90 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ════════ Body (Scrollable) ════════ */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3">
          {/* Navigation Bar (Month & Year) */}
          <div className="flex items-center justify-between gap-2">
            {/* Month Stepper */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs transition active:scale-90 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 px-3 text-center min-w-[84px]">
                {MONTH_NAMES[viewMonth]}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 shadow-2xs transition active:scale-90 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Year Selector & Today */}
            <div className="flex items-center gap-1.5">
              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleGoToday}
                className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>

          {/* Quick Month Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            {SHORT_MONTHS.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMonth(idx)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition active:scale-95 cursor-pointer ${
                  viewMonth === idx
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* ════════ Calendar Grid ════════ */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 sm:p-2.5">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAY_LABELS.map((d, i) => (
                <span
                  key={d}
                  className={`text-[10px] sm:text-[11px] font-bold uppercase py-1 ${
                    i === 5 || i === 6 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Date Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === todayStr;
                const hasHoliday = !!cell.holiday;
                const isNational = cell.holiday?.type === 'National Holiday';

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    onClick={() => handleDayClick(cell)}
                    title={cell.holiday ? `${cell.holiday.name} (${cell.holiday.type})` : cell.dateStr}
                    className={`aspect-square p-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer select-none relative ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-black shadow-sm ring-2 ring-emerald-400'
                        : isToday
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold border-2 border-emerald-500 shadow-2xs'
                        : cell.isCurrentMonth
                        ? hasHoliday
                          ? isNational
                            ? 'bg-orange-100/80 dark:bg-orange-950/50 text-orange-950 dark:text-orange-200 font-extrabold border border-orange-300 dark:border-orange-800'
                            : 'bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold border border-slate-200 dark:border-slate-700/80 shadow-2xs'
                        : 'bg-transparent text-slate-400 dark:text-slate-600 font-normal border-transparent'
                    }`}
                  >
                    <span className="text-xs leading-none">{cell.dayNum}</span>

                    {/* Holiday Indicator Dot */}
                    {hasHoliday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                          isSelected
                            ? 'bg-amber-300'
                            : isNational
                            ? 'bg-orange-600 animate-pulse'
                            : 'bg-emerald-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Inspector Card */}
          {selectedDateStr && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Selected Date</span>
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 truncate leading-tight">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
                {selectedHoliday && (
                  <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1 truncate">
                    <span>🎉 {selectedHoliday.name}</span>
                    <span className="text-[10px] text-slate-400">({selectedHoliday.type})</span>
                  </p>
                )}
              </div>

              {onSelectDate && (
                <button
                  type="button"
                  onClick={() => handleApplyDate(selectedDateStr)}
                  style={{ borderRadius: '12px' }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span>View in Tracker</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}

          {/* Holidays List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flag size={13} className="text-orange-500 shrink-0" />
                <span>Holidays in {MONTH_NAMES[viewMonth]} {viewYear}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 rounded-full">
                  {monthHolidays.length}
                </span>
              </h4>
            </div>

            {monthHolidays.length === 0 ? (
              <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No Gazetted Government Holidays in {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
            ) : (
              <div className="space-y-1.5">
                {monthHolidays.map(h => {
                  const hDate = new Date(h.date + 'T00:00:00');
                  const dayName = hDate.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = hDate.getDate();
                  const isNational = h.type === 'National Holiday';

                  return (
                    <div
                      key={h.date + h.name}
                      onClick={() => setSelectedDateStr(h.date)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2.5 ${
                        selectedDateStr === h.date
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 leading-none ${
                            isNational
                              ? 'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-200 font-black border border-orange-200 dark:border-orange-800'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-extrabold border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          <span className="text-[13px]">{dayNum}</span>
                          <span className="text-[8px] uppercase mt-0.5">{dayName}</span>
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-snug">
                            {h.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {h.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wide ${
                          isNational
                            ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        {isNational ? 'National' : 'Gazetted'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════════ Footer ════════ */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Tap any date to check holidays
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{ borderRadius: '12px' }}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndianCalendarModal;
