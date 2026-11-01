import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePartner } from '../../context/PartnerContext';
import type { Routine, RoutineEntry } from '../../types';
import RoutineGrid from './RoutineGrid';
import RoutineReports from './RoutineReports';
import { Download, LayoutGrid, PieChart, Search, Filter, ChevronLeft, ChevronRight, ChevronDown, ListChecks, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatLocalDate } from '../../utils/expenseUtils';

const RoutineTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
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
  }, [baseDate, activePartnerId]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch routines
    const { data: rData } = await supabase.from('routines').select('*').eq('partner_id', activePartnerId).order('created_at', { ascending: true });
    if (rData) setRoutines(rData);

    // Calculate month boundaries for entries
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const startDate = formatLocalDate(new Date(year, month, 1));
    const endDate = formatLocalDate(new Date(year, month + 1, 0));

    const { data: eData } = await supabase
      .from('routine_entries')
      .select('*')
      .eq('partner_id', activePartnerId)
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
        await supabase.from('routine_entries').delete().eq('id', entry.id).eq('partner_id', activePartnerId);
      }
    } else {
      const newEntry = { id: crypto.randomUUID(), routine_id: routineId, date: dateStr, completed: true, created_at: new Date().toISOString() };
      setEntries(prev => [...prev, newEntry]);
      
      // DB Insert
      await supabase.from('routine_entries').insert({ routine_id: routineId, date: dateStr, completed: true, partner_id: activePartnerId });
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
        .update({ name: formName.trim(), frequency: formFreq, partner_id: activePartnerId }).eq('partner_id', activePartnerId)
        .eq('id', editingRoutine.id);
      if (!error) {
        setShowModal(false);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('routines')
        .insert({ name: formName.trim(), frequency: formFreq, partner_id: activePartnerId });
      if (!error) {
        setShowModal(false);
        fetchData();
      }
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (confirm('Are you sure you want to delete this routine? This will delete all completion history as well.')) {
      await supabase.from('routine_entries').delete().eq('routine_id', id).eq('partner_id', activePartnerId);
      const { error } = await supabase.from('routines').delete().eq('id', id).eq('partner_id', activePartnerId);
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
    <div className="space-y-4 pb-24">
      {/* Top Controls */}
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-center bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full lg:w-auto">
          {/* View Toggle */}
          <div className="grid grid-cols-3 sm:flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              title="Grid View"
              aria-label="Grid View"
              onClick={() => setView('grid')}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                view === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <LayoutGrid size={15} className="shrink-0" /> <span>Grid</span>
            </button>
            <button
              type="button"
              title="Reports View"
              aria-label="Reports View"
              onClick={() => setView('reports')}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                view === 'reports' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <PieChart size={15} className="shrink-0" /> <span>Reports</span>
            </button>
            <button
              type="button"
              title="Manage Routines"
              aria-label="Manage Routines"
              onClick={() => setView('manage')}
              className={`inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                view === 'manage' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <ListChecks size={15} className="shrink-0" /> <span>Manage</span>
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-2 w-full sm:w-auto bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
            <button
              type="button"
              title="Previous month"
              aria-label="Previous month"
              onClick={prevMonth}
              className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:bg-slate-200/60 rounded-lg transition shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[90px] flex-1 sm:flex-none text-center">
              {baseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button
              type="button"
              title="Next month"
              aria-label="Next month"
              onClick={nextMonth}
              className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:bg-slate-200/60 rounded-lg transition shrink-0"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              title="Go to current month"
              aria-label="Go to current month"
              onClick={goToday}
              className="px-2.5 h-8 inline-flex items-center justify-center text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition shrink-0"
            >
              Today
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full lg:w-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="!pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-48"
            />
          </div>
          
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              aria-label="Filter by frequency"
              value={filterFrequency}
              onChange={(e) => setFilterFrequency(e.target.value as any)}
              className="!pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none w-full sm:w-auto cursor-pointer"
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily Only</option>
              <option value="weekly">Weekly Only</option>
              <option value="monthly">Monthly Only</option>
              <option value="yearly">Yearly Only</option>
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          <button 
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm w-full sm:w-auto"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Manage Routines</h3>
              <p className="text-xs text-slate-500 mt-0.5">Create, edit, or delete routines tracked in your checklist</p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition shadow-sm shrink-0 w-full sm:w-auto"
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
              <table className="w-full text-left text-xs min-w-[420px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase">
                    <th className="pb-2 pr-2">Routine Name</th>
                    <th className="pb-2 pr-2">Frequency</th>
                    <th className="pb-2 pr-2">Created At</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routines.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 pr-2 font-semibold text-slate-800">{r.name}</td>
                      <td className="py-3 pr-2">
                        <span className={`status-badge ${
                          r.frequency === 'daily' ? 'offer' :
                          r.frequency === 'weekly' ? 'interview' :
                          r.frequency === 'monthly' ? 'applied' : 'neutral'
                        }`}>
                          {r.frequency}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-slate-500 whitespace-nowrap">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(r)}
                            className="w-8 h-8 inline-flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Edit"
                            aria-label={`Edit ${r.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoutine(r.id)}
                            className="w-8 h-8 inline-flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                            aria-label={`Delete ${r.name}`}
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
              <button type="button" aria-label="Close modal" className="modal-close inline-flex items-center justify-center" onClick={() => setShowModal(false)}>✕</button>
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
                <button type="button" className="btn-cancel inline-flex items-center justify-center" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit cyan inline-flex items-center justify-center">{editingRoutine ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineTracker;
