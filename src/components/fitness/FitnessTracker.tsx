import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Pencil, Flame, Clock, Scale, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Workout, FitnessSettings } from '../../types';
import { getDefaultFitnessSettings } from '../../data/constants';
import FitnessSettingsTab from './FitnessSettings';

const TYPES = ['Strength', 'Cardio', 'Yoga', 'HIIT', 'Walking', 'Running', 'Cycling', 'Swimming', 'Stretching', 'Other'];
const MOODS = ['💪 Great', '😊 Good', '😐 Okay', '😓 Tired', '😩 Exhausted'];
const TYPE_EMOJI: Record<string, string> = { Strength: '💪', Cardio: '🏃', Yoga: '🧘', HIIT: '🔥', Walking: '🚶', Running: '🏃', Cycling: '🚴', Swimming: '🏊', Stretching: '🤸', Other: '⚡' };

const FitnessTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [settings, setSettings] = useState<FitnessSettings>(getDefaultFitnessSettings());
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0], type: 'Strength', title: '',
    duration_min: '45', calories_burned: '300', body_weight: '70.0',
    mood: '', exercises: '', notes: ''
  });

  useEffect(() => { fetchWorkouts(); }, []);

  const fetchWorkouts = async () => {
    setLoading(true);
    const { data } = await supabase.from('workouts').select('*').order('date', { ascending: false });
    if (data) setWorkouts(data);
    const { data: setObj, error } = await supabase.from('fitness_settings').select('*').limit(1).single();
    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultFitnessSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase.from('fitness_settings').insert({ settings_json: getDefaultFitnessSettings() }).select().single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: FitnessSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase.from('fitness_settings').update({ settings_json: newSettings, updated_at: new Date().toISOString() }).eq('id', settingsId);
    }
  };

  const resetForm = () => {
    setForm({ date: new Date().toISOString().split('T')[0], type: 'Strength', title: '', duration_min: '45', calories_burned: '300', body_weight: '70.0', mood: '', exercises: '', notes: '' });
    setEditId(null);
  };

  const handleSubmit = async () => {
    const payload = {
      date: form.date, type: form.type, title: form.title,
      duration_min: Number(form.duration_min) || null, calories_burned: Number(form.calories_burned) || null,
      body_weight: Number(form.body_weight) || null, mood: form.mood, exercises: form.exercises, notes: form.notes
    };
    if (editId) { await supabase.from('workouts').update(payload).eq('id', editId); }
    else { await supabase.from('workouts').insert(payload); }
    setShowModal(false); resetForm(); fetchWorkouts();
  };

  const handleEdit = (w: Workout) => {
    setForm({ date: w.date, type: w.type || 'Strength', title: w.title || '', duration_min: String(w.duration_min || ''), calories_burned: String(w.calories_burned || ''), body_weight: String(w.body_weight || ''), mood: w.mood || '', exercises: w.exercises || '', notes: w.notes || '' });
    setEditId(w.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => { await supabase.from('workouts').delete().eq('id', id); fetchWorkouts(); };

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((s, w) => s + (Number(w.duration_min) || 0), 0);
  const totalCalories = workouts.reduce((s, w) => s + (Number(w.calories_burned) || 0), 0);
  const thisWeek = workouts.filter(w => {
    const diff = (new Date().getTime() - new Date(w.date).getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const allTypes = [...TYPES, ...(settings.customTypes || [])];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="module-subtabs">
        <button onClick={() => setActiveTab('home')} className={`module-subtab ${activeTab === 'home' ? 'active-fitness' : ''}`}>
          <Dumbbell size={16} /> <span className="label-text">Dashboard</span>
        </button>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="module-subtab" style={{ color: '#f97316' }}>
          <Plus size={16} /> <span className="label-text">Log Workout</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`module-subtab ${activeTab === 'settings' ? 'active-fitness' : ''}`}>
          <Settings size={16} /> <span className="label-text">Settings</span>
        </button>
      </div>

      <div>
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Workouts', value: totalWorkouts, icon: '💪', gradient: 'linear-gradient(135deg, #f97316, #fbbf24)' },
                { label: 'Total Duration', value: `${totalDuration}m`, icon: '⏱️', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
                { label: 'Calories Burned', value: totalCalories.toLocaleString(), icon: '🔥', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
                { label: 'This Week', value: thisWeek, icon: '📅', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
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

            {/* Workout List */}
            <div className="card-dark !p-0">
              <div className="flex items-center justify-between p-3">
                <h3 className="font-bold text-sm text-gray-900">Workout Log</h3>
                <span className="text-xs text-gray-400">{workouts.length} workouts</span>
              </div>
              {workouts.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="text-4xl mb-3 opacity-40">🏋️</div>
                  <h4 className="text-sm font-bold text-gray-800">No workouts logged</h4>
                  <p className="text-xs text-gray-400 mt-1">Start logging your fitness journey</p>
                </div>
              ) : (
                <div className="px-1">
                  {workouts.map(w => (
                    <div key={w.id} className="tx-item">
                      <div className="tx-icon" style={{ background: '#fff7ed' }}>
                        {TYPE_EMOJI[w.type] || '⚡'}
                      </div>
                      <div className="tx-details">
                        <p className="tx-amount">{w.title || w.type}</p>
                        <p className="tx-category">
                          {w.duration_min ? `${w.duration_min} min` : ''}{w.calories_burned ? ` · ${w.calories_burned} cal` : ''}{w.mood ? ` · ${w.mood}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-medium">{new Date(w.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <button className="btn-action" onClick={() => handleEdit(w)}><Pencil size={13} /></button>
                        <button className="btn-action danger" onClick={() => handleDelete(w.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <FitnessSettingsTab settings={settings} workouts={workouts} onSettingsChange={handleSettingsChange} />
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editId ? 'Edit Workout' : 'Log Workout'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-control-custom" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Type</label><select className="form-control-custom" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{allTypes.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="form-group full"><label className="form-label">Title (Optional)</label><input className="form-control-custom" placeholder="e.g. Chest Day, 5km Run..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Duration (min)</label><input type="number" className="form-control-custom" value={form.duration_min} onChange={e => setForm({ ...form, duration_min: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Calories Burned</label><input type="number" className="form-control-custom" value={form.calories_burned} onChange={e => setForm({ ...form, calories_burned: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Body Weight (kg)</label><input type="number" step="0.1" className="form-control-custom" value={form.body_weight} onChange={e => setForm({ ...form, body_weight: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Mood</label><select className="form-control-custom" value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })}><option value="">How did it feel?</option>{MOODS.map(m => <option key={m}>{m}</option>)}</select></div>
                <div className="form-group full"><label className="form-label">Exercises (One per line)</label><textarea className="form-control-custom" rows={3} placeholder={"Bench Press 3×10\nSquats 4×8\nPull-ups 3×12"} value={form.exercises} onChange={e => setForm({ ...form, exercises: e.target.value })} /></div>
                <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-control-custom" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-submit orange" onClick={handleSubmit}>{editId ? 'Update' : 'Log Workout'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FitnessTracker;
