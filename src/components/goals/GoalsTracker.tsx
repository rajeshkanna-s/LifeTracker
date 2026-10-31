import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  Trophy,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Pencil,
  Trash2,
  X,
  Calendar,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { SavingsGoal, ExpenseSettings } from '../../types';
import { getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';

const PRESET_GOALS = [
  { name: 'New Vehicle', icon: '🚗', color: '#0284c7', defaultTarget: 150000 },
  { name: 'Holiday Trip', icon: '🏖️', color: '#10b981', defaultTarget: 50000 },
  { name: 'Emergency Fund', icon: '🛡️', color: '#f59e0b', defaultTarget: 100000 },
  { name: 'New Home', icon: '🏡', color: '#8b5cf6', defaultTarget: 500000 },
  { name: 'Education', icon: '🎓', color: '#06b6d4', defaultTarget: 75000 },
  { name: 'Health Care', icon: '🏥', color: '#ef4444', defaultTarget: 50000 }
];

export const GoalsTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Active / Paused / Reached tab (matches screenshot)
  const [goalTab, setGoalTab] = useState<'active' | 'paused' | 'reached'>('active');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(50000);
  const [savedAmount, setSavedAmount] = useState<number>(0);
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    return d.toISOString().split('T')[0];
  });
  const [color, setColor] = useState('#f59e0b');
  const [icon, setIcon] = useState('🎯');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [activePartnerId]);

  const fetchGoals = async () => {
    setLoading(true);
    const { data: setObj } = await supabase
      .from('expense_settings')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const defaults = getDefaultExpenseSettings(activePartnerId);
    if (setObj) {
      setSettingsId(setObj.id);
      const sJson = setObj.settings_json || {};
      setSettings({ ...defaults, ...sJson });
      if (sJson.customGoals && sJson.customGoals.length > 0) {
        setGoals(sJson.customGoals);
      } else {
        // Initial sample goals if none exist
        setGoals([
          {
            id: 'g-1',
            name: 'Emergency Fund',
            targetAmount: 100000,
            savedAmount: 35000,
            deadline: '2026-12-31',
            icon: '🛡️',
            color: '#f59e0b',
            status: 'active'
          },
          {
            id: 'g-2',
            name: 'Holiday Trip to Goa',
            targetAmount: 40000,
            savedAmount: 22000,
            deadline: '2026-11-20',
            icon: '🏖️',
            color: '#10b981',
            status: 'active'
          }
        ]);
      }
    } else {
      setSettings(defaults);
    }
    setLoading(false);
  };

  const persistGoals = async (updated: SavingsGoal[]) => {
    setGoals(updated);
    const newSettings = { ...settings, customGoals: updated };
    setSettings(newSettings);
    if (settingsId) {
      await supabase
        .from('expense_settings')
        .update({
          settings_json: newSettings,
          partner_id: activePartnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId)
        .eq('partner_id', activePartnerId);
    } else {
      const { data } = await supabase
        .from('expense_settings')
        .upsert({
          partner_id: activePartnerId,
          settings_json: newSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (data) setSettingsId(data.id);
    }
  };

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const isReached = g.savedAmount >= g.targetAmount;
      if (goalTab === 'reached') return g.status === 'reached' || isReached;
      if (goalTab === 'paused') return g.status === 'paused' && !isReached;
      return (g.status === 'active' || !g.status) && !isReached;
    });
  }, [goals, goalTab]);

  const handleOpenAdd = (preset?: typeof PRESET_GOALS[0]) => {
    setEditingGoal(null);
    if (preset) {
      setName(preset.name);
      setTargetAmount(preset.defaultTarget);
      setIcon(preset.icon);
      setColor(preset.color);
    } else {
      setName('');
      setTargetAmount(50000);
      setIcon('🎯');
      setColor('#f59e0b');
    }
    setSavedAmount(0);
    setNote('');
    setShowModal(true);
  };

  const handleOpenEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(g.targetAmount);
    setSavedAmount(g.savedAmount);
    setDeadline(g.deadline || '');
    setColor(g.color || '#f59e0b');
    setIcon(g.icon || '🎯');
    setNote(g.note || '');
    setShowModal(true);
  };

  const handleSaveGoal = async () => {
    if (!name.trim() || targetAmount <= 0) return;

    if (editingGoal) {
      const updated = goals.map(g =>
        g.id === editingGoal.id
          ? {
            ...g,
            name: name.trim(),
            targetAmount,
            savedAmount,
            deadline,
            color,
            icon,
            note,
            status: savedAmount >= targetAmount ? 'reached' : g.status || 'active'
          }
          : g
      );
      await persistGoals(updated);
    } else {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}`,
        name: name.trim(),
        targetAmount,
        savedAmount,
        deadline,
        color,
        icon,
        note,
        status: savedAmount >= targetAmount ? 'reached' : 'active'
      };
      await persistGoals([...goals, newGoal]);
    }
    setShowModal(false);
  };

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Delete this savings goal?')) {
      const updated = goals.filter(g => g.id !== id);
      await persistGoals(updated);
    }
  };

  const handleDeposit = async () => {
    if (!showDepositModal || depositAmount <= 0) return;

    const updated = goals.map(g => {
      if (g.id === showDepositModal.id) {
        const nextSaved = g.savedAmount + depositAmount;
        return {
          ...g,
          savedAmount: nextSaved,
          status: nextSaved >= g.targetAmount ? 'reached' : g.status
        };
      }
      return g;
    });

    await persistGoals(updated);
    setShowDepositModal(null);
    setDepositAmount(0);
  };

  const togglePauseGoal = async (g: SavingsGoal) => {
    const nextStatus = g.status === 'paused' ? 'active' : 'paused';
    const updated = goals.map(item => (item.id === g.id ? { ...item, status: nextStatus as any } : item));
    await persistGoals(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* ════════ Top Hero Banner (Sharp & Modern) ════════ */}
      <div
        className="rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Goals
              </h2>
              <p className="text-xs text-amber-100 font-semibold mt-0.5">
                Set targets & track savings progress
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            style={{ minHeight: '42px', whiteSpace: 'nowrap' }}
            className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-white text-amber-950 font-extrabold text-sm rounded-full shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* ════════ Preset Shortcuts (Matches "What are you saving for?") ════════ */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Quick Inspiration
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PRESET_GOALS.map(p => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleOpenAdd(p)}
              className="bg-white border border-slate-200/90 hover:border-amber-400 rounded-full px-3 py-2 flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-sm transition cursor-pointer group active:scale-95"
            >
              <span className="text-base group-hover:scale-110 transition-transform shrink-0">{p.icon}</span>
              <span className="text-[11px] font-extrabold text-slate-700 leading-tight whitespace-nowrap">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ════════ Goals Segment Bar (Active, Paused, Reached) ════════ */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full">
        <button
          type="button"
          onClick={() => setGoalTab('active')}
          className={`flex-1 py-1.5 text-xs font-extrabold rounded-full transition ${goalTab === 'active' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          Active ({goals.filter(g => g.savedAmount < g.targetAmount && g.status !== 'paused').length})
        </button>
        <button
          type="button"
          onClick={() => setGoalTab('paused')}
          className={`flex-1 py-1.5 text-xs font-extrabold rounded-full transition ${goalTab === 'paused' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          Paused ({goals.filter(g => g.status === 'paused' && g.savedAmount < g.targetAmount).length})
        </button>
        <button
          type="button"
          onClick={() => setGoalTab('reached')}
          className={`flex-1 py-1.5 text-xs font-extrabold rounded-full transition ${goalTab === 'reached' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
        >
          Reached ({goals.filter(g => g.savedAmount >= g.targetAmount || g.status === 'reached').length})
        </button>
      </div>

      {/* ════════ Goals List ════════ */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-6 space-y-2">
          <div className="text-3xl opacity-50">🎯</div>
          <h4 className="text-sm font-bold text-slate-800">No {goalTab} goals</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {goalTab === 'active'
              ? 'Save for your goals! Tap the New Goal button or one of the presets above to create your first goal.'
              : `Goals marked as ${goalTab} will appear here.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredGoals.map(g => {
            const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
            const isCompleted = pct >= 100;

            return (
              <div
                key={g.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-sm transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-50 text-2xl flex items-center justify-center shrink-0 border border-amber-100 shadow-2xs">
                      {g.icon || '🎯'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 leading-snug break-words">
                        {g.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        Target: {g.deadline ? `Target ${new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Ongoing'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePauseGoal(g)}
                      title={g.status === 'paused' ? 'Resume Goal' : 'Pause Goal'}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-amber-600 transition cursor-pointer active:scale-95"
                    >
                      {g.status === 'paused' ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(g)}
                      aria-label="Edit goal"
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer active:scale-95"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      aria-label="Delete goal"
                      className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 hover:text-rose-700 transition cursor-pointer active:scale-95"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-amber-800 font-extrabold">
                      ₹{g.savedAmount.toLocaleString()} saved ({pct}%)
                    </span>
                    <span className="text-slate-500 font-semibold">
                      Goal: ₹{g.targetAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full transition-all duration-300 rounded-full ${isCompleted
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                        }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold mt-2.5 pt-1">
                    <span className="text-slate-500 font-medium">
                      {isCompleted ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Target Achieved!
                        </span>
                      ) : (
                        `₹${(g.targetAmount - g.savedAmount).toLocaleString()} more needed`
                      )}
                    </span>

                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDepositModal(g);
                          setDepositAmount(0);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-full shadow-xs active:scale-95 transition cursor-pointer"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                        <span>Add Funds</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ Add / Edit Goal Modal ════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. New Vehicle, Holiday trip, Education"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={e => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Saved Already (₹)</label>
                  <input
                    type="number"
                    value={savedAmount}
                    onChange={e => setSavedAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Desired Date</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base text-center font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Notes or monthly savings target"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
                className="flex-1 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                style={{
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.28)'
                }}
                className="flex-1 rounded-xl text-white font-bold text-xs active:scale-98 transition cursor-pointer"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Add Funds Modal ════════ */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span>{showDepositModal.icon}</span> Add Funds to {showDepositModal.name}
              </h3>
              <button
                type="button"
                onClick={() => setShowDepositModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={depositAmount || ''}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-lg font-black text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {[1000, 2000, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shrink-0 cursor-pointer"
                  >
                    +₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDepositModal(null)}
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
                className="flex-1 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeposit}
                disabled={depositAmount <= 0}
                style={{
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.28)'
                }}
                className="flex-1 rounded-xl disabled:opacity-50 text-white font-bold text-xs active:scale-98 transition cursor-pointer"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTracker;

