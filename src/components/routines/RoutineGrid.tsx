import React, { useMemo } from 'react';
import { Check, Calendar } from 'lucide-react';
import type { Routine, RoutineEntry } from '../../types';

interface RoutineGridProps {
  routines: Routine[];
  entries: RoutineEntry[];
  baseDate: Date;
  onToggle: (routineId: string, dateStr: string, currentStatus: boolean) => void;
}

const RoutineGrid: React.FC<RoutineGridProps> = ({ 
  routines, entries, baseDate, onToggle 
}) => {
  // Generate days for the current month of baseDate
  const days = useMemo(() => {
    const result = [];
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`; // YYYY-MM-DD
      const shortLabel = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }); // e.g., "18-Jan"
      result.push({ dateStr, shortLabel });
    }
    return result;
  }, [baseDate]);

  const dailyRoutines = routines.filter(r => r.frequency === 'daily');
  const weeklyRoutines = routines.filter(r => r.frequency === 'weekly');
  const monthlyRoutines = routines.filter(r => r.frequency === 'monthly');
  const yearlyRoutines = routines.filter(r => r.frequency === 'yearly');

  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();

  const renderRow = (routine: Routine, bgClass: string, textClass: string) => {
    return (
      <tr key={routine.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
        <td className={`p-2 border border-slate-200 dark:border-slate-800 sticky left-0 z-10 font-bold text-xs truncate max-w-[200px] ${bgClass} ${textClass}`}>
          {routine.name}
        </td>
        {days.map(d => {
          const isToday = d.dateStr === todayStr;
          const entry = entries.find(e => e.routine_id === routine.id && e.date === d.dateStr);
          const isChecked = entry ? entry.completed : false;

          return (
            <td key={d.dateStr} className={`p-1 border border-slate-200 dark:border-slate-800 text-center align-middle transition-colors ${
              isChecked ? 'bg-emerald-50 dark:bg-emerald-950/40' : isToday ? 'bg-slate-50 dark:bg-slate-800/40' : ''
            }`}>
              <button
                onClick={() => onToggle(routine.id, d.dateStr, isChecked)}
                className={`w-full h-8 flex items-center justify-center rounded-lg transition-all ${
                  isChecked 
                    ? 'bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                    : 'text-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-300 dark:hover:text-slate-600'
                }`}
              >
                {isChecked ? <Check size={16} strokeWidth={3} /> : '✓'}
              </button>
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold">Routine Checklist</h3>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 w-52 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                ACTION
              </th>
              {days.map(d => {
                const isToday = d.dateStr === todayStr;
                return (
                  <th key={d.dateStr} className={`p-2 font-bold text-center border border-slate-200 dark:border-slate-700 min-w-[70px] ${isToday ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    {d.shortLabel}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {dailyRoutines.length > 0 && dailyRoutines.map(r => renderRow(r, 'bg-emerald-100 dark:bg-emerald-950/80', 'text-emerald-950 dark:text-emerald-200'))}
            {weeklyRoutines.length > 0 && weeklyRoutines.map(r => renderRow(r, 'bg-amber-100 dark:bg-amber-950/80', 'text-amber-950 dark:text-amber-200'))}
            {monthlyRoutines.length > 0 && monthlyRoutines.map(r => renderRow(r, 'bg-sky-100 dark:bg-sky-950/80', 'text-blue-950 dark:text-sky-200'))}
            {yearlyRoutines.length > 0 && yearlyRoutines.map(r => renderRow(r, 'bg-purple-100 dark:bg-purple-950/80', 'text-purple-950 dark:text-purple-200'))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoutineGrid;
