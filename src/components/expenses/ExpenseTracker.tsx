import React, { useState, useEffect } from 'react';
import { Home, Plus, PieChart as ChartIcon, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Expense, ExpenseSettings } from '../../types';
import { getDefaultExpenseSettings } from '../../data/constants';

import ExpenseHome from './ExpenseHome';
import ExpenseForm from './ExpenseForm';
import ExpenseReports from './ExpenseReports';
import ExpenseSettingsTab from './ExpenseSettings';

type Tab = 'home' | 'add' | 'reports' | 'settings';

const ExpenseTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings());
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Partial<Expense> | undefined>();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: expData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (expData) setExpenses(expData);

    const { data: setObj, error } = await supabase.from('expense_settings').select('*').limit(1).single();
    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultExpenseSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase.from('expense_settings').insert({ settings_json: getDefaultExpenseSettings() }).select().single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: ExpenseSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase.from('expense_settings').update({ settings_json: newSettings, updated_at: new Date().toISOString() }).eq('id', settingsId);
    }
  };

  const handleAddExpense = async (expense: Partial<Expense>) => {
    if (expense.id) {
      await supabase.from('expenses').update(expense).eq('id', expense.id);
    } else {
      await supabase.from('expenses').insert(expense);
    }
    setShowAddModal(false);
    setEditExpense(undefined);
    fetchData();
    if (activeTab === 'add') setActiveTab('home');
  };

  const handleDeleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    fetchData();
  };

  const openForm = (exp?: Partial<Expense>) => {
    setEditExpense(exp);
    setShowAddModal(true);
  };

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
        <button onClick={() => setActiveTab('home')} className={`module-subtab ${activeTab === 'home' ? 'active-expense' : ''}`}>
          <Home size={16} /> <span className="label-text">Home</span>
        </button>
        <button onClick={() => openForm()} className={`module-subtab ${activeTab === 'add' ? 'active-expense' : ''}`}
          style={activeTab !== 'add' ? { color: '#a78bfa' } : {}}>
          <Plus size={16} /> <span className="label-text">Add</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`module-subtab ${activeTab === 'reports' ? 'active-expense' : ''}`}>
          <ChartIcon size={16} /> <span className="label-text">Reports</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`module-subtab ${activeTab === 'settings' ? 'active-expense' : ''}`}>
          <SettingsIcon size={16} /> <span className="label-text">Settings</span>
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
            onNavigate={setActiveTab}
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
