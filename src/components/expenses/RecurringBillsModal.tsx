import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { formatLocalDate } from '../../utils/expenseUtils';
import type { Expense, ExpenseSettings } from '../../types';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  category: string;
  platform?: string;
  dueDay: number; // 1-31
  frequency: 'monthly' | 'yearly';
  isActive: boolean;
}

interface RecurringBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ExpenseSettings;
  expenses: Expense[];
  onUpdateSettings: (newSettings: Partial<ExpenseSettings>) => Promise<void>;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
}

const COMMON_RECURRING = [
  { name: 'Internet Bill', amount: 707, category: 'Internet Bill', platform: 'ACT Fibernet', dueDay: 5 },
  { name: 'Mobile Recharge', amount: 299, category: 'Mobile Recharge', platform: 'Jio / Airtel', dueDay: 15 },
  { name: 'Electricity Bill', amount: 1500, category: 'Home Maintenance', platform: 'TNEB / BESCOM', dueDay: 10 },
  { name: 'House Rent', amount: 12000, category: 'Home Maintenance', platform: 'Bank Transfer', dueDay: 1 },
  { name: 'OTT Subscriptions', amount: 499, category: 'Miscellaneous', platform: 'Netflix / Prime', dueDay: 20 },
];

export const RecurringBillsModal: React.FC<RecurringBillsModalProps> = ({
  isOpen,
  onClose,
  settings,
  expenses,
  onUpdateSettings,
  onAddExpense
}) => {
  const recurringBills: RecurringBill[] = (settings as any).recurringBills || [];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Internet Bill');
  const [platform, setPlatform] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const isBillPaidThisMonth = (bill: RecurringBill) => {
    return expenses.some(e => {
      if (!e.date || !e.date.startsWith(currentMonthPrefix)) return false;
      const descMatch = (e.description || '').toLowerCase().includes(bill.name.toLowerCase());
      const catMatch = e.category === bill.category;
      return descMatch || catMatch;
    });
  };

  const handleAddBill = async (preset?: typeof COMMON_RECURRING[0]) => {
    const finalName = preset ? preset.name : name.trim();
    const finalAmount = preset ? preset.amount : Number(amount);
    const finalCategory = preset ? preset.category : category;
    const finalPlatform = preset ? preset.platform : platform;
    const finalDueDay = preset ? preset.dueDay : Number(dueDay) || 5;

    if (!finalName || isNaN(finalAmount) || finalAmount <= 0) return;

    const newBill: RecurringBill = {
      id: `rec-${Date.now()}`,
      name: finalName,
      amount: finalAmount,
      category: finalCategory,
      platform: finalPlatform || '',
      dueDay: Math.min(31, Math.max(1, finalDueDay)),
      frequency: 'monthly',
      isActive: true
    };

    const updated = [...recurringBills, newBill];
    await onUpdateSettings({ recurringBills: updated } as any);

    setName('');
    setAmount('');
    setPlatform('');
  };

  const handleDeleteBill = async (id: string) => {
    const updated = recurringBills.filter(b => b.id !== id);
    await onUpdateSettings({ recurringBills: updated } as any);
  };

  const handleApplyToExpenses = async (bill: RecurringBill) => {
    if (!onAddExpense) return;
    const todayStr = formatLocalDate(new Date());
    const timeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

    await onAddExpense({
      type: 'expense',
      amount: bill.amount,
      category: bill.category,
      platform: bill.platform || 'Auto-Bill',
      payment_method: 'UPI',
      date: todayStr,
      time: timeStr,
      description: bill.name,
      person: 'Me',
      tags: '#recurring, Recurring Bill',
      notes: `Recurring monthly bill paid on ${todayStr}`
    });

    setJustAddedId(bill.id);
    setTimeout(() => setJustAddedId(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
            padding: '18px 16px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Repeat size={19} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                Recurring Transactions
              </h3>
              <p style={{ fontSize: '0.72rem', opacity: 0.92, margin: '2px 0 0 0', lineHeight: 1.3 }}>
                Auto-bills, fixed dues & 1-click expense logging
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Add Recurring Bill Form */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddBill();
            }}
            className="space-y-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Bill name (e.g. Internet)..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-unified min-w-0"
                style={{ fontSize: '0.84rem' }}
                required
              />
              <input
                type="number"
                placeholder="Amount (₹)..."
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="input-unified min-w-0"
                style={{ fontSize: '0.84rem' }}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="input-unified min-w-0"
                style={{ fontSize: '0.84rem' }}
              >
                <option value="Internet Bill">Internet Bill</option>
                <option value="Mobile Recharge">Mobile Recharge</option>
                <option value="Home Maintenance">Home / Rent / EB</option>
                <option value="Food">Food / Groceries</option>
                <option value="Petrol / Fuel">Fuel</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="Due Day (1-31)"
                title="Due day of month (1-31)"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="input-unified min-w-0"
                style={{ fontSize: '0.84rem' }}
              />
            </div>
            <button
              type="submit"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
              }}
              className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold leading-none cursor-pointer transition active:scale-98"
            >
              <Plus size={16} strokeWidth={2.5} className="shrink-0" />
              <span>Save Recurring Bill</span>
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Presets:</span>
            {COMMON_RECURRING.map(cr => (
              <button
                key={cr.name}
                type="button"
                onClick={() => handleAddBill(cr)}
                className="inline-flex items-center justify-center leading-none gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs hover:bg-purple-50 dark:hover:bg-purple-950/30 transition active:scale-95 cursor-pointer"
              >
                <span>{cr.name}</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">₹{cr.amount}</span>
                <span className="text-[10px] text-slate-500">({cr.dueDay}th)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recurring List */}
        <div style={{ padding: '14px 16px 18px', overflowY: 'auto', flex: 1 }} className="space-y-2.5">
          {recurringBills.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Clock size={32} className="mx-auto text-purple-400 mb-2 opacity-70" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No recurring bills added yet</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Add Internet, Rent, or Mobile recharges above to track and 1-click log every month.
              </p>
            </div>
          ) : (
            recurringBills.map(bill => {
              const isPaid = isBillPaidThisMonth(bill);
              const daysDiff = bill.dueDay - currentDay;
              const isDueToday = daysDiff === 0;
              const isDueSoon = daysDiff > 0 && daysDiff <= 3;
              const isOverdue = daysDiff < 0 && !isPaid;

              return (
                <div
                  key={bill.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition flex flex-wrap items-center justify-between gap-2.5 shadow-2xs ${
                    isPaid
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/60'
                      : isDueToday || isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex-1 min-w-[165px]">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-tight truncate min-w-0">
                        {bill.name}
                      </h4>
                      {isPaid ? (
                        <span className="inline-flex items-center justify-center leading-none gap-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                          <CheckCircle2 size={11} className="shrink-0" /> Paid
                        </span>
                      ) : isDueToday ? (
                        <span className="inline-flex items-center justify-center leading-none text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 shrink-0">
                          Due Today
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center justify-center leading-none text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 shrink-0">
                          Due {Math.abs(daysDiff)}d ago
                        </span>
                      ) : isDueSoon ? (
                        <span className="inline-flex items-center justify-center leading-none text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 shrink-0">
                          In {daysDiff} days
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {bill.dueDay}th of month
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center flex-wrap gap-x-1.5 gap-y-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">₹{Number(bill.amount).toLocaleString()}</span>
                      <span>•</span>
                      <span>{bill.category}</span>
                      {bill.platform && (
                        <>
                          <span>•</span>
                          <span>{bill.platform}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleApplyToExpenses(bill)}
                      style={{ borderRadius: '10px' }}
                      className={`min-h-[34px] px-3 py-1.5 text-xs font-bold leading-none transition active:scale-95 cursor-pointer shadow-2xs inline-flex items-center justify-center gap-1 shrink-0 ${
                        justAddedId === bill.id
                          ? 'bg-emerald-600 text-white'
                          : isPaid
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {justAddedId === bill.id ? (
                        <>
                          <CheckCircle2 size={13} className="shrink-0" /> Logged!
                        </>
                      ) : isPaid ? (
                        'Log Again'
                      ) : (
                        <>
                          <Plus size={13} className="shrink-0" /> Log Paid
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${bill.name}`}
                      title="Delete recurring bill"
                      onClick={() => handleDeleteBill(bill.id)}
                      className="w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RecurringBillsModal;

