import React, { useMemo } from 'react';
import type { Routine, RoutineEntry } from '../../types';
import { Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface RoutineReportsProps {
  routines: Routine[];
  entries: RoutineEntry[];
  baseDate: Date;
}

const RoutineReports: React.FC<RoutineReportsProps> = ({ routines, entries, baseDate }) => {
  const monthName = baseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const stats = useMemo(() => {
    // Total completions
    const totalCompletions = entries.length;

    // Routine Performance
    const performance = routines.map(r => {
      const completions = entries.filter(e => e.routine_id === r.id && e.completed).length;
      let target = 0;
      if (r.frequency === 'daily') {
        target = daysInMonth;
      } else if (r.frequency === 'weekly') {
        // Approximate 4 weeks in a month, default target 4. If name has number, try to parse
        const match = r.name.match(/(\d+)\s+[Tt]imes/);
        const weeklyTarget = match ? parseInt(match[1], 10) : 1;
        target = weeklyTarget * 4; 
      } else if (r.frequency === 'monthly') {
        target = 1;
      } else if (r.frequency === 'yearly') {
        target = 1;
      } else {
        target = 1;
      }
      
      const completionRate = target > 0 ? (completions / target) * 100 : 0;
      return { ...r, completions, target, completionRate };
    });

    performance.sort((a, b) => b.completionRate - a.completionRate);

    const topPerformers = performance.filter(p => p.completions > 0).slice(0, 5);
    const needsWork = [...performance].sort((a, b) => a.completionRate - b.completionRate).slice(0, 5);

    const dailyCompletions = performance.filter(p => p.frequency === 'daily').reduce((sum, p) => sum + p.completions, 0);
    const weeklyCompletions = performance.filter(p => p.frequency === 'weekly').reduce((sum, p) => sum + p.completions, 0);
    const monthlyCompletions = performance.filter(p => p.frequency === 'monthly').reduce((sum, p) => sum + p.completions, 0);
    const yearlyCompletions = performance.filter(p => p.frequency === 'yearly').reduce((sum, p) => sum + p.completions, 0);

    return { totalCompletions, topPerformers, needsWork, dailyCompletions, weeklyCompletions, monthlyCompletions, yearlyCompletions };
  }, [routines, entries, daysInMonth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Monthly Report: {monthName}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Total Hit</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.totalCompletions}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Daily Hit</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.dailyCompletions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Weekly Hit</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.weeklyCompletions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Monthly Hit</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.monthlyCompletions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Yearly Hit</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.yearlyCompletions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Top Performers</h3>
          </div>
          <div className="space-y-4">
            {stats.topPerformers.length > 0 ? stats.topPerformers.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{p.completions} / {p.target}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, p.completionRate)}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No data for this month yet.</p>
            )}
          </div>
        </div>

        {/* Needs Work */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={20} className="text-rose-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Needs Attention</h3>
          </div>
          <div className="space-y-4">
            {stats.needsWork.length > 0 ? stats.needsWork.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{p.completions} / {p.target}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-rose-400 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, p.completionRate)}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No data for this month yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineReports;
