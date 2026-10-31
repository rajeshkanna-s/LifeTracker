import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Flag,
  Sparkles,
  Info
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
    return initialDate.toISOString().split('T')[0];
  });

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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
      const dStr = prevDate.toISOString().split('T')[0];
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

    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const dStr = nextDate.toISOString().split('T')[0];
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

  const handlePrevYear = () => setViewYear(y => Math.max(2020, y - 1));
  const handleNextYear = () => setViewYear(y => Math.min(2035, y + 1));

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
    setSelectedDateStr(now.toISOString().split('T')[0]);
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
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* ════════ Modal Header ════════ */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0284c7 100%)',
            padding: '16px 18px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CalendarIcon size={19} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  Real Calendar
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 7px',
                    borderRadius: '99px',
                    fontWeight: 700
                  }}
                >
                  Govt Holidays 🇮🇳
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', opacity: 0.9, margin: '2px 0 0 0' }}>
                All years (2020–2035) with Gazetted & National Holidays
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ════════ Modal Body ════════ */}
        <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }} className="space-y-3.5">
          {/* Year & Month Selectors */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Year selector with stepper */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevYear}
                title="Previous Year"
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>

              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                className="bg-transparent text-sm font-black text-slate-800 px-2 py-0.5 outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextYear}
                title="Next Year"
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* Quick Today Button */}
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95"
            >
              Today
            </button>

            {/* Month Stepper */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
              >
                <ChevronLeft size={15} />
              </button>

              <span className="text-xs font-black text-slate-800 px-2.5 min-w-[75px] text-center">
                {MONTH_NAMES[viewMonth]}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-2xs cursor-pointer"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick Month Bar (12 Months Pills) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {SHORT_MONTHS.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMonth(idx)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg shrink-0 transition cursor-pointer ${
                  viewMonth === idx
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* ════════ 7-Day Month Grid ════════ */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAY_LABELS.map((d, i) => (
                <span
                  key={d}
                  className={`text-[11px] font-black uppercase py-1 ${
                    i === 5 || i === 6 ? 'text-amber-600' : 'text-slate-500'
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
                    style={{ minHeight: '44px' }}
                    className={`relative p-1 rounded-xl flex flex-col items-center justify-center transition cursor-pointer select-none ${
                      isSelected
                        ? 'bg-teal-700 text-white font-black shadow-xs ring-2 ring-teal-500'
                        : isToday
                        ? 'bg-white text-teal-800 font-extrabold border-2 border-teal-500 shadow-2xs'
                        : cell.isCurrentMonth
                        ? hasHoliday
                          ? isNational
                            ? 'bg-orange-50 text-orange-950 font-extrabold border border-orange-200'
                            : 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                          : 'bg-white text-slate-800 hover:bg-slate-100 font-semibold'
                        : 'bg-transparent text-slate-300 font-normal'
                    }`}
                  >
                    <span className="text-xs leading-none">{cell.dayNum}</span>

                    {/* Holiday Dot / Indicator */}
                    {hasHoliday && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-1 ${
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

          {/* Selected Date Quick Banner */}
          {selectedDateStr && (
            <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Selected Date</span>
                <p className="text-xs font-black text-slate-800 mt-0.5 truncate">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                {selectedHoliday && (
                  <p className="text-[11px] font-bold text-orange-700 mt-0.5 flex items-center gap-1 truncate">
                    <span>🎉 {selectedHoliday.name}</span>
                    <span className="text-[10px] text-slate-400">({selectedHoliday.type})</span>
                  </p>
                )}
              </div>

              {onSelectDate && (
                <button
                  type="button"
                  onClick={() => handleApplyDate(selectedDateStr)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  View In Tracker
                </button>
              )}
            </div>
          )}

          {/* ════════ Month Indian Govt Holidays List ════════ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Flag size={13} className="text-orange-500" />
                <span>Govt Holidays in {MONTH_NAMES[viewMonth]} {viewYear}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full">
                  {monthHolidays.length}
                </span>
              </h4>
            </div>

            {monthHolidays.length === 0 ? (
              <div className="text-center py-5 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
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
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        selectedDateStr === h.date
                          ? 'bg-teal-50 border-teal-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center shrink-0 leading-none ${
                            isNational
                              ? 'bg-orange-100 text-orange-900 font-black border border-orange-200'
                              : 'bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-200'
                          }`}
                        >
                          <span className="text-[13px]">{dayNum}</span>
                          <span className="text-[8px] uppercase mt-0.5">{dayName}</span>
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-800 truncate leading-snug">
                            {h.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {h.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-1 rounded-md shrink-0 uppercase tracking-wide ${
                          isNational
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-emerald-100 text-emerald-800'
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

        {/* ════════ Modal Footer ════════ */}
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <span className="text-[11px] text-slate-400 font-medium">
            Tap any date to check holidays
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndianCalendarModal;
