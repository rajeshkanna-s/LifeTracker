import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Plus,
  Target,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  RotateCcw,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { BudgetPlan, BudgetSpendEntry, ExpenseSettings } from '../../types';
import { DEFAULT_CATEGORIES, getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';

const DEFAULT_BUDGETS: BudgetPlan[] = [
  { id: 'b-1', name: 'INTERNET BILL', amount: 620, spent: 0, period: 'monthly', categories: ['Bills'] },
  { id: 'b-2', name: 'TERM INSURANCE', amount: 960, spent: 0, period: 'monthly', categories: ['Savings / Investments'] },
  { id: 'b-3', name: 'OWN GOLD LOAN', amount: 12000, spent: 10000, period: 'monthly', categories: ['EMIs / Loans'] }
];

export const BudgetsTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [budgets, setBudgets] = useState<BudgetPlan[]>(DEFAULT_BUDGETS);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State for Create/Edit Budget
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetPlan | null>(null);
  const [expandedBudgetId, setExpandedBudgetId] = useState<string | null>(null);

  // Form State for Create/Edit
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('10000');
  const [spentInput, setSpentInput] = useState<string>('0');
  const [period, setPeriod] = useState<BudgetPlan['period']>('monthly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);

  // Quick "+ Log Spend" Modal State
  const [spendModalBudget, setSpendModalBudget] = useState<BudgetPlan | null>(null);
  const [addSpendAmount, setAddSpendAmount] = useState<string>('');
  const [addSpendNote, setAddSpendNote] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [activePartnerId]);

  const fetchData = async () => {
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
      if (Array.isArray(sJson.customBudgets) && sJson.customBudgets.length > 0) {
        // Ensure spent is properly initialized on loaded budgets
        const sanitized = sJson.customBudgets.map((b: BudgetPlan) => {
          let spentVal = Number(b.spent);
          if (isNaN(spentVal)) {
            spentVal = b.name.toLowerCase().includes('gold') ? 10000 : 0;
          }
          return {
            ...b,
            spent: spentVal
          };
        });
        setBudgets(sanitized);
      } else if (activePartnerId === 'partner_1') {
        setBudgets(DEFAULT_BUDGETS);
      } else {
        setBudgets([]);
      }
    } else {
      setSettings(defaults);
      setBudgets(DEFAULT_BUDGETS);
    }

    setLoading(false);
  };

  const persistBudgets = async (updated: BudgetPlan[]) => {
    setBudgets(updated);
    const newSettings = { ...settings, customBudgets: updated };
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

  // Compute calculated metrics directly from each individual budget
  const budgetsWithCalculations = useMemo(() => {
    return budgets.map(b => {
      const spent = Math.max(0, Number(b.spent) || 0);
      const remaining = Math.max(0, b.amount - spent);
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return {
        ...b,
        spent,
        remaining,
        pct,
        spendHistory: b.spendHistory || []
      };
    });
  }, [budgets]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setName('');
    setAmount('10000');
    setSpentInput('0');
    setPeriod('monthly');
    setSelectedCategories(['All']);
    setShowModal(true);
  };

  const handleOpenEdit = (b: BudgetPlan) => {
    setEditingBudget(b);
    setName(b.name);
    setAmount(b.amount !== undefined ? String(b.amount) : '');
    setSpentInput(String(b.spent ?? 0));
    setPeriod(b.period);
    setSelectedCategories(b.categories && b.categories.length > 0 ? b.categories : ['All']);
    setShowModal(true);
  };

  const handleSaveBudget = async () => {
    const numAmount = parseFloat(amount) || 0;
    const numSpent = parseFloat(spentInput) || 0;
    if (!name.trim() || numAmount <= 0) return;

    if (editingBudget) {
      const updated = budgets.map(b =>
        b.id === editingBudget.id
          ? {
              ...b,
              name: name.trim(),
              amount: numAmount,
              spent: numSpent,
              period,
              categories: selectedCategories
            }
          : b
      );
      await persistBudgets(updated);
    } else {
      const newBudget: BudgetPlan = {
        id: `budget-${Date.now()}`,
        name: name.trim(),
        amount: numAmount,
        spent: numSpent,
        period,
        categories: selectedCategories,
        spendHistory: numSpent > 0 ? [{
          id: `sp-${Date.now()}`,
          amount: numSpent,
          date: new Date().toISOString().split('T')[0],
          note: 'Initial balance'
        }] : [],
        created_at: new Date().toISOString()
      };
      await persistBudgets([...budgets, newBudget]);
    }
    setShowModal(false);
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Delete this budget plan?')) {
      const updated = budgets.filter(b => b.id !== id);
      await persistBudgets(updated);
    }
  };

  // Quick Action: + Log Spend to this specific budget
  const handleOpenAddSpend = (b: BudgetPlan) => {
    setSpendModalBudget(b);
    setAddSpendAmount('');
    setAddSpendNote('');
  };

  const handleSaveAddSpend = async () => {
    if (!spendModalBudget) return;
    const addVal = parseFloat(addSpendAmount) || 0;
    if (addVal <= 0) return;

    const newEntry: BudgetSpendEntry = {
      id: `spend-${Date.now()}`,
      amount: addVal,
      date: new Date().toISOString().split('T')[0],
      note: addSpendNote.trim() || undefined
    };

    const updated = budgets.map(b => {
      if (b.id !== spendModalBudget.id) return b;
      const currentSpent = Number(b.spent) || 0;
      const history = b.spendHistory || [];
      return {
        ...b,
        spent: currentSpent + addVal,
        spendHistory: [newEntry, ...history]
      };
    });

    await persistBudgets(updated);
    setSpendModalBudget(null);
  };

  // Quick Action: Mark Budget as Fully Paid / 100%
  const handleMarkFullyPaid = async (b: BudgetPlan) => {
    const updated = budgets.map(item => {
      if (item.id !== b.id) return item;
      return {
        ...item,
        spent: item.amount,
        spendHistory: [
          {
            id: `spend-${Date.now()}`,
            amount: item.amount - (Number(item.spent) || 0),
            date: new Date().toISOString().split('T')[0],
            note: 'Marked fully paid'
          },
          ...(item.spendHistory || [])
        ]
      };
    });
    await persistBudgets(updated);
  };

  // Quick Action: Reset Spent back to ₹0
  const handleResetSpent = async (b: BudgetPlan) => {
    if (!window.confirm(`Reset spent on "${b.name}" back to ₹0?`)) return;
    const updated = budgets.map(item => {
      if (item.id !== b.id) return item;
      return {
        ...item,
        spent: 0,
        spendHistory: []
      };
    });
    await persistBudgets(updated);
  };

  // Delete an individual spend log entry
  const handleDeleteSpendEntry = async (budgetId: string, entryId: string) => {
    const updated = budgets.map(b => {
      if (b.id !== budgetId) return b;
      const history = b.spendHistory || [];
      const entryToDelete = history.find(e => e.id === entryId);
      const newHistory = history.filter(e => e.id !== entryId);
      const newSpent = Math.max(0, (Number(b.spent) || 0) - (entryToDelete?.amount || 0));
      return {
        ...b,
        spent: newSpent,
        spendHistory: newHistory
      };
    });
    await persistBudgets(updated);
  };

  const toggleCategory = (cat: string) => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
      return;
    }
    let next = selectedCategories.filter(c => c !== 'All');
    if (next.includes(cat)) {
      next = next.filter(c => c !== cat);
      if (next.length === 0) next = ['All'];
    } else {
      next.push(cat);
    }
    setSelectedCategories(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* ════════ Top Hero Banner ════════ */}
      <div
        className="rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)' }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <PieChart size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                Monthly Budgets
              </h2>
              <p className="text-xs text-pink-100 font-semibold mt-0.5">
                Individual budget limits with direct spend tracking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            style={{ minHeight: '42px', whiteSpace: 'nowrap' }}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-pink-900 font-extrabold text-xs rounded-full shadow-md active:scale-95 transition cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* ════════ Active Budgets List ════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p
            style={{ fontSize: '11px', margin: 0 }}
            className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
          >
            Active Budget Limits ({budgets.length})
          </p>
          <span className="text-[10px] font-bold text-slate-400">Current Month</span>
        </div>

        {budgetsWithCalculations.map(b => {
          const isOver = b.pct >= 100;
          const isWarning = b.pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
                      {b.name}
                    </h4>
                    <span className="text-[10px] font-extrabold capitalize text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-950/50 px-2 py-0.5 rounded-full border border-pink-100 dark:border-pink-800/50">
                      {b.period}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                    {b.categories?.includes('All') ? 'General' : b.categories?.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    aria-label="Edit budget"
                    title="Edit budget details or spent amount"
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition active:scale-95 cursor-pointer"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBudget(b.id)}
                    aria-label="Delete budget"
                    title="Delete budget"
                    className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress bar and values */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className={isOver ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}>
                    ₹{b.spent.toLocaleString()} spent ({b.pct}%)
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Budget: ₹{b.amount.toLocaleString()}
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(b.pct, 100)}%` }}
                    className={`h-full transition-all duration-300 rounded-full ${
                      isOver
                        ? 'bg-gradient-to-r from-rose-500 to-red-600'
                        : isWarning
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold mt-1.5">
                  <span className="text-slate-500 dark:text-slate-400">
                    {isOver ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> Exceeded by ₹{(b.spent - b.amount).toLocaleString()}
                      </span>
                    ) : (
                      `₹${b.remaining.toLocaleString()} left to spend`
                    )}
                  </span>

                  {/* Quick Action Pills: + Spend, Paid, Reset */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenAddSpend(b)}
                      className="px-2 py-0.5 rounded-lg bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/40 dark:hover:bg-pink-900/60 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold border border-pink-200/80 dark:border-pink-800 transition active:scale-95 cursor-pointer"
                    >
                      + Add Spend
                    </button>
                    {b.spent < b.amount && (
                      <button
                        type="button"
                        onClick={() => handleMarkFullyPaid(b)}
                        title="Mark budget as fully spent/paid"
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200/80 dark:border-emerald-800 transition active:scale-95 cursor-pointer"
                      >
                        ✓ Mark Paid
                      </button>
                    )}
                    {b.spent > 0 && (
                      <button
                        type="button"
                        onClick={() => handleResetSpent(b)}
                        title="Reset spent to ₹0"
                        className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition active:scale-95 cursor-pointer"
                      >
                        <RotateCcw size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Spend History Accordion */}
                {b.spendHistory.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setExpandedBudgetId(expandedBudgetId === b.id ? null : b.id)}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 flex items-center justify-between w-full cursor-pointer"
                    >
                      <span>Spend entries ({b.spendHistory.length})</span>
                      <ChevronDown
                        size={12}
                        style={{
                          transform: expandedBudgetId === b.id ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </button>

                    {expandedBudgetId === b.id && (
                      <div className="mt-2 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                        {b.spendHistory.map(entry => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/40 last:border-0"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                {entry.note || 'Direct spend'}
                              </p>
                              <p className="text-[10px] text-slate-400">{entry.date}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-slate-100">
                                ₹{entry.amount.toLocaleString()}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSpendEntry(b.id, entry.id)}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5"
                                title="Delete entry"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ Create / Edit Budget Modal ════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                {editingBudget ? 'Edit Budget' : 'Define Your Budget'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Budget Name</label>
                <input
                  type="text"
                  placeholder="e.g. Internet Bill, Term Insurance, Own Gold Loan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Budget Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Already Spent (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={spentInput}
                    onChange={e => setSpentInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-pink-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Period</label>
                <select
                  value={period}
                  onChange={e => setPeriod(e.target.value as BudgetPlan['period'])}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Category Tag (Optional)</label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => toggleCategory('All')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                      selectedCategories.includes('All')
                        ? 'bg-pink-600 text-white border-pink-700'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    General
                  </button>
                  {DEFAULT_CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                        selectedCategories.includes(c)
                          ? 'bg-pink-600 text-white border-pink-700'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBudget}
                style={{
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
                  boxShadow: '0 2px 8px rgba(219, 39, 119, 0.28)'
                }}
                className="flex-1 rounded-xl text-white font-bold text-xs active:scale-98 transition cursor-pointer"
              >
                Save Budget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Quick "+ Log Spend" Modal ════════ */}
      {spendModalBudget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  + Log Spend
                </h3>
                <p className="text-xs text-pink-600 dark:text-pink-400 font-bold">
                  {spendModalBudget.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSpendModalBudget(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount Spent (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  autoFocus
                  value={addSpendAmount}
                  onChange={e => setAddSpendAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-base font-black text-slate-800 dark:text-slate-100 outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Note / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bill paid via UPI, Part payment"
                  value={addSpendNote}
                  onChange={e => setAddSpendNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSpendModalBudget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAddSpend}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Add to Spent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsTracker;
