import React, { useState, useEffect, useMemo } from 'react';
import {
  WalletCards,
  Plus,
  Landmark,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Banknote,
  MoreVertical,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AccountItem, ExpenseSettings } from '../../types';
import { getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';

const DEFAULT_ACCOUNTS: AccountItem[] = [
  { id: 'acc-1', name: 'Cash in Wallet', type: 'cash', balance: 5000, color: '#10b981', icon: '💵' },
  { id: 'acc-2', name: 'Main Salary Bank', type: 'checking', balance: 38500, color: '#0284c7', icon: '🏦' },
  { id: 'acc-3', name: 'Credit Card', type: 'credit', balance: -4500, color: '#ef4444', icon: '💳' },
  { id: 'acc-4', name: 'Emergency Savings', type: 'savings', balance: 50000, color: '#f59e0b', icon: '🪙' },
  { id: 'acc-5', name: 'Mutual Funds / Stocks', type: 'investment', balance: 75000, color: '#8b5cf6', icon: '📈' }
];

const ACCOUNT_TYPE_ICONS: Record<string, React.ReactNode> = {
  cash: <Banknote size={18} className="text-emerald-500" />,
  checking: <Landmark size={18} className="text-sky-500" />,
  credit: <CreditCard size={18} className="text-rose-500" />,
  savings: <PiggyBank size={18} className="text-amber-500" />,
  investment: <TrendingUp size={18} className="text-purple-500" />,
  other: <WalletCards size={18} className="text-slate-500" />
};

export const AccountsTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [accounts, setAccounts] = useState<AccountItem[]>(DEFAULT_ACCOUNTS);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

  // Add / Edit Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountItem['type']>('checking');
  const [formBalance, setFormBalance] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState<string>('');

  useEffect(() => {
    fetchAccounts();
  }, [activePartnerId]);

  const fetchAccounts = async () => {
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
      if (Array.isArray(sJson.customAccounts)) {
        setAccounts(sJson.customAccounts);
      } else if (activePartnerId === 'partner_1') {
        setAccounts(DEFAULT_ACCOUNTS);
      } else {
        setAccounts([]);
      }
    } else {
      setSettings(defaults);
      setAccounts(DEFAULT_ACCOUNTS);
    }
    setLoading(false);
  };

  const persistAccounts = async (updated: AccountItem[]) => {
    setAccounts(updated);
    const newSettings = { ...settings, customAccounts: updated };
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

  const totalNetWorth = useMemo(() => {
    return accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  }, [accounts]);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormName('');
    setFormType('checking');
    setFormBalance('');
    setFormNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (acc: AccountItem) => {
    setEditingAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBalance(acc.balance !== undefined ? String(acc.balance) : '');
    setFormNotes(acc.notes || '');
    setShowAddModal(true);
  };

  const handleSaveAccount = async () => {
    if (!formName.trim()) return;
    const numBalance = formBalance === '' ? 0 : Number(formBalance);
    if (isNaN(numBalance)) return;

    if (editingAccount) {
      const updated = accounts.map(a =>
        a.id === editingAccount.id
          ? { ...a, name: formName.trim(), type: formType, balance: numBalance, notes: formNotes }
          : a
      );
      await persistAccounts(updated);
    } else {
      const newAcc: AccountItem = {
        id: `acc-${Date.now()}`,
        name: formName.trim(),
        type: formType,
        balance: numBalance,
        notes: formNotes,
        updated_at: new Date().toISOString()
      };
      await persistAccounts([...accounts, newAcc]);
    }
    setShowAddModal(false);
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      const updated = accounts.filter(a => a.id !== id);
      await persistAccounts(updated);
    }
  };

  const handleExecuteTransfer = async () => {
    const amt = parseFloat(transferAmount) || 0;
    if (!transferFrom || !transferTo || transferFrom === transferTo || amt <= 0) return;

    const updated = accounts.map(a => {
      if (a.id === transferFrom) return { ...a, balance: a.balance - amt };
      if (a.id === transferTo) return { ...a, balance: a.balance + amt };
      return a;
    });

    await persistAccounts(updated);
    setShowTransferModal(false);
    setTransferAmount('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* ════════ Total Balance Banner (Native App Card) ════════ */}
      <div
        className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
      >
        <div className="space-y-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-sky-200">Total Net Balance</span>
            <h1 className="text-3xl sm:text-4xl font-black mt-0.5 tracking-tight">
              ₹{totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h1>
            <p className="text-xs text-sky-100/90 font-medium mt-1">
              Across {accounts.length} active wallets & accounts
            </p>
          </div>

          {/* Action Pills */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                if (accounts.length >= 2) {
                  setTransferFrom(accounts[0].id);
                  setTransferTo(accounts[1].id);
                }
                setShowTransferModal(true);
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-sm transition active:scale-95 cursor-pointer shadow-sm border border-white/20"
            >
              <ArrowRightLeft size={15} />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-white text-sky-900 font-extrabold text-xs shadow-md active:scale-95 transition cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* ════════ Accounts List ════════ */}
      <div className="space-y-2">
        <p
          style={{ fontSize: '11px', margin: 0 }}
          className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1"
        >
          Wallets & Bank Accounts
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map(acc => {
            const isNegative = acc.balance < 0;
            return (
              <div
                key={acc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:shadow-sm transition space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/60 flex items-center justify-center shrink-0 text-xl shadow-2xs">
                      {acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
                        {acc.name}
                      </h4>
                      <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mt-1">
                        {acc.type === 'checking' ? 'Salary / Checking' : acc.type}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      aria-label="Edit account"
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition active:scale-95 cursor-pointer"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id)}
                      aria-label="Delete account"
                      className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition active:scale-95 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Available Balance</span>
                  <p className={`font-black text-base sm:text-lg tracking-tight ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                    ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════════ Add / Edit Account Modal ════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Salary, SBI Savings, Cash"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Account Type</label>
                <select
                  value={formType}
                  onChange={e => setFormType(e.target.value as AccountItem['type'])}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="checking">Checking / Salary Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="credit">Credit Card</option>
                  <option value="investment">Investments (Stocks/MF)</option>
                  <option value="other">Other / Loan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Current Balance (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formBalance}
                  onChange={e => setFormBalance(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Primary bank for UPI"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAccount}
                style={{
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)'
                }}
                className="flex-1 rounded-xl text-white font-bold text-xs active:scale-98 transition cursor-pointer"
              >
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ Transfer Modal ════════ */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-sky-600 dark:text-sky-400" /> Transfer Between Accounts
              </h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer From</label>
                <select
                  value={transferFrom}
                  onChange={e => setTransferFrom(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer To</label>
                <select
                  value={transferTo}
                  onChange={e => setTransferTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Transfer Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-sky-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                style={{ minHeight: '44px', whiteSpace: 'nowrap' }}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={!transferAmount || parseFloat(transferAmount) <= 0 || transferFrom === transferTo}
                style={{
                  minHeight: '44px',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)'
                }}
                className="flex-1 rounded-xl disabled:opacity-50 text-white font-bold text-xs active:scale-98 transition cursor-pointer"
              >
                Complete Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsTracker;

