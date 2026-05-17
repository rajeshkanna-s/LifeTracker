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

    return { totalCompletions, topPerformers, needsWork, dailyCompletions, weeklyCompletions };
  }, [routines, entries, daysInMonth]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Monthly Report: {monthName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Actions Completed</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalCompletions}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Daily Routines Hit</p>
            <p className="text-2xl font-bold text-slate-800">{stats.dailyCompletions}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Weekly Routines Hit</p>
            <p className="text-2xl font-bold text-slate-800">{stats.weeklyCompletions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-emerald-500" />
            <h3 className="font-bold text-slate-800">Top Performers</h3>
          </div>
          <div className="space-y-4">
            {stats.topPerformers.length > 0 ? stats.topPerformers.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className="text-slate-500">{p.completions} / {p.target}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, p.completionRate)}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No data for this month yet.</p>
            )}
          </div>
        </div>

        {/* Needs Work */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown size={20} className="text-rose-500" />
            <h3 className="font-bold text-slate-800">Needs Attention</h3>
          </div>
          <div className="space-y-4">
            {stats.needsWork.length > 0 ? stats.needsWork.map(p => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{p.name}</span>
                  <span className="text-slate-500">{p.completions} / {p.target}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-rose-400 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, p.completionRate)}%` }}
                  />
                </div>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No data for this month yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoutineReports;
