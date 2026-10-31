import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart,
  Plus,
  Sparkles,
  Target,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { BudgetPlan, Expense, ExpenseSettings } from '../../types';
import { normalizeTransaction, isExpense } from '../../utils/expenseUtils';
import { DEFAULT_CATEGORIES, getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';

const DEFAULT_BUDGETS: BudgetPlan[] = [
  { id: 'b-1', name: 'Overall Monthly Living', amount: 35000, period: 'monthly', categories: ['All'] },
  { id: 'b-2', name: 'Food & Groceries', amount: 12000, period: 'monthly', categories: ['Food', 'Grocery', 'Vegetables'] },
  { id: 'b-3', name: 'Fuel & Commute', amount: 4000, period: 'monthly', categories: ['Petrol / Fuel', 'Travel / Transport'] }
];

export const BudgetsTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [budgets, setBudgets] = useState<BudgetPlan[]>(DEFAULT_BUDGETS);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetPlan | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<number>(10000);
  const [period, setPeriod] = useState<BudgetPlan['period']>('monthly');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);

  useEffect(() => {
    fetchData();
  }, [activePartnerId]);

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch Expenses to calculate spent against budgets
    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .eq('partner_id', activePartnerId);

    if (expData) setExpenses(expData.map(normalizeTransaction));
    else setExpenses([]);

    // 2. Fetch Settings & Budgets
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
      if (sJson.customBudgets && sJson.customBudgets.length > 0) {
        setBudgets(sJson.customBudgets);
      } else {
        setBudgets(DEFAULT_BUDGETS);
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

  // Current month prefix (YYYY-MM)
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }, []);

  // Compute spent for each budget in current month
  const budgetsWithSpent = useMemo(() => {
    const monthExpenses = expenses.filter(e => isExpense(e) && e.date?.startsWith(currentMonthPrefix));

    return budgets.map(b => {
      const isAll = !b.categories || b.categories.includes('All') || b.categories.length === 0;
      const matched = monthExpenses.filter(e => isAll || b.categories?.includes(e.category));
      const spent = matched.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const remaining = Math.max(0, b.amount - spent);
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return {
        ...b,
        spent,
        remaining,
        pct
      };
    });
  }, [budgets, expenses, currentMonthPrefix]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setName('');
    setAmount(10000);
    setPeriod('monthly');
    setSelectedCategories(['All']);
    setShowModal(true);
  };

  const handleOpenEdit = (b: BudgetPlan) => {
    setEditingBudget(b);
    setName(b.name);
    setAmount(b.amount);
    setPeriod(b.period);
    setSelectedCategories(b.categories && b.categories.length > 0 ? b.categories : ['All']);
    setShowModal(true);
  };

  const handleSaveBudget = async () => {
    if (!name.trim() || amount <= 0) return;

    if (editingBudget) {
      const updated = budgets.map(b =>
        b.id === editingBudget.id
          ? { ...b, name: name.trim(), amount, period, categories: selectedCategories }
          : b
      );
      await persistBudgets(updated);
    } else {
      const newBudget: BudgetPlan = {
        id: `budget-${Date.now()}`,
        name: name.trim(),
        amount,
        period,
        categories: selectedCategories,
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
      {/* ════════ Top Hero Banner (Sharp & Modern) ════════ */}
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
                Set limits & control category spending
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
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Budget Limits ({budgets.length})
          </h3>
          <span className="text-[11px] font-bold text-slate-400">Current Month</span>
        </div>

        {budgetsWithSpent.map(b => {
          const isOver = b.pct >= 100;
          const isWarning = b.pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-sm transition space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-900 leading-snug break-words">
                      {b.name}
                    </h4>
                    <span className="text-[10px] font-extrabold capitalize text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-100">
                      {b.period}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {b.categories?.includes('All') ? 'All categories included' : b.categories?.join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    aria-label="Edit budget"
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition active:scale-95 cursor-pointer"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBudget(b.id)}
                    aria-label="Delete budget"
                    className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 hover:text-rose-700 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className={isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'}>
                    ₹{b.spent.toLocaleString()} spent ({b.pct}%)
                  </span>
                  <span className="text-slate-500">
                    Budget: ₹{b.amount.toLocaleString()}
                  </span>
                </div>

                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
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

                <div className="flex items-center justify-between text-[11px] font-semibold mt-1">
                  <span className="text-slate-400">
                    {isOver ? (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle size={12} /> Exceeded by ₹{(b.spent - b.amount).toLocaleString()}
                      </span>
                    ) : (
                      `₹${b.remaining.toLocaleString()} left to spend`
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════ Create / Edit Budget Modal ════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingBudget ? 'Edit Budget' : 'Define Your Budget'}
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
                <label className="font-bold text-slate-700 block mb-1">Budget Name</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Grocery, Fuel, Entertainment"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Period</label>
                  <select
                    value={period}
                    onChange={e => setPeriod(e.target.value as BudgetPlan['period'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Budget Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Apply to Categories</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleCategory('All')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                      selectedCategories.includes('All')
                        ? 'bg-pink-600 text-white border-pink-700'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    All Categories
                  </button>
                  {DEFAULT_CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                        selectedCategories.includes(c)
                          ? 'bg-pink-600 text-white border-pink-700'
                          : 'bg-white text-slate-600 border-slate-200'
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
                className="flex-1 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
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
    </div>
  );
};

export default BudgetsTracker;

