import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Routine, RoutineEntry } from '../../types';
import RoutineGrid from './RoutineGrid';
import RoutineReports from './RoutineReports';
import { Download, LayoutGrid, PieChart, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const RoutineTracker: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseDate, setBaseDate] = useState(new Date());
  
  const [view, setView] = useState<'grid' | 'reports'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'daily' | 'weekly'>('all');

  useEffect(() => {
    fetchData();
  }, [baseDate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch routines
    const { data: rData } = await supabase.from('routines').select('*').order('created_at', { ascending: true });
    if (rData) setRoutines(rData);

    // Calculate month boundaries for entries
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data: eData } = await supabase
      .from('routine_entries')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (eData) setEntries(eData);
    setLoading(false);
  };

  const handleToggle = async (routineId: string, dateStr: string, currentStatus: boolean) => {
    // Optimistic update
    if (currentStatus) {
      setEntries(prev => prev.filter(e => !(e.routine_id === routineId && e.date === dateStr)));
      
      // DB Delete
      const entry = entries.find(e => e.routine_id === routineId && e.date === dateStr);
      if (entry) {
        await supabase.from('routine_entries').delete().eq('id', entry.id);
      }
    } else {
      const newEntry = { id: crypto.randomUUID(), routine_id: routineId, date: dateStr, completed: true, created_at: new Date().toISOString() };
      setEntries(prev => [...prev, newEntry]);
      
      // DB Insert
      await supabase.from('routine_entries').insert({ routine_id: routineId, date: dateStr, completed: true });
    }
  };

  const prevMonth = () => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() - 1);
    setBaseDate(d);
  };

  const nextMonth = () => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + 1);
    setBaseDate(d);
  };

  const goToday = () => setBaseDate(new Date());

  const exportCSV = () => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: string[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = (month + 1).toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      days.push(`${year}-${mStr}-${dStr}`);
    }

    let csv = 'ACTION,' + days.join(',') + '\n';

    const filteredRoutines = getFilteredRoutines();

    filteredRoutines.forEach(routine => {
      let row = `"${routine.name}",`;
      let marks = days.map(d => {
        const entry = entries.find(e => e.routine_id === routine.id && e.date === d);
        return (entry && entry.completed) ? 'Yes' : '';
      });
      row += marks.join(',') + '\n';
      csv += row;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Routines_${year}_${month + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && routines.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getFilteredRoutines = () => {
    return routines.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFreq = filterFrequency === 'all' || r.frequency === filterFrequency;
      return matchesSearch && matchesFreq;
    });
  };

  const filteredRoutines = getFilteredRoutines();

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full lg:w-auto">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button
              onClick={() => setView('reports')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                view === 'reports' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <PieChart size={16} /> Reports
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <button onClick={prevMonth} className="p-1.5 text-slate-600 hover:bg-slate-200/50 rounded transition">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[90px] text-center">
              {baseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-1.5 text-slate-600 hover:bg-slate-200/50 rounded transition">
              <ChevronRight size={16} />
            </button>
            <button onClick={goToday} className="px-2.5 py-1 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 transition">
              Today
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-48"
            />
          </div>
          
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterFrequency}
              onChange={(e) => setFilterFrequency(e.target.value as any)}
              className="!pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none w-full sm:w-auto"
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily Only</option>
              <option value="weekly">Weekly Only</option>
            </select>
          </div>

          <button 
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm w-full sm:w-auto"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {view === 'grid' ? (
        <RoutineGrid 
          routines={filteredRoutines}
          entries={entries}
          baseDate={baseDate}
          onToggle={handleToggle}
        />
      ) : (
        <RoutineReports 
          routines={filteredRoutines}
          entries={entries}
          baseDate={baseDate}
        />
      )}
    </div>
  );
};

export default RoutineTracker;
