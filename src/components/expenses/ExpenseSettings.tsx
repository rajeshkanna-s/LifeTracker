import React, { useState } from 'react';
import { Plus, Trash2, Wallet, Users, Zap, CreditCard, Tag, Store, Target, PiggyBank, ChevronDown, ChevronRight } from 'lucide-react';
import type { ExpenseSettings, QuickAddTemplate, CategoryBudget, SavingsGoal } from '../../types';
import { CURRENCIES, DEFAULT_CATEGORIES, PAYMENT_METHODS, ALL_PLATFORMS, DEFAULT_QUICK_ADD } from '../../data/constants';

interface ExpenseSettingsProps {
  settings: ExpenseSettings;
  onSettingsChange: (settings: ExpenseSettings) => void;
}

const Section: React.FC<{
  id: string; title: string; Icon: any; badge?: number | string;
  open: string; setOpen: (v: string) => void; children: React.ReactNode;
  color?: string;
}> = ({ id, title, Icon, badge, open, setOpen, children, color = 'emerald' }) => {
  const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-orange-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-orange-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', badge: 'bg-orange-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-orange-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', badge: 'bg-orange-500' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', badge: 'bg-orange-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', badge: 'bg-orange-500' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', badge: 'bg-orange-500' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className={`border border-gray-200 rounded-2xl bg-white overflow-hidden transition-all duration-200 ${open === id ? 'ring-1 ring-violet-300' : 'hover:border-gray-300'}`}>
      <button onClick={() => setOpen(open === id ? '' : id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center transition-transform ${open === id ? 'scale-110' : ''}`}>
            <Icon size={18} className={c.text} />
          </div>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          {badge !== undefined && (
            <span className={`${c.badge} text-white text-[10px] font-bold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center`}>{badge}</span>
          )}
        </div>
        <div className={`transition-transform duration-200 ${open === id ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} className="text-gray-400" />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open === id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 pt-0 border-t border-gray-200">{children}</div>
      </div>
    </div>
  );
};

const ExpenseSettingsTab: React.FC<ExpenseSettingsProps> = ({ settings, onSettingsChange }) => {
  const [open, setOpen] = useState('currency');
  const [newQuickAdd, setNewQuickAdd] = useState({ name: '', amount: '', category: '', platform: '', icon: '☕' });
  const [newCategory, setNewCategory] = useState('');
  const [newPlatform, setNewPlatform] = useState('');
  const [newPayment, setNewPayment] = useState('');
  const [newMember, setNewMember] = useState('');
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', deadline: '' });
  const [newCatBudget, setNewCatBudget] = useState({ category: '', budget: '' });

  const updateSettings = (updates: Partial<ExpenseSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40 focus:border-violet-400 bg-gray-50 text-gray-800 transition-all placeholder:text-gray-400";
  const btnPrimary = "bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-all flex items-center justify-center shadow-sm hover:shadow-md active:scale-[0.98]";
  const chipBase = "text-xs px-3 py-1.5 rounded-full font-medium transition-all";

  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {/* Currency & Budget */}
      <Section id="currency" title="Currency & Monthly Budget" Icon={Wallet} open={open} setOpen={setOpen} color="emerald">
        <div className="pt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Currency</label>
            <select value={settings.currency} onChange={e => {
              const c = CURRENCIES.find(x => x.code === e.target.value);
              if (c) updateSettings({ currency: c.code, currencySymbol: c.symbol });
            }} className={`${inputClass} bg-white cursor-pointer`}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Monthly Budget Limit ({settings.currencySymbol})</label>
            <input type="number" value={settings.monthlyBudget || ''} onChange={e => updateSettings({ monthlyBudget: Number(e.target.value) })}
              className={inputClass} placeholder="e.g., 50000" />
            <p className="text-[10px] text-gray-400 mt-1.5">Set to 0 to disable budget tracking.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Big Expense Alert ({settings.currencySymbol})</label>
            <input type="number" value={settings.bigExpenseLimit || ''} onChange={e => updateSettings({ bigExpenseLimit: Number(e.target.value) })}
              className={inputClass} placeholder="e.g., 2000" />
            <p className="text-[10px] text-gray-400 mt-1.5">Highlight expenses above this amount.</p>
          </div>
        </div>
      </Section>

      {/* Family Members */}
      <Section id="family" title="Family Members" Icon={Users} badge={(settings.familyMembers || []).length} open={open} setOpen={setOpen} color="blue">
        <div className="pt-4 space-y-4">
          <div className="flex gap-2">
            <input placeholder="Add family member..." value={newMember} onChange={e => setNewMember(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newMember.trim()) {
                  updateSettings({ familyMembers: [...(settings.familyMembers || []), newMember.trim()] });
                  setNewMember('');
                }
              }}
              className={inputClass} />
            <button onClick={() => {
              if (newMember.trim()) {
                updateSettings({ familyMembers: [...(settings.familyMembers || []), newMember.trim()] });
                setNewMember('');
              }
            }} className={`px-4 h-11 ${btnPrimary}`}><Plus size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(settings.familyMembers || []).map(m => (
              <span key={m} className={`${chipBase} bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1.5`}>
                <Users size={12} /> {m}
                {m !== 'Me' && (
                  <button onClick={() => updateSettings({ familyMembers: (settings.familyMembers || []).filter(x => x !== m) })} className="text-blue-400 hover:text-red-500 ml-1 transition-colors"><Trash2 size={12} /></button>
                )}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Quick Add Templates */}
      <Section id="quickadd" title="Quick Add Templates" Icon={Zap} badge={settings.quickAddTemplates?.length} open={open} setOpen={setOpen} color="amber">
        <div className="pt-4 space-y-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Add New Template</h4>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Name (e.g. Tea)" value={newQuickAdd.name} onChange={e => setNewQuickAdd({ ...newQuickAdd, name: e.target.value })} className={inputClass} />
              <input type="number" placeholder="Amount" value={newQuickAdd.amount} onChange={e => setNewQuickAdd({ ...newQuickAdd, amount: e.target.value })} className={inputClass} />
              <select value={newQuickAdd.category} onChange={e => setNewQuickAdd({ ...newQuickAdd, category: e.target.value })} className={`${inputClass} cursor-pointer`}>
                <option value="">Select Category</option>
                {[...DEFAULT_CATEGORIES, ...settings.customCategories].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Emoji Icon (e.g. ☕)" value={newQuickAdd.icon} onChange={e => setNewQuickAdd({ ...newQuickAdd, icon: e.target.value })} className={inputClass} />
            </div>
            <button onClick={() => {
              if (newQuickAdd.name && newQuickAdd.amount && newQuickAdd.category) {
                updateSettings({ quickAddTemplates: [...(settings.quickAddTemplates || []), { ...newQuickAdd, id: Date.now().toString(), amount: Number(newQuickAdd.amount) }] });
                setNewQuickAdd({ name: '', amount: '', category: '', platform: '', icon: '☕' });
              }
            }} className={`w-full h-10 ${btnPrimary} gap-2`}><Plus size={16} /> Add Template</button>
          </div>
          
          <div className="space-y-2">
            {(settings.quickAddTemplates || []).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-50/80 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-lg shadow-sm">{t.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-500">{settings.currencySymbol}{t.amount} · {t.category}</p>
                  </div>
                </div>
                <button onClick={() => updateSettings({ quickAddTemplates: settings.quickAddTemplates.filter(x => x.id !== t.id) })} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Payment Methods */}
      <Section id="payment" title="Payment Methods" Icon={CreditCard} badge={PAYMENT_METHODS.length + (settings.customPaymentMethods || []).length} open={open} setOpen={setOpen} color="purple">
        <div className="pt-4 space-y-4">
          <div className="flex gap-2">
            <input placeholder="New Payment Method" value={newPayment} onChange={e => setNewPayment(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newPayment.trim()) {
                  updateSettings({ customPaymentMethods: [...(settings.customPaymentMethods || []), newPayment.trim()] });
                  setNewPayment('');
                }
              }}
              className={inputClass} />
            <button onClick={() => {
              if (newPayment.trim()) {
                updateSettings({ customPaymentMethods: [...(settings.customPaymentMethods || []), newPayment.trim()] });
                setNewPayment('');
              }
            }} className={`px-4 h-11 ${btnPrimary}`}><Plus size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(p => <span key={p} className={`${chipBase} bg-purple-50 border border-purple-200/80 text-purple-700`}>{p}</span>)}
            {(settings.customPaymentMethods || []).map(p => (
              <span key={p} className={`${chipBase} bg-purple-100 border border-purple-300 text-purple-800 flex items-center gap-1.5`}>
                {p} <button onClick={() => updateSettings({ customPaymentMethods: (settings.customPaymentMethods || []).filter(x => x !== p) })} className="text-purple-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Custom Categories */}
      <Section id="categories" title="Categories" Icon={Tag} badge={DEFAULT_CATEGORIES.length + settings.customCategories.length} open={open} setOpen={setOpen} color="teal">
        <div className="pt-4 space-y-4">
          <div className="flex gap-2">
            <input placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newCategory.trim()) {
                  updateSettings({ customCategories: [...settings.customCategories, newCategory.trim()] });
                  setNewCategory('');
                }
              }}
              className={inputClass} />
            <button onClick={() => {
              if (newCategory.trim()) {
                updateSettings({ customCategories: [...settings.customCategories, newCategory.trim()] });
                setNewCategory('');
              }
            }} className={`px-4 h-11 ${btnPrimary}`}><Plus size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map(c => <span key={c} className={`${chipBase} bg-gray-50 text-gray-500 border border-gray-200`}>{c}</span>)}
            {settings.customCategories.map(c => (
              <span key={c} className={`${chipBase} bg-teal-50 border border-teal-200 text-teal-700 flex items-center gap-1.5`}>
                {c} <button onClick={() => updateSettings({ customCategories: settings.customCategories.filter(x => x !== c) })} className="text-teal-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Custom Platforms */}
      <Section id="platforms" title="Platforms / Shops" Icon={Store} badge={ALL_PLATFORMS.length + settings.customPlatforms.length} open={open} setOpen={setOpen} color="indigo">
        <div className="pt-4 space-y-4">
          <div className="flex gap-2">
            <input placeholder="New Platform" value={newPlatform} onChange={e => setNewPlatform(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newPlatform.trim()) {
                  updateSettings({ customPlatforms: [...settings.customPlatforms, newPlatform.trim()] });
                  setNewPlatform('');
                }
              }}
              className={inputClass} />
            <button onClick={() => {
              if (newPlatform.trim()) {
                updateSettings({ customPlatforms: [...settings.customPlatforms, newPlatform.trim()] });
                setNewPlatform('');
              }
            }} className={`px-4 h-11 ${btnPrimary}`}><Plus size={18} /></button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
            {ALL_PLATFORMS.map(p => <span key={p} className={`${chipBase} bg-gray-50 text-gray-500 border border-gray-200`}>{p}</span>)}
            {settings.customPlatforms.map(p => (
              <span key={p} className={`${chipBase} bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1.5`}>
                {p} <button onClick={() => updateSettings({ customPlatforms: settings.customPlatforms.filter(x => x !== p) })} className="text-indigo-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* Category Budgets */}
      <Section id="catbudget" title="Category Budgets" Icon={Target} badge={(settings.categoryBudgets || []).length} open={open} setOpen={setOpen} color="rose">
        <div className="pt-4 space-y-4">
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Set Budget per Category</h4>
            <div className="grid grid-cols-2 gap-2">
              <select value={newCatBudget.category} onChange={e => setNewCatBudget({ ...newCatBudget, category: e.target.value })} className={`${inputClass} cursor-pointer`}>
                <option value="">Select Category</option>
                {[...DEFAULT_CATEGORIES, ...settings.customCategories]
                  .filter(c => !(settings.categoryBudgets || []).find(b => b.category === c))
                  .map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" placeholder={`Budget (${settings.currencySymbol})`} value={newCatBudget.budget}
                onChange={e => setNewCatBudget({ ...newCatBudget, budget: e.target.value })} className={inputClass} />
            </div>
            <button onClick={() => {
              if (newCatBudget.category && newCatBudget.budget) {
                updateSettings({ categoryBudgets: [...(settings.categoryBudgets || []), { category: newCatBudget.category, budget: Number(newCatBudget.budget) }] });
                setNewCatBudget({ category: '', budget: '' });
              }
            }} className={`w-full h-10 ${btnPrimary} gap-2`}><Plus size={16} /> Add Category Budget</button>
          </div>
          {(settings.categoryBudgets || []).length > 0 && (
            <div className="space-y-2">
              {(settings.categoryBudgets || []).map((cb, i) => (
                <div key={cb.category} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl group">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{cb.category}</p>
                    <p className="text-xs text-gray-500">{settings.currencySymbol}{cb.budget.toLocaleString()} / month</p>
                  </div>
                  <button onClick={() => updateSettings({ categoryBudgets: (settings.categoryBudgets || []).filter((_, idx) => idx !== i) })} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* Savings Goals */}
      <Section id="savings" title="Savings Goals" Icon={PiggyBank} badge={(settings.savingsGoals || []).length} open={open} setOpen={setOpen} color="cyan">
        <div className="pt-4 space-y-4">
          <div className="bg-gradient-to-br from-cyan-50 to-sky-50 p-4 rounded-xl border border-cyan-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">New Savings Goal</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input placeholder="Goal name (e.g. Vacation)" value={newGoal.name}
                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} className={inputClass} />
              <input type="number" placeholder={`Target (${settings.currencySymbol})`} value={newGoal.targetAmount}
                onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} className={inputClass} />
              <input type="date" value={newGoal.deadline}
                onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })} className={inputClass} />
            </div>
            <button onClick={() => {
              if (newGoal.name && newGoal.targetAmount) {
                const goal: SavingsGoal = {
                  id: Date.now().toString(),
                  name: newGoal.name,
                  targetAmount: Number(newGoal.targetAmount),
                  savedAmount: 0,
                  deadline: newGoal.deadline,
                };
                updateSettings({ savingsGoals: [...(settings.savingsGoals || []), goal] });
                setNewGoal({ name: '', targetAmount: '', deadline: '' });
              }
            }} className={`w-full h-10 ${btnPrimary} gap-2`}><Plus size={16} /> Add Goal</button>
          </div>

          {(settings.savingsGoals || []).length > 0 && (
            <div className="space-y-2">
              {(settings.savingsGoals || []).map(g => {
                const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
                return (
                  <div key={g.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl group">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{g.name}</p>
                        <p className="text-xs text-gray-500">{settings.currencySymbol}{g.savedAmount.toLocaleString()} / {settings.currencySymbol}{g.targetAmount.toLocaleString()}{g.deadline ? ` · by ${g.deadline}` : ''}</p>
                      </div>
                      <button onClick={() => updateSettings({ savingsGoals: (settings.savingsGoals || []).filter(x => x.id !== g.id) })} className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-right text-gray-400 mt-1">{pct}% saved</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Section>



    </div>
  );
};

export default ExpenseSettingsTab;
