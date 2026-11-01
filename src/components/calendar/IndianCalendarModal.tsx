import React, { useState, useMemo } from 'react';
import { formatLocalDate } from '../../utils/expenseUtils';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Flag,
  ArrowRight
} from 'lucide-react';
import {
  getIndianHolidaysForYear,
  getIndianHolidaysForMonth,
  findIndianHoliday,
  type IndianHoliday
} from '../../data/indianHolidays';
import './CalendarTracker.css';

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

const TricolorBadgeIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 16"
    style={{ width: 15, height: 10, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}
    aria-hidden="true"
  >
    <rect width="24" height="5.33" y="0" fill="#FF9933" />
    <rect width="24" height="5.34" y="5.33" fill="#FFFFFF" />
    <rect width="24" height="5.33" y="10.67" fill="#138808" />
    <circle cx="12" cy="8" r="2" fill="none" stroke="#000080" strokeWidth="1.1" />
  </svg>
);

export const IndianCalendarModal: React.FC<IndianCalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  initialDate = new Date()
}) => {
  const [viewYear, setViewYear] = useState<number>(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => initialDate.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => formatLocalDate(initialDate));

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const availableYears = useMemo(() => {
    const list: number[] = [];
    for (let y = 2020; y <= 2035; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const monthHolidays = useMemo(() => {
    return getIndianHolidaysForMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const yearHolidaysMap = useMemo(() => {
    const all = getIndianHolidaysForYear(viewYear);
    const map = new Map<string, IndianHoliday>();
    for (const h of all) {
      map.set(h.date, h);
    }
    return map;
  }, [viewYear]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastDay.getDate();

    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const cells: {
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isWeekend: boolean;
      holiday?: IndianHoliday;
    }[] = [];

    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dNum);
      const dStr = formatLocalDate(prevDate);
      const col = cells.length % 7;
      cells.push({
        dateStr: dStr,
        dayNum: dNum,
        isCurrentMonth: false,
        isWeekend: col === 5 || col === 6,
        holiday: yearHolidaysMap.get(dStr)
      });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const col = cells.length % 7;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: true,
        isWeekend: col === 5 || col === 6,
        holiday: yearHolidaysMap.get(dStr)
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const dStr = formatLocalDate(nextDate);
      const col = cells.length % 7;
      cells.push({
        dateStr: dStr,
        dayNum: d,
        isCurrentMonth: false,
        isWeekend: col === 5 || col === 6,
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
    <div className="cal-modal-backdrop" onClick={onClose}>
      <div className="cal-modal-sheet" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cal-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CalendarIcon size={18} color="#ffffff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                  Calendar
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '4px 9px',
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.22)',
                    color: '#ffffff',
                    lineHeight: 1
                  }}
                >
                  <TricolorBadgeIcon />
                  <span>Holidays</span>
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.86)', marginTop: 3, fontWeight: 500 }}>
                2020–2035 Gazetted & National Holidays
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Close" className="cal-modal-close">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="cal-modal-body">
          {/* Month & Year Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={handlePrevMonth} className="cal-nav-arrow" title="Previous Month">
                <ChevronLeft size={16} />
              </button>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0f172a',
                  minWidth: 92,
                  textAlign: 'center'
                }}
              >
                {MONTH_NAMES[viewMonth]}
              </span>
              <button type="button" onClick={handleNextMonth} className="cal-nav-arrow" title="Next Month">
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                className="cal-year-select"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <button type="button" onClick={handleGoToday} className="cal-today-chip">
                Today
              </button>
            </div>
          </div>

          {/* Month Quick Pills */}
          <div className="cal-month-pills">
            {SHORT_MONTHS.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMonth(idx)}
                className={`cal-month-pill ${viewMonth === idx ? 'active' : ''}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Centered Calendar Grid */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 18,
              padding: '12px 8px 10px 8px'
            }}
          >
            <div className="cal-weekdays">
              {DAY_LABELS.map((d, i) => (
                <div key={d} className={`cal-weekday ${i === 5 || i === 6 ? 'weekend' : ''}`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="cal-days-grid">
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === todayStr;
                const hasHoliday = !!cell.holiday;

                const cellClasses = [
                  'cal-day-cell',
                  !cell.isCurrentMonth ? 'outside' : '',
                  cell.isWeekend ? 'weekend' : '',
                  hasHoliday ? 'holiday' : '',
                  isToday ? 'today' : '',
                  isSelected ? 'selected' : ''
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    onClick={() => handleDayClick(cell)}
                    title={cell.holiday ? `${cell.holiday.name} (${cell.holiday.type})` : cell.dateStr}
                    className={cellClasses}
                  >
                    <span className="cal-day-num">{cell.dayNum}</span>
                    <span className="cal-day-dots">
                      {hasHoliday && <span className="cal-dot holiday" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Action Bar */}
          {selectedDateStr && (
            <div className="cal-modal-selected-bar">
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#94a3b8'
                  }}
                >
                  Selected Date
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                {selectedHoliday && (
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#d97706', marginTop: 3 }}>
                    🎉 {selectedHoliday.name}
                  </div>
                )}
              </div>

              {onSelectDate && (
                <button
                  type="button"
                  onClick={() => handleApplyDate(selectedDateStr)}
                  className="cal-add-btn"
                >
                  <span>Open Day</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Holidays List for Current Month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flag size={13} color="#f59e0b" />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#334155' }}>
                Holidays in {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#fef3c7',
                  color: '#92400e'
                }}
              >
                {monthHolidays.length}
              </span>
            </div>

            {monthHolidays.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '16px 12px',
                  borderRadius: 13,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                  color: '#94a3b8',
                  fontWeight: 600
                }}
              >
                No Gazetted Holidays in {MONTH_NAMES[viewMonth]} {viewYear}
              </div>
            ) : (
              monthHolidays.map(h => {
                const hDate = new Date(h.date + 'T00:00:00');
                const dayName = hDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = hDate.getDate();
                const isNational = h.type === 'National Holiday';

                return (
                  <div
                    key={h.date + h.name}
                    onClick={() => setSelectedDateStr(h.date)}
                    className={`cal-holiday-list-item ${selectedDateStr === h.date ? 'selected' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          minWidth: 38,
                          borderRadius: 11,
                          background: isNational ? '#ffedd5' : '#ecfdf5',
                          border: `1px solid ${isNational ? '#fed7aa' : '#a7f3d0'}`,
                          color: isNational ? '#9a3412' : '#065f46',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 800 }}>{dayNum}</span>
                        <span style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                          {dayName}
                        </span>
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: '#0f172a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {h.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#64748b',
                            marginTop: 2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {h.description}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '4px 8px',
                        borderRadius: 7,
                        background: isNational ? '#ffedd5' : '#d1fae5',
                        color: isNational ? '#9a3412' : '#065f46',
                        flexShrink: 0,
                        lineHeight: 1
                      }}
                    >
                      {isNational ? 'National' : 'Gazetted'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="cal-modal-footer">
          <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
            Tap any date to check holidays
          </span>
          <button type="button" onClick={onClose} className="cal-modal-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndianCalendarModal;
