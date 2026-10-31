import React, { useState, useEffect } from 'react';
import { X, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Expense, ExpenseSettings, TransactionType } from '../../types';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  INCOME_PLATFORMS,
  ALL_PLATFORMS,
  PAYMENT_METHODS,
  PLATFORMS_BY_CATEGORY
} from '../../data/constants';
import { getTodayString, getCurrentTimeString } from '../../utils/expenseUtils';
import {
  isFuelCategory,
  parseFuelDetails,
  getLastOdometerReading,
  formatFuelNotes,
  DEFAULT_FUEL_PRICE_PER_LITER,
} from '../../utils/fuelUtils';

interface ExpenseFormProps {
  initialData?: Partial<Expense>;
  settings: ExpenseSettings;
  expenses?: Expense[];
  onSubmit: (expense: Partial<Expense>) => Promise<void>;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, settings, expenses = [], onSubmit, onClose }) => {
  const [type, setType] = useState<TransactionType>(
    initialData?.type || (initialData?.tags?.includes('Income') ? 'income' : 'expense')
  );

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

  // Fuel: only collect Current Odometer
  const [prevKm, setPrevKm] = useState<string>('');
  const [currentKm, setCurrentKm] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      if (initialData.type) {
        setType(initialData.type);
      } else if (initialData.tags?.includes('Income') || DEFAULT_INCOME_CATEGORIES.includes(initialData.category || '')) {
        setType('income');
      }

      setForm(prev => ({
        ...prev,
        ...initialData,
        amount: initialData.amount ? String(initialData.amount) : '',
      }));

      if (isFuelCategory(initialData.category)) {
        const parsed = parseFuelDetails(initialData);
        if (parsed.odometer) setCurrentKm(String(parsed.odometer));
        if (parsed.prevOdometer) setPrevKm(String(parsed.prevOdometer));
        if (parsed.cleanNotes) {
          setForm(prev => ({ ...prev, notes: parsed.cleanNotes }));
        }
      }
    }
  }, [initialData]);

  // When category is fuel, auto-retrieve the last odometer reading in the background
  useEffect(() => {
    if (type === 'expense' && isFuelCategory(form.category) && !prevKm) {
      const lastOdo = getLastOdometerReading(expenses, initialData?.id);
      if (lastOdo !== null) {
        setPrevKm(String(lastOdo));
      }
    }
  }, [form.category, type, expenses, initialData?.id, prevKm]);

  const allCategories = type === 'income'
    ? DEFAULT_INCOME_CATEGORIES
    : [...DEFAULT_CATEGORIES, ...settings.customCategories];

  const contextPlatforms = type === 'income'
    ? INCOME_PLATFORMS
    : (PLATFORMS_BY_CATEGORY[form.category] || [...ALL_PLATFORMS, ...settings.customPlatforms]);

  const allPayments = [...PAYMENT_METHODS, ...settings.customPaymentMethods];
  const family = ['Me', 'Spouse', 'Family', 'Other'];

  const isFuel = type === 'expense' && isFuelCategory(form.category);
  const pKm = parseFloat(prevKm);
  const cKm = parseFloat(currentKm);
  const amt = parseFloat(form.amount);

  const distance = (!isNaN(pKm) && !isNaN(cKm) && cKm > pKm) ? Number((cKm - pKm).toFixed(2)) : 0;
  const estimatedLiters = (!isNaN(amt) && amt > 0) ? Number((amt / DEFAULT_FUEL_PRICE_PER_LITER).toFixed(2)) : null;
  const mileage = (distance > 0 && estimatedLiters && estimatedLiters > 0) ? Number((distance / estimatedLiters).toFixed(2)) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;

    setLoading(true);

    let finalNotes = form.notes || '';
    let finalTags = form.tags || '';

    if (isFuel && !isNaN(cKm) && cKm > 0) {
      const parsed = parseFuelDetails({ notes: finalNotes, tags: finalTags, description: form.description });
      finalNotes = formatFuelNotes({
        currentKm: cKm,
        prevKm: !isNaN(pKm) && pKm > 0 ? pKm : null,
        distance: distance > 0 ? distance : null,
        liters: estimatedLiters,
        mileage: mileage !== null ? mileage : null,
        customNotes: parsed.cleanNotes,
      });

      if (mileage !== null) {
        const mileageTag = `Mileage: ${mileage} km/l`;
        const tagList = finalTags ? finalTags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const cleanTagList = tagList.filter(t => !/mileage/i.test(t));
        cleanTagList.push(mileageTag);
        finalTags = cleanTagList.join(', ');
      }
    }

    const finalDescription = isIncome
      ? (form.category || form.description || 'Income')
      : (form.description || 'Expense');

    await onSubmit({
      ...form,
      type,
      description: finalDescription,
      amount: Number(form.amount),
      notes: finalNotes,
      tags: finalTags,
    });
    setLoading(false);
  };

  const isIncome = type === 'income';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        '--module-accent': isIncome ? '#059669' : '#7c3aed',
        '--module-accent-light': isIncome ? 'rgba(5,150,105,0.1)' : 'rgba(124,58,237,0.1)'
      } as React.CSSProperties}
    >
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <h3>{initialData?.id ? (isIncome ? 'Edit Income' : 'Edit Expense') : (isIncome ? 'Add Income' : 'Add Expense')}</h3>
          </div>
          <button onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4">
          {/* Income vs Expense Segmented Toggle (Matte Finish with Proper Padding) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              padding: '5px',
              borderRadius: '16px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (DEFAULT_INCOME_CATEGORIES.includes(form.category)) {
                  setForm(prev => ({ ...prev, category: '', platform: '' }));
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                minHeight: '42px',
                borderRadius: '12px',
                border: 'none',
                background: !isIncome ? '#e11d48' : 'transparent',
                color: !isIncome ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: !isIncome ? '0 2px 8px rgba(225, 29, 72, 0.22)' : 'none',
                transition: 'all 0.18s ease'
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <ArrowDownLeft size={16} strokeWidth={2.4} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (DEFAULT_CATEGORIES.includes(form.category)) {
                  setForm(prev => ({ ...prev, category: '', platform: '' }));
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                minHeight: '42px',
                borderRadius: '12px',
                border: 'none',
                background: isIncome ? '#059669' : 'transparent',
                color: isIncome ? '#ffffff' : '#64748b',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: isIncome ? '0 2px 8px rgba(5, 150, 105, 0.22)' : 'none',
                transition: 'all 0.18s ease'
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <ArrowUpRight size={16} strokeWidth={2.4} />
              <span>Income</span>
            </button>
          </div>

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
            <input
              type="number"
              step="any"
              placeholder="0"
              value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})}
              className={`input-unified text-lg font-bold ${isIncome ? 'text-emerald-600 focus:border-emerald-500' : 'text-rose-600 focus:border-rose-500'}`}
              required
            />
          </div>

          {!isIncome && (
            <div>
              <label className="label-unified">What was this for?</label>
              <input
                placeholder="Short description"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="input-unified"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label-unified">{isIncome ? 'Income Source' : 'Category'}</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value, platform: ''})} className="input-unified" required>
                <option value="">Select...</option>
                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label-unified">{isIncome ? 'Received Via' : 'Platform / Shop'}</label>
              <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="input-unified">
                <option value="">Select...</option>
                {contextPlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Simple & Clean: Only Current Odometer for Fuel Expenses */}
          {isFuel && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label-unified !mb-0">Current Odometer (KM)</label>
                {prevKm && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Last: {Number(prevKm).toLocaleString()} km
                  </span>
                )}
              </div>
              <input
                type="number"
                step="any"
                placeholder={prevKm ? `e.g. ${Math.round(Number(prevKm) + 180)}` : 'e.g. 27200'}
                value={currentKm}
                onChange={e => setCurrentKm(e.target.value)}
                className="input-unified font-semibold"
              />
              {distance > 0 && mileage !== null && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
                  <span>⚡ +{distance} km</span>
                  <span>•</span>
                  <span className="font-bold">~{mileage} km/l</span>
                </p>
              )}
            </div>
          )}

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
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel flex-1"
              style={{
                minHeight: '46px',
                padding: '11px 18px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease'
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-submit flex-1"
              style={{
                minHeight: '46px',
                padding: '11px 18px',
                borderRadius: '12px',
                border: 'none',
                background: isIncome ? '#059669' : '#e11d48',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: isIncome ? '0 2px 8px rgba(5, 150, 105, 0.25)' : '0 2px 8px rgba(225, 29, 72, 0.25)',
                transition: 'all 0.15s ease',
                opacity: loading ? 0.7 : 1
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Check size={17} strokeWidth={2.5} />
                  <span>{isIncome ? 'Save Income' : 'Save Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
