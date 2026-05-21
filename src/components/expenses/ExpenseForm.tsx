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
  const family = ['Me', 'Spouse', 'Family', 'Other'];

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

  return (
    <div className="modal-overlay" onClick={onClose} style={{ '--module-accent': '#7c3aed', '--module-accent-light': 'rgba(124,58,237,0.1)' } as React.CSSProperties}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData?.id ? 'Edit Expense' : 'Add Expense'}</h3>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-unified">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-unified" required />
            </div>
            <div>
              <label className="label-unified">Time</label>
              <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="input-unified" required />
            </div>
          </div>

          <div>
            <label className="label-unified">Amount ({settings.currencySymbol})</label>
            <input type="number" placeholder="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="input-unified text-lg font-bold text-violet-600" required />
          </div>

          <div>
            <label className="label-unified">What was this for?</label>
            <input placeholder="Short description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-unified" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-unified">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value, platform: ''})} className="input-unified" required>
                <option value="">Select...</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-unified">Platform / Shop</label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="input-unified">
                <option value="">Select...</option>
                {contextPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-unified">Payment Method</label>
              <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})} className="input-unified" required>
                {allPayments.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label-unified">Person</label>
              <select value={form.person} onChange={e => setForm({...form, person: e.target.value})} className="input-unified" required>
                {family.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-unified">Tags (Comma separated)</label>
            <input placeholder="e.g. trip, office" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="input-unified" />
          </div>

          <div>
            <label className="label-unified">Notes</label>
            <textarea placeholder="Optional extra details" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input-unified" />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-submit purple flex-1 flex items-center justify-center gap-2">
              {loading ? 'Saving...' : <><Check size={16} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
