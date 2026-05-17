import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { Expense, ExpenseSettings } from '../../types';
import { DEFAULT_CATEGORIES, ALL_PLATFORMS, PAYMENT_METHODS, PLATFORMS_BY_CATEGORY } from '../../data/constants';
import { getTodayString, getCurrentTimeString } from '../../utils/expenseUtils';

interface ExpenseFormProps {
  initialData?: Partial<Expense>;
  settings: ExpenseSettings;
  onSubmit: (expense: Partial<Expense>) => Promise<void>;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, settings, onSubmit, onClose }) => {
  const [form, setForm] = useState({
    amount: '',
    category: '',
    platform: '',
    payment_method: 'UPI',
    date: getTodayString(),
    time: getCurrentTimeString(),
    description: '',
    person: 'Me',
    tags: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        ...initialData,
        amount: initialData.amount ? String(initialData.amount) : '',
      }));
    }
  }, [initialData]);

  const allCategories = [...DEFAULT_CATEGORIES, ...settings.customCategories];
  const contextPlatforms = PLATFORMS_BY_CATEGORY[form.category] || [...ALL_PLATFORMS, ...settings.customPlatforms];
  const allPayments = [...PAYMENT_METHODS, ...settings.customPaymentMethods];
  const family = ['Me', 'Spouse', 'Family', 'Other']; // Could also come from settings

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    
    setLoading(true);
    await onSubmit({
      ...form,
      amount: Number(form.amount)
    });
    setLoading(false);
  };

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-teal-50">
          <h3 className="font-bold text-slate-800">{initialData?.id ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white rounded-lg text-slate-500"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputClass} required />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Time</label>
              <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount ({settings.currencySymbol})</label>
            <input type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className={`${inputClass} text-lg font-bold text-emerald-600`} required />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">What was this for?</label>
            <input placeholder="Short description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={inputClass} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value, platform: ''})} className={inputClass} required>
                <option value="">Select...</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Platform / Shop</label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className={inputClass}>
                <option value="">Select...</option>
                {contextPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className={inputClass} required>
                {allPayments.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Person</label>
              <select value={form.person} onChange={e => setForm({...form, person: e.target.value})} className={inputClass} required>
                {family.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tags (Comma separated)</label>
            <input placeholder="e.g. trip, office" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className={inputClass} />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes</label>
            <textarea placeholder="Optional extra details" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={inputClass} />
          </div>

          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Saving...' : <><Check size={16} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
