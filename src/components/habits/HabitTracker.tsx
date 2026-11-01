import React, { useState, useEffect } from 'react';
import { formatLocalDate } from '../../utils/expenseUtils';
import { CheckSquare, Plus, Trash2, Check, ChevronLeft, ChevronRight, Settings, Target, TrendingUp, Calendar, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Habit, HabitEntry, HabitSettings } from '../../types';
import { getDefaultHabitSettings } from '../../data/constants';
import HabitSettingsTab from './HabitSettings';
import { usePartner } from '../../context/PartnerContext';

const CATEGORIES = ['health', 'productivity', 'fitness', 'learning', 'mindfulness', 'other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getWeekDates = (baseDate: Date): string[] => {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return formatLocalDate(date);
  });
};

const CATEGORY_EMOJI: Record<string, string> = {
  health: '❤️', productivity: '⚡', fitness: '💪', learning: '📚', mindfulness: '🧘', other: '✨'
};

const HabitTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [settings, setSettings] = useState<HabitSettings>(getDefaultHabitSettings());
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [baseDate, setBaseDate] = useState(new Date());
  const [form, setForm] = useState({ name: '', frequency: 'Daily', category: 'health' });

  const weekDates = getWeekDates(baseDate);

  useEffect(() => {
    setHabits([]);
    setEntries([]);
    fetchAll();
  }, [baseDate, activePartnerId]);

  const fetchAll = async () => {
    setLoading(true);
    setHabits([]);
    setEntries([]);
    const { data: h } = await supabase
      .from('habits')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('created_at', { ascending: true });

    if (h) setHabits(h.filter(item => !item.partner_id || item.partner_id === activePartnerId));
    else setHabits([]);

    const { data: e } = await supabase
      .from('habit_entries')
      .select('*')
      .eq('partner_id', activePartnerId)
      .gte('date', weekDates[0])
      .lte('date', weekDates[6]);

    if (e) setEntries(e.filter(item => !item.partner_id || item.partner_id === activePartnerId));
    else setEntries([]);

    const { data: setObj, error } = await supabase
      .from('habit_settings')
      .select('*')
      .eq('partner_id', activePartnerId)
      .limit(1)
      .single();

    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultHabitSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase
        .from('habit_settings')
        .insert({ settings_json: getDefaultHabitSettings(), partner_id: activePartnerId })
        .select()
        .single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: HabitSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase
        .from('habit_settings')
        .update({
          settings_json: newSettings,
          partner_id: activePartnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId)
        .eq('partner_id', activePartnerId);
    }
  };

  const handleAddHabit = async () => {
    if (!form.name) return;
    await supabase.from('habits').insert({
      name: form.name,
      frequency: form.frequency,
      category: form.category,
      target_count: 1,
      partner_id: activePartnerId
    });
    setShowModal(false); setForm({ name: '', frequency: 'Daily', category: 'health' }); fetchAll();
  };

  const handleDeleteHabit = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id).eq('partner_id', activePartnerId);
    fetchAll();
  };

  const toggleEntry = async (habitId: string, date: string) => {
    const existing = entries.find(e => e.habit_id === habitId && e.date === date);
    if (existing) {
      if (existing.completed) {
        await supabase.from('habit_entries').delete().eq('id', existing.id).eq('partner_id', activePartnerId);
      } else {
        await supabase.from('habit_entries').update({ completed: true }).eq('id', existing.id).eq('partner_id', activePartnerId);
      }
    } else {
      await supabase.from('habit_entries').insert({
        habit_id: habitId,
        date,
        completed: true,
        partner_id: activePartnerId
      });
    }
    fetchAll();
  };

  const isChecked = (habitId: string, date: string) => entries.some(e => e.habit_id === habitId && e.date === date && e.completed);

  const getWeekProgress = (habitId: string) => {
    return weekDates.filter(d => isChecked(habitId, d)).length;
  };

  const prevWeek = () => { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); };
  const nextWeek = () => { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); };
  const goToday = () => setBaseDate(new Date());

  const today = formatLocalDate(new Date());
  const totalCompleted = entries.filter(e => e.completed).length;
  const todayCompleted = entries.filter(e => e.completed && e.date === today).length;
  const totalStreaks = habits.length > 0 ? Math.round((totalCompleted / (habits.length * 7)) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const allCategories = [...CATEGORIES, ...(settings.customCategories || [])];

  return (
    <div className="space-y-4 pb-24">
      {/* Sub-tabs */}
      <div className="module-subtabs">
        <button
          type="button"
          title="Dashboard"
          aria-label="Dashboard"
          onClick={() => setActiveTab('home')}
          className={`module-subtab ${activeTab === 'home' ? 'active-habit' : ''}`}
        >
          <CheckSquare size={16} /> <span className="label-text">Dashboard</span>
        </button>
        <button
          type="button"
          title="Add Habit"
          aria-label="Add Habit"
          onClick={() => setShowModal(true)}
          className="module-subtab"
          style={{ color: '#059669' }}
        >
          <Plus size={16} /> <span className="label-text">Add Habit</span>
        </button>
        <button
          type="button"
          title="Settings"
          aria-label="Settings"
          onClick={() => setActiveTab('settings')}
          className={`module-subtab ${activeTab === 'settings' ? 'active-habit' : ''}`}
        >
          <Settings size={16} /> <span className="label-text">Settings</span>
        </button>
      </div>

      <div>
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active Habits', value: habits.length, icon: '🎯', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
                { label: 'Done Today', value: `${todayCompleted}/${habits.length}`, icon: '✅', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)' },
                { label: 'This Week', value: totalCompleted, icon: '📊', gradient: 'linear-gradient(135deg, #d97706, #ea580c)' },
                { label: 'Completion', value: `${totalStreaks}%`, icon: '🔥', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 shadow-md text-white" style={{ background: s.gradient }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg inline-flex items-center justify-center text-base shrink-0">{s.icon}</div>
                    <span className="text-xs font-semibold text-white/90">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Week Navigation */}
            <div className="card-dark">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <button type="button" aria-label="Previous week" title="Previous week" className="btn-action inline-flex items-center justify-center" onClick={prevWeek}><ChevronLeft size={16} /></button>
                  <span className="text-sm font-bold text-slate-800 text-center flex-1 sm:flex-none">
                    {new Date(weekDates[0]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(weekDates[6]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button type="button" aria-label="Next week" title="Next week" className="btn-action inline-flex items-center justify-center" onClick={nextWeek}><ChevronRight size={16} /></button>
                </div>
                <button type="button" onClick={goToday} className="w-full sm:w-auto inline-flex items-center justify-center text-xs text-emerald-700 font-bold hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 transition">Today</button>
              </div>
            </div>

            {/* Habit Grid */}
            <div className="card-dark !p-0 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="sticky left-0 bg-white z-10 text-left pl-3 pr-2 pt-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-[130px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] sm:shadow-none">
                      Habit
                    </th>
                    {weekDates.map((d, i) => {
                      const isToday = d === today;
                      return (
                        <th key={d} className="p-1.5 pt-3 pb-2 w-[44px] text-center font-normal">
                          <div className={`rounded-lg py-1 ${isToday ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                            <p className={`text-[10px] font-bold ${isToday ? 'text-emerald-600' : 'text-slate-500'}`}>{DAYS[i]}</p>
                            <p className={`text-xs font-bold ${isToday ? 'text-emerald-700' : 'text-slate-700'}`}>{new Date(d).getDate()}</p>
                          </div>
                        </th>
                      );
                    })}
                    <th className="pr-3 pl-1 pt-3 pb-2 w-[44px] text-center">
                      <span className="inline-flex items-center justify-center text-slate-400" aria-label="Delete column">
                        <Trash2 size={14} />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {habits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 px-4">
                        <div className="text-4xl mb-3 opacity-40">✅</div>
                        <h4 className="text-sm font-bold text-slate-800">No habits yet</h4>
                        <p className="text-xs text-slate-500 mt-1">Create your first habit to start tracking</p>
                      </td>
                    </tr>
                  ) : (
                    habits.map(habit => {
                      const progress = getWeekProgress(habit.id);
                      return (
                        <tr key={habit.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition">
                          <td className="sticky left-0 bg-white z-10 pl-3 pr-2 py-2.5 min-w-[130px] max-w-[160px] sm:max-w-[240px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] sm:shadow-none">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">{CATEGORY_EMOJI[habit.category] || '✨'}</span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate" title={habit.name}>{habit.name}</p>
                                <p className="text-[10px] text-slate-500">{progress}/7</p>
                              </div>
                            </div>
                          </td>
                          {weekDates.map(date => {
                            const checked = isChecked(habit.id, date);
                            return (
                              <td key={date} className="p-1 py-2 text-center align-middle">
                                <div className="flex justify-center">
                                  <button
                                    type="button"
                                    aria-label={`Mark ${habit.name} for ${date}`}
                                    onClick={() => toggleEntry(habit.id, date)}
                                    className={`w-9 h-9 rounded-xl border-2 inline-flex items-center justify-center transition-all active:scale-90 ${
                                      checked
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200'
                                        : 'border-slate-300 bg-white hover:border-emerald-400 text-slate-300'
                                    }`}
                                  >
                                    {checked && <Check size={16} strokeWidth={3} />}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                          <td className="pr-3 pl-1 py-2 text-center align-middle">
                            <div className="flex justify-center">
                              <button
                                type="button"
                                title="Delete habit"
                                aria-label={`Delete ${habit.name}`}
                                className="btn-action danger inline-flex items-center justify-center !w-8 !h-8"
                                onClick={() => handleDeleteHabit(habit.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <HabitSettingsTab settings={settings} habits={habits} onSettingsChange={handleSettingsChange} />
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Habit</h3>
              <button type="button" aria-label="Close modal" className="modal-close inline-flex items-center justify-center" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full"><label className="form-label">Habit Name</label><input className="form-control-custom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Frequency</label><select className="form-control-custom" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option>Daily</option><option>Weekly</option></select></div>
                <div className="form-group"><label className="form-label">Category</label><select className="form-control-custom" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{allCategories.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel inline-flex items-center justify-center" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="btn-submit green inline-flex items-center justify-center" onClick={handleAddHabit}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
