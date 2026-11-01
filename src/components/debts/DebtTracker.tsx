import React, { useState, useEffect } from 'react';
import { Home, Plus, PieChart as ChartIcon, Settings as SettingsIcon, Calendar, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Debt, DebtSettings, DebtPayment, Insurance } from '../../types';
import { getDefaultDebtSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';

import DebtHome from './DebtHome';
import DebtForm from './DebtForm';
import DebtReports from './DebtReports';
import DebtSettingsTab from './DebtSettings';
import DebtEmiTracker from './DebtEmiTracker';
import DebtInsurance from './DebtInsurance';

type Tab = 'home' | 'track' | 'insurance' | 'add' | 'reports' | 'settings';

const DebtTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [debts, setDebts] = useState<Debt[]>([]);
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [settings, setSettings] = useState<DebtSettings>(getDefaultDebtSettings());
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Partial<Debt> | undefined>();

  useEffect(() => {
    setDebts([]);
    setPayments([]);
    fetchData();
  }, [activePartnerId]);

  const fetchData = async () => {
    setLoading(true);
    setDebts([]);
    setPayments([]);
    // Strict partner isolation
    const { data: dData } = await supabase
      .from('debts')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('created_at', { ascending: false });

    if (dData) setDebts(dData.filter(d => !d.partner_id || d.partner_id === activePartnerId));
    else setDebts([]);
    
    const { data: pData } = await supabase
      .from('debt_payments')
      .select('*')
      .eq('partner_id', activePartnerId);

    if (pData) setPayments(pData.filter(p => !p.partner_id || p.partner_id === activePartnerId));
    else setPayments([]);

    const { data: setObj, error } = await supabase
      .from('debt_settings')
      .select('*')
      .eq('partner_id', activePartnerId)
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultDebtSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase
        .from('debt_settings')
        .insert({ settings_json: getDefaultDebtSettings(), partner_id: activePartnerId })
        .select()
        .single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: DebtSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase
        .from('debt_settings')
        .update({
          settings_json: newSettings,
          partner_id: activePartnerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId)
        .eq('partner_id', activePartnerId);
    }
  };

  const handleAddDebt = async (debt: Partial<Debt>) => {
    const payload = {
      ...debt,
      partner_id: activePartnerId
    };

    if (debt.id) {
      await supabase
        .from('debts')
        .update(payload)
        .eq('id', debt.id)
        .eq('partner_id', activePartnerId);
    } else {
      await supabase.from('debts').insert(payload);
    }
    setShowAddModal(false);
    setEditDebt(undefined);
    fetchData();
    if (activeTab === 'add') setActiveTab('home');
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Are you sure you want to delete this debt?')) {
      await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('partner_id', activePartnerId);
      fetchData();
    }
  };

  const handleMarkPaid = async (_d: Debt) => {
    setActiveTab('track');
  };

  const handlePayEmi = async (debtId: string, monthKey: string, amount: number) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    
    const payload = {
      debt_id: debtId,
      amount,
      month_key: monthKey,
      partner_id: activePartnerId
    };
    const { error } = await supabase.from('debt_payments').insert(payload);
    
    if (!error) {
      const newPaid = Number(debt.paid_amount) + amount;
      const newBalance = Math.max(0, Number(debt.current_balance) - amount);
      await supabase
        .from('debts')
        .update({ paid_amount: newPaid, current_balance: newBalance })
        .eq('id', debtId)
        .eq('partner_id', activePartnerId);
      fetchData();
    }
  };

  const handleUnpayEmi = async (payment: DebtPayment) => {
    const debt = debts.find(d => d.id === payment.debt_id);
    if (!debt) return;
    
    const { error } = await supabase
      .from('debt_payments')
      .delete()
      .eq('id', payment.id)
      .eq('partner_id', activePartnerId);

    if (!error) {
      const newPaid = Math.max(0, Number(debt.paid_amount) - Number(payment.amount));
      const newBalance = Number(debt.current_balance) + Number(payment.amount);
      await supabase
        .from('debts')
        .update({ paid_amount: newPaid, current_balance: newBalance })
        .eq('id', debt.id)
        .eq('partner_id', activePartnerId);
      fetchData();
    }
  };

  const handleSaveInsurance = async (policy: Insurance) => {
    const list = settings.insurances || [];
    let updated: Insurance[];
    if (list.some(ins => ins.id === policy.id)) {
      updated = list.map(ins => ins.id === policy.id ? policy : ins);
    } else {
      updated = [...list, policy];
    }
    const newSettings = { ...settings, insurances: updated };
    await handleSettingsChange(newSettings);
  };

  const handleDeleteInsurance = async (id: string) => {
    if (confirm('Are you sure you want to delete this insurance policy?')) {
      const list = settings.insurances || [];
      const updated = list.filter(ins => ins.id !== id);
      const newSettings = { ...settings, insurances: updated };
      await handleSettingsChange(newSettings);
    }
  };

  const openForm = (d?: Partial<Debt>) => {
    setEditDebt(d);
    setShowAddModal(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="module-subtabs">
        <button type="button" title="Home" aria-label="Home" onClick={() => setActiveTab('home')} className={`module-subtab ${activeTab === 'home' ? 'active-debt' : ''}`}>
          <Home size={16} /> <span className="label-text">Home</span>
        </button>
        <button type="button" title="EMI Track" aria-label="EMI Track" onClick={() => setActiveTab('track')} className={`module-subtab ${activeTab === 'track' ? 'active-debt' : ''}`}>
          <Calendar size={16} /> <span className="label-text">EMI Track</span>
        </button>
        <button type="button" title="Insurance" aria-label="Insurance" onClick={() => setActiveTab('insurance')} className={`module-subtab ${activeTab === 'insurance' ? 'active-debt' : ''}`}>
          <Shield size={16} /> <span className="label-text">Insurance</span>
        </button>
        <button type="button" title="Add Debt" aria-label="Add Debt" onClick={() => openForm()} className={`module-subtab ${activeTab === 'add' ? 'active-debt' : ''}`}
          style={activeTab !== 'add' ? { color: '#ef4444' } : {}}>
          <Plus size={16} /> <span className="label-text">Add Debt</span>
        </button>
        <button type="button" title="Reports" aria-label="Reports" onClick={() => setActiveTab('reports')} className={`module-subtab ${activeTab === 'reports' ? 'active-debt' : ''}`}>
          <ChartIcon size={16} /> <span className="label-text">Reports</span>
        </button>
        <button type="button" title="Settings" aria-label="Settings" onClick={() => setActiveTab('settings')} className={`module-subtab ${activeTab === 'settings' ? 'active-debt' : ''}`}>
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
        {activeTab === 'insurance' && (
          <DebtInsurance settings={settings} onSave={handleSaveInsurance} onDelete={handleDeleteInsurance} />
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
