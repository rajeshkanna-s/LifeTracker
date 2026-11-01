import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Wallet,
  Users,
  Zap,
  CreditCard,
  Tag,
  Store,
  Target,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
  Check,
  Sliders,
  Sparkles
} from 'lucide-react';
import type { ExpenseSettings, QuickAddTemplate } from '../../types';
import {
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
  ALL_PLATFORMS,
  CATEGORY_EMOJIS
} from '../../data/constants';

interface ExpenseSettingsProps {
  settings: ExpenseSettings;
  onSettingsChange: (settings: ExpenseSettings) => void;
}

const Section: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  Icon: any;
  badge?: number | string;
  open: string;
  setOpen: (v: string) => void;
  children: React.ReactNode;
  color?: string;
}> = ({ id, title, subtitle, Icon, badge, open, setOpen, children, color = 'emerald' }) => {
  const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
    blue: { bg: 'bg-sky-50 text-sky-600', text: 'text-sky-600', badge: 'bg-sky-100 text-sky-800' },
    purple: { bg: 'bg-purple-50 text-purple-600', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-800' },
    amber: { bg: 'bg-amber-50 text-amber-600', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' },
    rose: { bg: 'bg-rose-50 text-rose-600', text: 'text-rose-600', badge: 'bg-rose-100 text-rose-800' },
    teal: { bg: 'bg-teal-50 text-teal-600', text: 'text-teal-600', badge: 'bg-teal-100 text-teal-800' },
    indigo: { bg: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-800' },
    cyan: { bg: 'bg-cyan-50 text-cyan-600', text: 'text-cyan-600', badge: 'bg-cyan-100 text-cyan-800' },
  };
  const c = colorMap[color] || colorMap.emerald;
  const isOpen = open === id;

  return (
    <div
      className={`border rounded-2xl bg-white transition-all duration-200 overflow-hidden ${
        isOpen
          ? 'border-violet-300 shadow-md ring-2 ring-violet-500/10'
          : 'border-slate-200/90 hover:border-slate-300 shadow-2xs'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(isOpen ? '' : id)}
        className="w-full flex items-center justify-between p-4 sm:p-4.5 hover:bg-slate-50/70 transition cursor-pointer text-left"
      >
        {/* Left: Icon + Title & Subtitle */}
        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
          <div className={`w-11 h-11 ${c.bg} rounded-2xl inline-flex items-center justify-center shrink-0 border border-slate-100/80 transition-transform ${isOpen ? 'scale-105' : ''}`}>
            <Icon size={20} className={c.text} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-900 text-sm leading-snug break-words">
              {title}
            </h4>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Badge + Chevron (PERFECT ALIGNMENT) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {badge !== undefined && (
            <span className={`${c.badge} text-[11px] font-black leading-none min-w-[24px] h-[22px] px-2 rounded-full inline-flex items-center justify-center shrink-0 shadow-2xs`}>
              {badge}
            </span>
          )}
          <div className={`w-8 h-8 rounded-full inline-flex items-center justify-center shrink-0 text-slate-400 transition-all duration-200 ${isOpen ? 'rotate-180 bg-slate-100 text-slate-700' : 'bg-slate-50 text-slate-500'}`}>
            <ChevronDown size={16} strokeWidth={2.4} />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 pt-2 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
};

const ExpenseSettingsTab: React.FC<ExpenseSettingsProps> = ({ settings, onSettingsChange }) => {
  const [open, setOpen] = useState('budget');
  const [newQuickAdd, setNewQuickAdd] = useState({ name: '', amount: '', category: '', platform: '', icon: '☕' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiFilter, setEmojiFilter] = useState<'all' | 'category'>('all');
  const [newCategory, setNewCategory] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [newMember, setNewMember] = useState('');
  const [newCatBudget, setNewCatBudget] = useState({ category: '', budget: '' });

  const updateSettings = (updates: Partial<ExpenseSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* ════════ Top Hero Banner (Sleek & Well-Proportioned) ════════ */}
      <div
        className="rounded-3xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm inline-flex items-center justify-center shrink-0 shadow-sm border border-white/20">
            <Sliders size={20} className="text-white" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              Expense Settings
            </h2>
            <p className="text-xs text-violet-100/90 font-medium mt-0.5">
              Customise budgets, categories & quick templates
            </p>
          </div>
        </div>
      </div>

      {/* ════════ GROUP 1: BUDGETS & ALERTS ════════ */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">
          Budgets & Alerts
        </p>
        <div className="space-y-3">
          {/* Monthly Budget & Alerts */}
          <Section
            id="budget"
            title="Monthly Budget & Alerts"
            subtitle="Overall monthly cap & high transaction alerts"
            Icon={Wallet}
            open={open}
            setOpen={setOpen}
            color="emerald"
          >
            <div className="space-y-3.5 pt-1">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Monthly Budget Limit (₹)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={settings.monthlyBudget || ''}
                    onChange={e => updateSettings({ monthlyBudget: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm font-extrabold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="50,000"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Set to 0 to disable overall monthly budget tracking.</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Big Expense Alert Threshold (₹)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={settings.bigExpenseLimit || ''}
                    onChange={e => updateSettings({ bigExpenseLimit: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm font-extrabold text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="2,000"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Transactions exceeding this amount will be visually highlighted.</p>
              </div>
            </div>
          </Section>

          {/* Category Budgets */}
          <Section
            id="catbudget"
            title="Category Budgets"
            subtitle="Individual monthly caps by category"
            Icon={Target}
            badge={(settings.categoryBudgets || []).length}
            open={open}
            setOpen={setOpen}
            color="rose"
          >
            <div className="space-y-3.5 pt-1">
              <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/90 space-y-3">
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">Set Limit for Category</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newCatBudget.category}
                    onChange={e => setNewCatBudget({ ...newCatBudget, category: e.target.value })}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">Select Category</option>
                    {[...DEFAULT_CATEGORIES, ...settings.customCategories]
                      .filter(c => !(settings.categoryBudgets || []).find(b => b.category === c))
                      .map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="number"
                    placeholder="Monthly Budget (₹)"
                    value={newCatBudget.budget}
                    onChange={e => setNewCatBudget({ ...newCatBudget, budget: e.target.value })}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newCatBudget.category && newCatBudget.budget) {
                      updateSettings({
                        categoryBudgets: [
                          ...(settings.categoryBudgets || []),
                          { category: newCatBudget.category, budget: Number(newCatBudget.budget) }
                        ]
                      });
                      setNewCatBudget({ category: '', budget: '' });
                    }
                  }}
                  className="w-full min-h-[42px] py-2.5 px-4 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 text-white font-extrabold text-xs leading-none shadow-xs active:scale-95 transition cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus size={15} strokeWidth={2.5} className="shrink-0" />
                  <span>Add Category Budget</span>
                </button>
              </div>

              {(settings.categoryBudgets || []).length > 0 && (
                <div className="space-y-2">
                  {(settings.categoryBudgets || []).map((cb, i) => (
                    <div key={cb.category} className="flex items-center justify-between gap-2.5 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{cb.category}</p>
                        <p className="text-[11px] text-slate-500 font-medium">₹{cb.budget.toLocaleString()} / month</p>
                      </div>
                      <button
                        type="button"
                        aria-label={`Delete ${cb.category} budget`}
                        onClick={() => updateSettings({ categoryBudgets: (settings.categoryBudgets || []).filter((_, idx) => idx !== i) })}
                        className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 inline-flex items-center justify-center shrink-0 text-rose-500 hover:text-rose-700 transition active:scale-95 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* ════════ GROUP 2: PRESETS & PAYMENTS ════════ */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">
          Presets & Payment Methods
        </p>
        <div className="space-y-3">
          {/* Quick Add Templates */}
          <Section
            id="quickadd"
            title="Quick Add Templates"
            subtitle="One-tap expense presets for your home screen"
            Icon={Zap}
            badge={settings.quickAddTemplates?.length}
            open={open}
            setOpen={setOpen}
            color="amber"
          >
            <div className="space-y-4 pt-1">
              {/* Template Creation / Edit Card */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/70 p-4 rounded-2xl border border-amber-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-600" />
                    {editingTemplateId ? 'Edit Preset Template' : 'Create Preset Template'}
                  </h4>
                </div>

                {/* Icon Preview & Picker Trigger */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-amber-100 shadow-2xs">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-2xl shadow-xs shrink-0">
                    {newQuickAdd.icon || '☕'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800">
                      {newQuickAdd.name || 'Template Name'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="mt-0.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition inline-flex items-center justify-center leading-none gap-1 cursor-pointer"
                    >
                      <span>{showEmojiPicker ? 'Close Emoji Picker' : 'Choose Emoji Icon'}</span>
                      {showEmojiPicker ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Emoji Picker with Category Chips */}
                {showEmojiPicker && (
                  <div className="border border-violet-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                    {/* Category Chip Selector */}
                    <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setEmojiFilter('all')}
                        className={`inline-flex items-center justify-center leading-none shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                          emojiFilter === 'all'
                            ? 'bg-violet-600 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        All Emojis
                      </button>
                      {newQuickAdd.category && (
                        <button
                          type="button"
                          onClick={() => setEmojiFilter('category')}
                          className={`inline-flex items-center justify-center leading-none shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            emojiFilter === 'category'
                              ? 'bg-violet-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {newQuickAdd.category}
                        </button>
                      )}
                    </div>

                    {/* Emojis Grid */}
                    <div className="max-h-48 overflow-y-auto p-3 space-y-3">
                      {(emojiFilter === 'category' && newQuickAdd.category && CATEGORY_EMOJIS[newQuickAdd.category]
                        ? [{ category: newQuickAdd.category, emojis: CATEGORY_EMOJIS[newQuickAdd.category] }]
                        : DEFAULT_CATEGORIES.filter(c => CATEGORY_EMOJIS[c]).map(c => ({ category: c, emojis: CATEGORY_EMOJIS[c] }))
                      ).map(({ category, emojis }) => (
                        <div key={category}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{category}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {emojis.map(emoji => (
                              <button
                                key={`${category}-${emoji}`}
                                type="button"
                                onClick={() => {
                                  setNewQuickAdd({ ...newQuickAdd, icon: emoji });
                                  setShowEmojiPicker(false);
                                }}
                                className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl transition cursor-pointer ${
                                  newQuickAdd.icon === emoji
                                    ? 'ring-2 ring-violet-500 bg-violet-100 shadow-sm'
                                    : 'bg-slate-50 hover:bg-amber-100'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    placeholder="Preset Name (e.g. Chai, Metro, Fuel)"
                    value={newQuickAdd.name}
                    onChange={e => setNewQuickAdd({ ...newQuickAdd, name: e.target.value })}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    placeholder="Default Amount (₹)"
                    value={newQuickAdd.amount}
                    onChange={e => setNewQuickAdd({ ...newQuickAdd, amount: e.target.value })}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                  <select
                    value={newQuickAdd.category}
                    onChange={e => setNewQuickAdd({ ...newQuickAdd, category: e.target.value })}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">Select Category *</option>
                    {[...DEFAULT_CATEGORIES, ...settings.customCategories].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={newQuickAdd.platform}
                    onChange={e => setNewQuickAdd({ ...newQuickAdd, platform: e.target.value })}
                    className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="">Platform (optional)</option>
                    {ALL_PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {editingTemplateId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setNewQuickAdd({ name: '', amount: '', category: '', platform: '', icon: '☕' });
                        setShowEmojiPicker(false);
                      }}
                      className="flex-1 min-h-[42px] py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs leading-none hover:bg-slate-50 transition active:scale-95 cursor-pointer inline-flex items-center justify-center shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!newQuickAdd.name || !newQuickAdd.amount || !newQuickAdd.category) return;
                      if (editingTemplateId) {
                        updateSettings({
                          quickAddTemplates: (settings.quickAddTemplates || []).map(x =>
                            x.id === editingTemplateId
                              ? { ...x, name: newQuickAdd.name, amount: Number(newQuickAdd.amount), category: newQuickAdd.category, platform: newQuickAdd.platform, icon: newQuickAdd.icon }
                              : x
                          ),
                        });
                        setEditingTemplateId(null);
                      } else {
                        updateSettings({
                          quickAddTemplates: [
                            ...(settings.quickAddTemplates || []),
                            { ...newQuickAdd, id: Date.now().toString(), amount: Number(newQuickAdd.amount) }
                          ]
                        });
                      }
                      setNewQuickAdd({ name: '', amount: '', category: '', platform: '', icon: '☕' });
                      setShowEmojiPicker(false);
                    }}
                    className="flex-1 min-h-[42px] py-2.5 px-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs leading-none shadow-sm hover:from-amber-600 hover:to-amber-700 transition active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
                  >
                    {editingTemplateId ? (
                      <>
                        <Check size={15} strokeWidth={2.5} className="shrink-0" />
                        <span>Update Preset</span>
                      </>
                    ) : (
                      <>
                        <Plus size={15} strokeWidth={2.5} className="shrink-0" />
                        <span>Save Preset</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Existing Templates List */}
              <div className="space-y-2">
                {(settings.quickAddTemplates || []).map(t => {
                  const isEditing = editingTemplateId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all ${
                        isEditing
                          ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-amber-50/70 border border-amber-100 rounded-xl inline-flex items-center justify-center text-lg shadow-2xs shrink-0">
                          {t.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate leading-tight">{t.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                            ₹{t.amount} • {t.category}{t.platform ? ` • ${t.platform}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplateId(t.id);
                            setNewQuickAdd({
                              name: t.name,
                              amount: String(t.amount),
                              category: t.category,
                              platform: t.platform || '',
                              icon: t.icon || '☕',
                            });
                            setShowEmojiPicker(true);
                            setEmojiFilter(t.category && CATEGORY_EMOJIS[t.category] ? 'category' : 'all');
                          }}
                          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 inline-flex items-center justify-center shrink-0 text-slate-600 hover:text-slate-900 transition active:scale-95 cursor-pointer"
                          title="Edit preset"
                          aria-label={`Edit ${t.name}`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateSettings({ quickAddTemplates: settings.quickAddTemplates.filter(x => x.id !== t.id) });
                            if (editingTemplateId === t.id) {
                              setEditingTemplateId(null);
                              setNewQuickAdd({ name: '', amount: '', category: '', platform: '', icon: '☕' });
                              setShowEmojiPicker(false);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 inline-flex items-center justify-center shrink-0 text-rose-500 hover:text-rose-700 transition active:scale-95 cursor-pointer"
                          title="Delete preset"
                          aria-label={`Delete ${t.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Payment Methods */}
          <Section
            id="payment"
            title="Payment Methods"
            subtitle="Manage UPI, card & cash payment modes"
            Icon={CreditCard}
            badge={PAYMENT_METHODS.length + (settings.customPaymentMethods || []).length}
            open={open}
            setOpen={setOpen}
            color="purple"
          >
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Add new payment method (e.g. Cred Pay)..."
                  value={newPayment}
                  onChange={e => setNewPayment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newPayment.trim()) {
                      updateSettings({ customPaymentMethods: [...(settings.customPaymentMethods || []), newPayment.trim()] });
                      setNewPayment('');
                    }
                  }}
                  className="flex-1 min-w-0 min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-purple-500 focus:bg-white"
                />
                <button
                  type="button"
                  aria-label="Add payment method"
                  onClick={() => {
                    if (newPayment.trim()) {
                      updateSettings({ customPaymentMethods: [...(settings.customPaymentMethods || []), newPayment.trim()] });
                      setNewPayment('');
                    }
                  }}
                  className="min-h-[42px] px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center shrink-0"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {PAYMENT_METHODS.map(p => (
                  <span
                    key={p}
                    className="inline-flex items-center justify-center leading-none text-xs px-3 py-1.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {p}
                  </span>
                ))}
                {(settings.customPaymentMethods || []).map(p => (
                  <span
                    key={p}
                    className="text-xs px-3 py-1.5 rounded-full font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5 leading-none shadow-2xs"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${p}`}
                      onClick={() => updateSettings({ customPaymentMethods: (settings.customPaymentMethods || []).filter(x => x !== p) })}
                      className="w-4 h-4 rounded-full text-purple-500 hover:text-rose-600 hover:bg-rose-50 transition ml-0.5 cursor-pointer inline-flex items-center justify-center shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* ════════ GROUP 3: ORGANIZATION & FAMILY ════════ */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider px-1">
          Organization & Family
        </p>
        <div className="space-y-3">
          {/* Categories */}
          <Section
            id="categories"
            title="Categories"
            subtitle="Spending classification tags"
            Icon={Tag}
            badge={DEFAULT_CATEGORIES.length + settings.customCategories.length}
            open={open}
            setOpen={setOpen}
            color="teal"
          >
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Add new category (e.g. Pet Care, Books)..."
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCategory.trim()) {
                      updateSettings({ customCategories: [...settings.customCategories, newCategory.trim()] });
                      setNewCategory('');
                    }
                  }}
                  className="flex-1 min-w-0 min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-500 focus:bg-white"
                />
                <button
                  type="button"
                  aria-label="Add category"
                  onClick={() => {
                    if (newCategory.trim()) {
                      updateSettings({ customCategories: [...settings.customCategories, newCategory.trim()] });
                      setNewCategory('');
                    }
                  }}
                  className="min-h-[42px] px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center shrink-0"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 max-h-72 overflow-y-auto">
                {DEFAULT_CATEGORIES.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center justify-center leading-none text-xs px-3 py-1.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {c}
                  </span>
                ))}
                {settings.customCategories.map(c => (
                  <span
                    key={c}
                    className="text-xs px-3 py-1.5 rounded-full font-bold bg-teal-50 text-teal-800 border border-teal-200 inline-flex items-center gap-1.5 leading-none shadow-2xs"
                  >
                    <span>{c}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${c}`}
                      onClick={() => updateSettings({ customCategories: settings.customCategories.filter(x => x !== c) })}
                      className="w-4 h-4 rounded-full text-teal-500 hover:text-rose-600 hover:bg-rose-50 transition ml-0.5 cursor-pointer inline-flex items-center justify-center shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Section>

          {/* Platforms / Shops */}
          <Section
            id="platforms"
            title="Platforms / Shops"
            subtitle="Merchant and store names"
            Icon={Store}
            badge={ALL_PLATFORMS.length + settings.customPlatforms.length}
            open={open}
            setOpen={setOpen}
            color="indigo"
          >
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Add new platform (e.g. Blinkit, Dunzo)..."
                  value={newPlatform}
                  onChange={e => setNewPlatform(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newPlatform.trim()) {
                      updateSettings({ customPlatforms: [...settings.customPlatforms, newPlatform.trim()] });
                      setNewPlatform('');
                    }
                  }}
                  className="flex-1 min-w-0 min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                />
                <button
                  type="button"
                  aria-label="Add platform"
                  onClick={() => {
                    if (newPlatform.trim()) {
                      updateSettings({ customPlatforms: [...settings.customPlatforms, newPlatform.trim()] });
                      setNewPlatform('');
                    }
                  }}
                  className="min-h-[42px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center shrink-0"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1 max-h-72 overflow-y-auto">
                {ALL_PLATFORMS.map(p => (
                  <span
                    key={p}
                    className="inline-flex items-center justify-center leading-none text-xs px-3 py-1.5 rounded-full font-bold bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs"
                  >
                    {p}
                  </span>
                ))}
                {settings.customPlatforms.map(p => (
                  <span
                    key={p}
                    className="text-xs px-3 py-1.5 rounded-full font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 leading-none shadow-2xs"
                  >
                    <span>{p}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${p}`}
                      onClick={() => updateSettings({ customPlatforms: settings.customPlatforms.filter(x => x !== p) })}
                      className="w-4 h-4 rounded-full text-indigo-500 hover:text-rose-600 hover:bg-rose-50 transition ml-0.5 cursor-pointer inline-flex items-center justify-center shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </Section>

          {/* Family Members */}
          <Section
            id="family"
            title="Family Members"
            subtitle="Tag transactions by family member"
            Icon={Users}
            badge={(settings.familyMembers || []).length}
            open={open}
            setOpen={setOpen}
            color="blue"
          >
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <input
                  placeholder="Add family member (e.g. Mom, Rajesh)..."
                  value={newMember}
                  onChange={e => setNewMember(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newMember.trim()) {
                      updateSettings({ familyMembers: [...(settings.familyMembers || []), newMember.trim()] });
                      setNewMember('');
                    }
                  }}
                  className="flex-1 min-w-0 min-h-[42px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-sky-500 focus:bg-white"
                />
                <button
                  type="button"
                  aria-label="Add family member"
                  onClick={() => {
                    if (newMember.trim()) {
                      updateSettings({ familyMembers: [...(settings.familyMembers || []), newMember.trim()] });
                      setNewMember('');
                    }
                  }}
                  className="min-h-[42px] px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-xl transition active:scale-95 cursor-pointer shadow-xs inline-flex items-center justify-center shrink-0"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {(settings.familyMembers || []).map(m => (
                  <span
                    key={m}
                    className="text-xs px-3 py-1.5 rounded-full font-bold transition-all bg-sky-50 border border-sky-200 text-sky-800 inline-flex items-center gap-1.5 leading-none shadow-2xs"
                  >
                    <Users size={12} className="text-sky-600 shrink-0" />
                    <span>{m}</span>
                    {m !== 'Me' && (
                      <button
                        type="button"
                        aria-label={`Remove ${m}`}
                        onClick={() => updateSettings({ familyMembers: (settings.familyMembers || []).filter(x => x !== m) })}
                        className="w-4 h-4 rounded-full text-sky-500 hover:text-rose-600 hover:bg-rose-50 transition ml-0.5 cursor-pointer inline-flex items-center justify-center shrink-0"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSettingsTab;
