import React, { useMemo } from 'react';
import { Check, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
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

  const todayStr = new Date().toISOString().split('T')[0];

  const renderRow = (routine: Routine, bgClass: string, textClass: string) => {
    return (
      <tr key={routine.id} className="hover:bg-slate-50/50 transition">
        <td className={`p-2 border border-slate-200 sticky left-0 z-10 font-bold text-xs truncate max-w-[200px] ${bgClass} ${textClass}`}>
          {routine.name}
        </td>
        {days.map(d => {
          const isToday = d.dateStr === todayStr;
          const entry = entries.find(e => e.routine_id === routine.id && e.date === d.dateStr);
          const isChecked = entry ? entry.completed : false;

          return (
            <td key={d.dateStr} className={`p-1 border border-slate-200 text-center align-middle transition-colors ${
              isChecked ? 'bg-emerald-50' : isToday ? 'bg-slate-50' : ''
            }`}>
              <button
                onClick={() => onToggle(routine.id, d.dateStr, isChecked)}
                className={`w-full h-8 flex items-center justify-center rounded-lg transition-all ${
                  isChecked 
                    ? 'bg-emerald-100/80 text-emerald-700 font-bold shadow-sm'
                    : 'text-transparent hover:bg-slate-100 hover:text-slate-300'
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <Calendar size={18} className="text-emerald-600" />
          <h3 className="text-sm font-bold">Routine Checklist</h3>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-2 font-bold text-slate-700 border border-slate-200 sticky left-0 bg-slate-100 z-20 w-52 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                ACTION
              </th>
              {days.map(d => {
                const isToday = d.dateStr === todayStr;
                return (
                  <th key={d.dateStr} className={`p-2 font-bold text-center border border-slate-200 min-w-[70px] ${isToday ? 'bg-blue-100 text-blue-800' : 'text-slate-700'}`}>
                    {d.shortLabel}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {dailyRoutines.length > 0 && dailyRoutines.map(r => renderRow(r, 'bg-emerald-100', 'text-emerald-950'))}
            {weeklyRoutines.length > 0 && weeklyRoutines.map(r => renderRow(r, 'bg-amber-100', 'text-amber-950'))}
            {monthlyRoutines.length > 0 && monthlyRoutines.map(r => renderRow(r, 'bg-sky-100', 'text-blue-950'))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoutineGrid;
