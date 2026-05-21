import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Debt, DebtSettings } from '../../types';

interface DebtFormProps {
  initialData?: Partial<Debt>;
  settings: DebtSettings;
  onSubmit: (debt: Partial<Debt>) => void;
  onClose: () => void;
}

const DebtForm: React.FC<DebtFormProps> = ({ initialData, settings, onSubmit, onClose }) => {
  const [form, setForm] = useState<Partial<Debt>>({
    source: '',
    original_amount: 0,
    current_balance: 0,
    emi_amount: 0,
    closing_month: '',
    type: 'loan',
    notes: '',
    paid_amount: 0
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.source) return;
    
    const payload = {
      ...form,
      original_amount: Number(form.original_amount) || 0,
      current_balance: Number(form.current_balance) || 0,
      emi_amount: Number(form.emi_amount) || 0,
      paid_amount: Number(form.paid_amount) || 0
    };
    
    onSubmit(payload);
  };

  return (
    <div className="modal-overlay" style={{ '--module-accent': '#ef4444', '--module-accent-light': 'rgba(239,68,68,0.1)' } as React.CSSProperties}>
      <div className="modal-box">
        <div className="modal-header">
          <h3>{initialData?.id ? 'Edit Debt' : 'Add New Debt'}</h3>
          <button onClick={onClose} className="modal-close">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-body space-y-4">
          <div>
            <label className="label-unified">Source / Lender *</label>
            <input 
              required
              placeholder="e.g. HDFC, Personal Loan" 
              value={form.source || ''} 
              onChange={e => setForm({ ...form, source: e.target.value })} 
              className="input-unified" 
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-unified">Original Amount ({settings.currencySymbol}) *</label>
              <input 
                required
                type="number" 
                min="0"
                placeholder="0" 
                value={form.original_amount || ''} 
                onChange={e => setForm({ ...form, original_amount: Number(e.target.value) })} 
                className="input-unified" 
              />
            </div>
            <div>
              <label className="label-unified">Current Balance ({settings.currencySymbol}) *</label>
              <input 
                required
                type="number" 
                min="0"
                placeholder="0" 
                value={form.current_balance || ''} 
                onChange={e => setForm({ ...form, current_balance: Number(e.target.value) })} 
                className="input-unified" 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label-unified">Monthly EMI ({settings.currencySymbol})</label>
              <input 
                type="number" 
                min="0"
                placeholder="0" 
                value={form.emi_amount || ''} 
                onChange={e => setForm({ ...form, emi_amount: Number(e.target.value) })} 
                className="input-unified" 
              />
            </div>
            <div>
              <label className="label-unified">Closing Month</label>
              <input 
                placeholder="e.g. Dec-2027" 
                value={form.closing_month || ''} 
                onChange={e => setForm({ ...form, closing_month: e.target.value })} 
                className="input-unified" 
              />
            </div>
          </div>
          
          <div>
            <label className="label-unified">Type</label>
            <select 
              value={form.type || 'loan'} 
              onChange={e => setForm({ ...form, type: e.target.value })} 
              className="input-unified"
            >
              <option value="loan">Loan</option>
              <option value="credit_card">Credit Card</option>
              <option value="borrowed">Borrowed</option>
              {settings.customCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="label-unified">Notes</label>
            <textarea 
              rows={2} 
              value={form.notes || ''} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
              className="input-unified" 
            />
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-cancel flex-1"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit red flex-1"
            >
              {initialData?.id ? 'Update Debt' : 'Add Debt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtForm;
