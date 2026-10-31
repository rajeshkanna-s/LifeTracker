import React, { useState, useEffect } from 'react';
import { Home, Plus, PieChart as ChartIcon, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Expense, ExpenseSettings } from '../../types';
import { getDefaultExpenseSettings, SEETHA_QUICK_ADD } from '../../data/constants';
import { normalizeTransaction } from '../../utils/expenseUtils';
import { usePartner } from '../../context/PartnerContext';

import ExpenseHome from './ExpenseHome';
import ExpenseForm from './ExpenseForm';
import ExpenseReports from './ExpenseReports';
import ExpenseSettingsTab from './ExpenseSettings';

type Tab = 'home' | 'add' | 'reports' | 'settings';

const ExpenseTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Partial<Expense> | undefined>();

  useEffect(() => {
    fetchData();
  }, [activePartnerId]);

  const fetchData = async () => {
    setLoading(true);
    // Strict partner isolation: only load expenses for the current active partner
    const { data: expData } = await supabase
      .from('expenses')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('date', { ascending: false });

    if (expData) setExpenses(expData.map(normalizeTransaction));
    else setExpenses([]);

    // Strict partner isolation for settings
    const { data: setObj, error } = await supabase
      .from('expense_settings')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const defaults = getDefaultExpenseSettings(activePartnerId);
    if (setObj) {
      setSettingsId(setObj.id);
      let sJson = setObj.settings_json || {};
      if (activePartnerId === 'partner_2') {
        const hasSeetha = sJson.quickAddTemplates && sJson.quickAddTemplates.some((t: any) => t.id?.startsWith('seetha'));
        if (!hasSeetha) {
          sJson = { ...sJson, quickAddTemplates: [...SEETHA_QUICK_ADD] };
        }
      }
      setSettings({ ...defaults, ...sJson });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase
        .from('expense_settings')
        .insert({ settings_json: defaults, partner_id: activePartnerId })
        .select()
        .single();
      if (newRow) setSettingsId(newRow.id);
      setSettings(defaults);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: ExpenseSettings) => {
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
    }
  };

  const handleAddExpense = async (expense: Partial<Expense>) => {
    const isInc = expense.type === 'income';
    let tags = expense.tags || '';
    if (isInc) {
      if (!tags.includes('Income')) {
        tags = tags ? `${tags}, Income` : 'Income';
      }
    } else {
      tags = tags.split(',').map(t => t.trim()).filter(t => t.toLowerCase() !== 'income' && t.toLowerCase() !== 'type:income').join(', ');
    }

    // Strip type before saving to Supabase because public.expenses has no 'type' column
    const { type: _type, ...dbFields } = expense;

    const payload = {
      ...dbFields,
      tags,
      partner_id: activePartnerId
    };

    if (expense.id) {
      await supabase
        .from('expenses')
        .update(payload)
        .eq('id', expense.id)
        .eq('partner_id', activePartnerId);
    } else {
      await supabase.from('expenses').insert(payload);
    }
    setShowAddModal(false);
    setEditExpense(undefined);
    fetchData();
    if (activeTab === 'add') setActiveTab('home');
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('partner_id', activePartnerId);
    fetchData();
  };

  const openForm = (exp?: Partial<Expense>) => {
    setEditExpense(exp);
    setShowAddModal(true);
  };

  const handleNavigate = (tab: 'home' | 'add' | 'reports' | 'settings') => {
    if (tab === 'add') {
      openForm();
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    if (activeTab === 'add') {
      openForm();
      setActiveTab('home');
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Module Sub-tabs */}
      <div className="module-subtabs">
        <button onClick={() => setActiveTab('home')} title="Home" aria-label="Home" className={`module-subtab ${activeTab === 'home' ? 'active-expense' : ''}`}>
          <Home size={20} /> <span className="label-text">Home</span>
        </button>
        <button onClick={() => openForm()} title="Add Expense" aria-label="Add Expense" className={`module-subtab ${activeTab === 'add' ? 'active-expense' : ''}`}
          style={activeTab !== 'add' ? { color: '#a78bfa' } : {}}>
          <Plus size={20} /> <span className="label-text">Add</span>
        </button>
        <button onClick={() => setActiveTab('reports')} title="Reports" aria-label="Reports" className={`module-subtab ${activeTab === 'reports' ? 'active-expense' : ''}`}>
          <ChartIcon size={20} /> <span className="label-text">Reports</span>
        </button>
        <button onClick={() => setActiveTab('settings')} title="Settings" aria-label="Settings" className={`module-subtab ${activeTab === 'settings' ? 'active-expense' : ''}`}>
          <SettingsIcon size={20} /> <span className="label-text">Settings</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'home' && (
          <ExpenseHome
            expenses={expenses}
            settings={settings}
            onAddExpense={handleAddExpense}
            onSettingsChange={handleSettingsChange}
            onNavigate={handleNavigate}
            onOpenAdd={() => openForm()}
            onEdit={openForm}
            onDelete={handleDeleteExpense}
          />
        )}
        {activeTab === 'reports' && (
          <ExpenseReports 
            expenses={expenses} 
            settings={settings} 
            onEdit={openForm}
            onDelete={handleDeleteExpense}
          />
        )}
        {activeTab === 'settings' && (
          <ExpenseSettingsTab settings={settings} onSettingsChange={handleSettingsChange} />
        )}
      </div>

      {/* Modal Form */}
      {showAddModal && (
        <ExpenseForm
          initialData={editExpense}
          settings={settings}
          onSubmit={handleAddExpense}
          onClose={() => { setShowAddModal(false); setEditExpense(undefined); }}
        />
      )}
    </div>
  );
};

export default ExpenseTracker;
