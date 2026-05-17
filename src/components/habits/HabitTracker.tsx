import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Check, ChevronLeft, ChevronRight, Settings, Target, TrendingUp, Calendar, Flame } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Habit, HabitEntry, HabitSettings } from '../../types';
import { getDefaultHabitSettings } from '../../data/constants';
import HabitSettingsTab from './HabitSettings';

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
    return date.toISOString().split('T')[0];
  });
};

const CATEGORY_EMOJI: Record<string, string> = {
  health: '❤️', productivity: '⚡', fitness: '💪', learning: '📚', mindfulness: '🧘', other: '✨'
};

const HabitTracker: React.FC = () => {
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

  useEffect(() => { fetchAll(); }, [baseDate]);

  const fetchAll = async () => {
    setLoading(true);
    const { data: h } = await supabase.from('habits').select('*').order('created_at', { ascending: true });
    if (h) setHabits(h);
    const { data: e } = await supabase.from('habit_entries').select('*').gte('date', weekDates[0]).lte('date', weekDates[6]);
    if (e) setEntries(e);
    const { data: setObj, error } = await supabase.from('habit_settings').select('*').limit(1).single();
    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultHabitSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase.from('habit_settings').insert({ settings_json: getDefaultHabitSettings() }).select().single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: HabitSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase.from('habit_settings').update({ settings_json: newSettings, updated_at: new Date().toISOString() }).eq('id', settingsId);
    }
  };

  const handleAddHabit = async () => {
    if (!form.name) return;
    await supabase.from('habits').insert({ name: form.name, frequency: form.frequency, category: form.category, target_count: 1 });
    setShowModal(false); setForm({ name: '', frequency: 'Daily', category: 'health' }); fetchAll();
  };

  const handleDeleteHabit = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id); fetchAll();
  };

  const toggleEntry = async (habitId: string, date: string) => {
    const existing = entries.find(e => e.habit_id === habitId && e.date === date);
    if (existing) {
      if (existing.completed) { await supabase.from('habit_entries').delete().eq('id', existing.id); }
      else { await supabase.from('habit_entries').update({ completed: true }).eq('id', existing.id); }
    } else {
      await supabase.from('habit_entries').insert({ habit_id: habitId, date, completed: true });
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

  const today = new Date().toISOString().split('T')[0];
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
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="module-subtabs">
        <button onClick={() => setActiveTab('home')} className={`module-subtab ${activeTab === 'home' ? 'active-habit' : ''}`}>
          <CheckSquare size={16} /> <span className="label-text">Dashboard</span>
        </button>
        <button onClick={() => setShowModal(true)} className="module-subtab" style={{ color: '#10b981' }}>
          <Plus size={16} /> <span className="label-text">Add Habit</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`module-subtab ${activeTab === 'settings' ? 'active-habit' : ''}`}>
          <Settings size={16} /> <span className="label-text">Settings</span>
        </button>
      </div>

      <div>
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Active Habits', value: habits.length, icon: '🎯', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
                { label: 'Done Today', value: `${todayCompleted}/${habits.length}`, icon: '✅', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
                { label: 'This Week', value: totalCompleted, icon: '📊', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
                { label: 'Completion', value: `${totalStreaks}%`, icon: '🔥', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 shadow-md text-white" style={{ background: s.gradient }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base">{s.icon}</div>
                    <span className="text-xs font-semibold text-white/80">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Week Navigation */}
            <div className="card-dark">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button className="btn-action" onClick={prevWeek}><ChevronLeft size={16} /></button>
                  <span className="text-sm font-bold text-gray-800">
                    {new Date(weekDates[0]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} — {new Date(weekDates[6]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button className="btn-action" onClick={nextWeek}><ChevronRight size={16} /></button>
                </div>
                <button onClick={goToday} className="text-xs text-emerald-600 font-bold hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 transition">Today</button>
              </div>
            </div>

            {/* Habit Grid */}
            <div className="card-dark !p-0 overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Week Header */}
                <div className="grid gap-1 p-3 pb-0" style={{ gridTemplateColumns: '1fr repeat(7, 44px) 44px' }}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider self-end pb-1">Habit</span>
                  {weekDates.map((d, i) => {
                    const isToday = d === today;
                    return (
                      <div key={d} className={`text-center rounded-lg py-1 ${isToday ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
                        <p className={`text-[10px] font-bold ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>{DAYS[i]}</p>
                        <p className={`text-xs font-bold ${isToday ? 'text-emerald-700' : 'text-gray-600'}`}>{new Date(d).getDate()}</p>
                      </div>
                    );
                  })}
                  <span className="text-[10px] font-bold text-gray-400 text-center self-end pb-1">🗑</span>
                </div>

                {habits.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="text-4xl mb-3 opacity-40">✅</div>
                    <h4 className="text-sm font-bold text-gray-800">No habits yet</h4>
                    <p className="text-xs text-gray-400 mt-1">Create your first habit to start tracking</p>
                  </div>
                ) : (
                  <div className="px-3 pb-3">
                    {habits.map(habit => {
                      const progress = getWeekProgress(habit.id);
                      return (
                        <div key={habit.id} className="grid gap-1 py-2 border-t border-gray-100 items-center" style={{ gridTemplateColumns: '1fr repeat(7, 44px) 44px' }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm">{CATEGORY_EMOJI[habit.category] || '✨'}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-800 truncate">{habit.name}</p>
                              <p className="text-[10px] text-gray-400">{progress}/7</p>
                            </div>
                          </div>
                          {weekDates.map(date => {
                            const checked = isChecked(habit.id, date);
                            return (
                              <div key={date} className="flex justify-center">
                                <button
                                  onClick={() => toggleEntry(habit.id, date)}
                                  className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all active:scale-90 ${
                                    checked
                                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200'
                                      : 'border-gray-200 hover:border-emerald-300 text-gray-300'
                                  }`}
                                >
                                  {checked && <Check size={16} strokeWidth={3} />}
                                </button>
                              </div>
                            );
                          })}
                          <div className="flex justify-center">
                            <button className="btn-action danger" style={{ width: 28, height: 28 }} onClick={() => handleDeleteHabit(habit.id)}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
            <div className="modal-header"><h3>Add New Habit</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full"><label className="form-label">Habit Name</label><input className="form-control-custom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Frequency</label><select className="form-control-custom" value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option>Daily</option><option>Weekly</option></select></div>
                <div className="form-group"><label className="form-label">Category</label><select className="form-control-custom" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{allCategories.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-submit green" onClick={handleAddHabit}>Add</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
