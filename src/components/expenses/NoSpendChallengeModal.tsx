import React, { useState, useMemo } from 'react';
import {
  Flame,
  Trophy,
  Target,
  X,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { formatLocalDate } from '../../utils/expenseUtils';
import type { Expense, ExpenseSettings } from '../../types';

interface NoSpendChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
  settings: ExpenseSettings;
  onUpdateSettings?: (newSettings: Partial<ExpenseSettings>) => Promise<void>;
}

const BADGES = [
  { id: 'bronze', name: 'Bronze Saver', days: 3, icon: '🥉', color: '#cd7f32', desc: 'Achieved 3 No-Spend days' },
  { id: 'silver', name: 'Silver Streaker', days: 7, icon: '🥈', color: '#94a3b8', desc: 'Achieved 7 No-Spend days' },
  { id: 'gold', name: 'Gold Champion', days: 12, icon: '🥇', color: '#f59e0b', desc: 'Achieved 12 No-Spend days' },
  { id: 'diamond', name: 'Diamond Master', days: 18, icon: '💎', color: '#06b6d4', desc: 'Achieved 18+ No-Spend days' },
];

export const NoSpendChallengeModal: React.FC<NoSpendChallengeModalProps> = ({
  isOpen,
  onClose,
  expenses,
  settings,
  onUpdateSettings
}) => {
  const [targetDays, setTargetDays] = useState<number>(() => {
    return (settings as any).noSpendTargetDays || 10;
  });

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Calculate day-by-day spending for current month
  const daySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of expenses) {
      if (!e.date || !e.date.startsWith(monthPrefix)) continue;
      // Exclude income
      if (e.type === 'income' || (e.tags && /income/i.test(e.tags))) continue;
      map.set(e.date, (map.get(e.date) || 0) + Number(e.amount));
    }
    return map;
  }, [expenses, monthPrefix]);

  // Days so far up to today
  const currentDay = today.getDate();
  const noSpendDaysCount = useMemo(() => {
    let count = 0;
    for (let d = 1; d <= currentDay; d++) {
      const dStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      if (!daySpendMap.has(dStr) || (daySpendMap.get(dStr) || 0) === 0) {
        count++;
      }
    }
    return count;
  }, [currentDay, daySpendMap, monthPrefix]);

  // Calculate current consecutive streak ending today (or yesterday if today already has spend)
  const streak = useMemo(() => {
    let currentStreak = 0;
    for (let d = currentDay; d >= 1; d--) {
      const dStr = `${monthPrefix}-${String(d).padStart(2, '0')}`;
      const spent = daySpendMap.get(dStr) || 0;
      if (spent === 0) {
        currentStreak++;
      } else {
        // If today has spending, check if yesterday had a streak
        if (d === currentDay) continue;
        break;
      }
    }
    return currentStreak;
  }, [currentDay, daySpendMap, monthPrefix]);

  if (!isOpen) return null;

  const pct = Math.min(100, Math.round((noSpendDaysCount / targetDays) * 100));

  const handleSaveTarget = async (newVal: number) => {
    setTargetDays(newVal);
    if (onUpdateSettings) {
      await onUpdateSettings({ noSpendTargetDays: newVal } as any);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '500px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            padding: '20px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Flame size={22} className="text-yellow-300" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  No-Spend Challenge
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 7px',
                    borderRadius: '99px',
                    fontWeight: 800
                  }}
                >
                  {today.toLocaleDateString('en-US', { month: 'short' })}
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', opacity: 0.9, margin: '2px 0 0 0' }}>
                Build savings discipline & earn achievement badges
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
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }} className="space-y-4">
          {/* Main Streak & Target Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-orange-200/80 dark:border-orange-800/60 rounded-2xl p-3.5 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400 mb-1">
                <Flame size={18} className="animate-bounce" />
                <span className="text-[11px] font-black uppercase tracking-wider">Current Streak</span>
              </div>
              <p className="text-2xl font-black text-orange-950 dark:text-orange-200">{streak} {streak === 1 ? 'Day' : 'Days'}</p>
              <p className="text-[10px] text-orange-700/80 dark:text-orange-300 font-semibold mt-0.5">Consecutive Zero Spend</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
                <Target size={18} />
                <span className="text-[11px] font-black uppercase tracking-wider">Month Total</span>
              </div>
              <p className="text-2xl font-black text-emerald-950 dark:text-emerald-200">{noSpendDaysCount} / {targetDays}</p>
              <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300 font-semibold mt-0.5">{pct}% of Monthly Target</p>
            </div>
          </div>

          {/* Target Progress Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Trophy size={14} className="text-amber-500" /> Target Progress
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{pct}% Complete</span>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${pct}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all duration-300"
              />
            </div>

            {/* Target Selector */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Monthly Target:</span>
              <div className="flex items-center gap-1">
                {[5, 10, 15, 20].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSaveTarget(val)}
                    className={`px-2.5 py-0.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      targetDays === val
                        ? 'bg-orange-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Month Calendar Mini-Heatmap */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center justify-between">
              <span>{today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Grid</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize">
                🟢 Zero Spend • ⚪ Spent
              </span>
            </h4>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth }, (_, idx) => {
                const dayNum = idx + 1;
                const dStr = `${monthPrefix}-${String(dayNum).padStart(2, '0')}`;
                const isPastOrToday = dayNum <= currentDay;
                const spent = daySpendMap.get(dStr) || 0;
                const isNoSpend = isPastOrToday && spent === 0;

                return (
                  <div
                    key={dayNum}
                    title={`${dStr}: ${isPastOrToday ? (isNoSpend ? 'Zero Spend (No Spend Day!)' : `Spent ₹${spent.toLocaleString()}`) : 'Future Day'}`}
                    style={{ minHeight: '34px' }}
                    className={`rounded-xl flex flex-col items-center justify-center text-[11px] font-bold transition select-none ${
                      !isPastOrToday
                        ? 'bg-white/60 dark:bg-slate-800/30 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-800'
                        : isNoSpend
                        ? 'bg-emerald-500 text-white shadow-2xs font-black'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {isNoSpend && <CheckCircle2 size={9} strokeWidth={3} className="text-emerald-100 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges & Achievements */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-amber-500" />
              <span>Milestone Badges</span>
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {BADGES.map(b => {
                const isUnlocked = noSpendDaysCount >= b.days;

                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition ${
                      isUnlocked
                        ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/50 shadow-2xs'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="text-2xl shrink-0">{b.icon}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">{b.name}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {isUnlocked ? 'Unlocked 🎉' : `${b.days} days required`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoSpendChallengeModal;

