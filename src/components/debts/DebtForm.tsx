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
    
    // Ensure numeric values
    const payload = {
      ...form,
      original_amount: Number(form.original_amount) || 0,
      current_balance: Number(form.current_balance) || 0,
      emi_amount: Number(form.emi_amount) || 0,
      paid_amount: Number(form.paid_amount) || 0
    };
    
    onSubmit(payload);
  };

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white transition-all";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1.5";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800">{initialData?.id ? 'Edit Debt' : 'Add New Debt'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={labelClass}>Source / Lender *</label>
            <input 
              required
              placeholder="e.g. HDFC, Personal Loan" 
              value={form.source || ''} 
              onChange={e => setForm({ ...form, source: e.target.value })} 
              className={inputClass} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Original Amount ({settings.currencySymbol}) *</label>
              <input 
                required
                type="number" 
                min="0"
                placeholder="0" 
                value={form.original_amount || ''} 
                onChange={e => setForm({ ...form, original_amount: Number(e.target.value) })} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Current Balance ({settings.currencySymbol}) *</label>
              <input 
                required
                type="number" 
                min="0"
                placeholder="0" 
                value={form.current_balance || ''} 
                onChange={e => setForm({ ...form, current_balance: Number(e.target.value) })} 
                className={inputClass} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Monthly EMI ({settings.currencySymbol})</label>
              <input 
                type="number" 
                min="0"
                placeholder="0" 
                value={form.emi_amount || ''} 
                onChange={e => setForm({ ...form, emi_amount: Number(e.target.value) })} 
                className={inputClass} 
              />
            </div>
            <div>
              <label className={labelClass}>Closing Month</label>
              <input 
                placeholder="e.g. Dec-2027" 
                value={form.closing_month || ''} 
                onChange={e => setForm({ ...form, closing_month: e.target.value })} 
                className={inputClass} 
              />
            </div>
          </div>
          
          <div>
            <label className={labelClass}>Type</label>
            <select 
              value={form.type || 'loan'} 
              onChange={e => setForm({ ...form, type: e.target.value })} 
              className={inputClass}
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
            <label className={labelClass}>Notes</label>
            <textarea 
              rows={2} 
              value={form.notes || ''} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
              className={inputClass} 
            />
          </div>
          
          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 shadow-sm shadow-red-200 transition-colors"
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
