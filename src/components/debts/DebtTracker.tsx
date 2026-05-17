import React, { useState, useEffect } from 'react';
import { Home, Plus, PieChart as ChartIcon, Settings as SettingsIcon, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Debt, DebtSettings, DebtPayment } from '../../types';
import { getDefaultDebtSettings } from '../../data/constants';

import DebtHome from './DebtHome';
import DebtForm from './DebtForm';
import DebtReports from './DebtReports';
import DebtSettingsTab from './DebtSettings';
import DebtEmiTracker from './DebtEmiTracker';

type Tab = 'home' | 'track' | 'add' | 'reports' | 'settings';

const DebtTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [settings, setSettings] = useState<DebtSettings>(getDefaultDebtSettings());
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Partial<Debt> | undefined>();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: dData } = await supabase.from('debts').select('*').order('created_at', { ascending: false });
    if (dData) setDebts(dData);
    
    const { data: pData } = await supabase.from('debt_payments').select('*');
    if (pData) setPayments(pData);

    const { data: setObj, error } = await supabase.from('debt_settings').select('*').limit(1).single();
    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultDebtSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase.from('debt_settings').insert({ settings_json: getDefaultDebtSettings() }).select().single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: DebtSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase.from('debt_settings').update({ settings_json: newSettings, updated_at: new Date().toISOString() }).eq('id', settingsId);
    }
  };

  const handleAddDebt = async (debt: Partial<Debt>) => {
    if (debt.id) { await supabase.from('debts').update(debt).eq('id', debt.id); }
    else { await supabase.from('debts').insert(debt); }
    setShowAddModal(false); setEditDebt(undefined); fetchData();
    if (activeTab === 'add') setActiveTab('home');
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Are you sure you want to delete this debt?')) {
      await supabase.from('debts').delete().eq('id', id); fetchData();
    }
  };

  const handleMarkPaid = async (d: Debt) => {
    setActiveTab('track'); // Redirect to new tracker tab
  };

  const handlePayEmi = async (debtId: string, monthKey: string, amount: number) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    
    const payload = { debt_id: debtId, amount, month_key: monthKey };
    const { error } = await supabase.from('debt_payments').insert(payload);
    
    if (!error) {
      const newPaid = Number(debt.paid_amount) + amount;
      const newBalance = Math.max(0, Number(debt.current_balance) - amount);
      await supabase.from('debts').update({ paid_amount: newPaid, current_balance: newBalance }).eq('id', debtId);
      fetchData();
    }
  };

  const handleUnpayEmi = async (payment: DebtPayment) => {
    const debt = debts.find(d => d.id === payment.debt_id);
    if (!debt) return;
    
    const { error } = await supabase.from('debt_payments').delete().eq('id', payment.id);
    if (!error) {
      const newPaid = Math.max(0, Number(debt.paid_amount) - Number(payment.amount));
      const newBalance = Number(debt.current_balance) + Number(payment.amount);
      await supabase.from('debts').update({ paid_amount: newPaid, current_balance: newBalance }).eq('id', debt.id);
      fetchData();
    }
  };

  const openForm = (d?: Partial<Debt>) => { setEditDebt(d); setShowAddModal(true); };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="module-subtabs">
        <button onClick={() => setActiveTab('home')} className={`module-subtab ${activeTab === 'home' ? 'active-debt' : ''}`}>
          <Home size={16} /> <span className="label-text">Home</span>
        </button>
        <button onClick={() => setActiveTab('track')} className={`module-subtab ${activeTab === 'track' ? 'active-debt' : ''}`}>
          <Calendar size={16} /> <span className="label-text">EMI Track</span>
        </button>
        <button onClick={() => openForm()} className={`module-subtab ${activeTab === 'add' ? 'active-debt' : ''}`}
          style={activeTab !== 'add' ? { color: '#ef4444' } : {}}>
          <Plus size={16} /> <span className="label-text">Add Debt</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`module-subtab ${activeTab === 'reports' ? 'active-debt' : ''}`}>
          <ChartIcon size={16} /> <span className="label-text">Reports</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`module-subtab ${activeTab === 'settings' ? 'active-debt' : ''}`}>
          <SettingsIcon size={16} /> <span className="label-text">Settings</span>
        </button>
      </div>

      <div>
        {activeTab === 'home' && (
          <DebtHome debts={debts} settings={settings} onEdit={openForm} onDelete={handleDeleteDebt} onMarkPaid={handleMarkPaid} onNavigate={setActiveTab} />
        )}
        {activeTab === 'track' && (
          <DebtEmiTracker debts={debts} payments={payments} settings={settings} onPay={handlePayEmi} onUnpay={handleUnpayEmi} />
        )}
        {activeTab === 'reports' && <DebtReports debts={debts} settings={settings} />}
        {activeTab === 'settings' && <DebtSettingsTab settings={settings} debts={debts} onSettingsChange={handleSettingsChange} />}
      </div>

      {showAddModal && (
        <DebtForm initialData={editDebt} settings={settings} onSubmit={handleAddDebt} onClose={() => { setShowAddModal(false); setEditDebt(undefined); }} />
      )}
    </div>
  );
};

export default DebtTracker;
