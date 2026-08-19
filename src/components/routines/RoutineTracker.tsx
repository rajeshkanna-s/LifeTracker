import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Routine, RoutineEntry } from '../../types';
import RoutineGrid from './RoutineGrid';
import RoutineReports from './RoutineReports';
import { Download, LayoutGrid, PieChart, Search, Filter, ChevronLeft, ChevronRight, ListChecks, Plus, Pencil, Trash2 } from 'lucide-react';

const RoutineTracker: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseDate, setBaseDate] = useState(new Date());
  
  const [view, setView] = useState<'grid' | 'reports' | 'manage'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [formName, setFormName] = useState('');
  const [formFreq, setFormFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

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

  const openAddModal = () => {
    setEditingRoutine(null);
    setFormName('');
    setFormFreq('daily');
    setShowModal(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditingRoutine(routine);
    setFormName(routine.name);
    setFormFreq(routine.frequency);
    setShowModal(true);
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingRoutine) {
      const { error } = await supabase
        .from('routines')
        .update({ name: formName.trim(), frequency: formFreq })
        .eq('id', editingRoutine.id);
      if (!error) {
        setShowModal(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('routines')
        .insert({ name: formName.trim(), frequency: formFreq });
      if (!error) {
        setShowModal(false);
        fetchData();
      }
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (confirm('Are you sure you want to delete this routine? This will delete all completion history as well.')) {
      await supabase.from('routine_entries').delete().eq('routine_id', id);
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (!error) {
        fetchData();
      }
    }
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
            <button
              onClick={() => setView('manage')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                view === 'manage' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ListChecks size={16} /> Manage
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
              <option value="monthly">Monthly Only</option>
              <option value="yearly">Yearly Only</option>
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

      {view === 'grid' && (
        <RoutineGrid 
          routines={filteredRoutines}
          entries={entries}
          baseDate={baseDate}
          onToggle={handleToggle}
        />
      )}

      {view === 'reports' && (
        <RoutineReports 
          routines={filteredRoutines}
          entries={entries}
          baseDate={baseDate}
        />
      )}

      {view === 'manage' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Manage Routines</h3>
              <p className="text-xs text-slate-500 mt-0.5">Create, edit, or delete routines tracked in your checklist</p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              <Plus size={16} /> Add Routine
            </button>
          </div>

          {routines.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-bold text-slate-700">No routines defined</p>
              <p className="text-xs text-slate-500 mt-1">Create a routine to start tracking your actions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                    <th className="pb-2">Routine Name</th>
                    <th className="pb-2">Frequency</th>
                    <th className="pb-2">Created At</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routines.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-semibold text-slate-800">{r.name}</td>
                      <td className="py-3">
                        <span className={`status-badge ${
                          r.frequency === 'daily' ? 'offer' :
                          r.frequency === 'weekly' ? 'interview' :
                          r.frequency === 'monthly' ? 'applied' : 'rejected'
                        }`}>
                          {r.frequency}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRoutine(r.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRoutine ? 'Edit Routine' : 'Add New Routine'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveRoutine}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Routine Name *</label>
                    <input
                      type="text"
                      className="form-control-custom"
                      placeholder="e.g. Morning Meditation"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                    />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Frequency *</label>
                    <select
                      className="form-control-custom"
                      value={formFreq}
                      onChange={e => setFormFreq(e.target.value as any)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit cyan">{editingRoutine ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineTracker;
