import React, { useMemo } from 'react';
import type { Routine, RoutineEntry } from '../../types';
import { Trophy, TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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
    const routineIds = new Set(routines.map(r => r.id));
    const filteredEntries = entries.filter(e => routineIds.has(e.routine_id) && e.completed);

    // Total completions
    const totalCompletions = filteredEntries.length;

    // Daily trend for Recharts
    const mStr = String(month + 1).padStart(2, '0');
    const dailyChartData = Array.from({ length: daysInMonth }, (_, idx) => {
      const dayNum = idx + 1;
      const dateStr = `${year}-${mStr}-${String(dayNum).padStart(2, '0')}`;
      const completed = filteredEntries.filter(e => e.date === dateStr).length;
      return { day: String(dayNum), completed };
    });

    // Routine Performance
    const performance = routines.map(r => {
      const completions = filteredEntries.filter(e => e.routine_id === r.id).length;
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

    return { totalCompletions, dailyChartData, topPerformers, needsWork, dailyCompletions, weeklyCompletions, monthlyCompletions, yearlyCompletions };
  }, [routines, entries, daysInMonth, month, year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Monthly Report: {monthName}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl inline-flex items-center justify-center shrink-0">
            <Target size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium truncate">Total Hit</p>
            <p className="text-xl font-bold text-slate-800">{stats.totalCompletions}</p>
          </div>
        </div>
        
        <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl inline-flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium truncate">Daily Hit</p>
            <p className="text-xl font-bold text-slate-800">{stats.dailyCompletions}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl inline-flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium truncate">Weekly Hit</p>
            <p className="text-xl font-bold text-slate-800">{stats.weeklyCompletions}</p>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 text-sky-700 rounded-xl inline-flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium truncate">Monthly Hit</p>
            <p className="text-xl font-bold text-slate-800">{stats.monthlyCompletions}</p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-3.5 sm:p-4 border border-slate-200 rounded-2xl shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl inline-flex items-center justify-center shrink-0">
            <Trophy size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-600 font-medium truncate">Yearly Hit</p>
            <p className="text-xl font-bold text-slate-800">{stats.yearlyCompletions}</p>
          </div>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-600 shrink-0" />
            <h3 className="font-bold text-sm sm:text-base text-slate-800">Daily Completion Trend</h3>
          </div>
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            {monthName}
          </span>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyChartData} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#475569', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                }}
                labelFormatter={(label: any) => `Day ${String(label)}`}
              />
              <Bar dataKey="completed" name="Completed" fill="#0891b2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-emerald-600 shrink-0" />
            <h3 className="font-bold text-slate-800">Top Performers</h3>
          </div>
          <div className="space-y-4">
            {stats.topPerformers.length > 0 ? stats.topPerformers.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between gap-2 text-sm mb-1.5">
                  <span className="font-medium text-slate-700 truncate">{p.name}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 shrink-0">
                    {p.completions} / {p.target}
                  </span>
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
            <TrendingDown size={20} className="text-rose-600 shrink-0" />
            <h3 className="font-bold text-slate-800">Needs Attention</h3>
          </div>
          <div className="space-y-4">
            {stats.needsWork.length > 0 ? stats.needsWork.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between gap-2 text-sm mb-1.5">
                  <span className="font-medium text-slate-700 truncate">{p.name}</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 shrink-0">
                    {p.completions} / {p.target}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-rose-500 h-2 rounded-full" 
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
