import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Clock,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Calendar,
  CheckCircle2,
  Receipt,
  Building2,
  Tag,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { WarrantyItem, ExpenseSettings } from '../../types';
import { getDefaultExpenseSettings } from '../../data/constants';
import { usePartner } from '../../context/PartnerContext';
import { formatLocalDate } from '../../utils/expenseUtils';

const DEFAULT_WARRANTIES: WarrantyItem[] = [
  {
    id: 'w-1',
    productName: 'iPhone 15 Pro',
    brand: 'Apple',
    store: 'Apple Store',
    purchaseDate: '2026-01-15',
    durationMonths: 12,
    expiryDate: '2027-01-15',
    price: 134900,
    invoiceNumber: 'INV-APL-98432',
    notes: 'AppleCare+ 1 Year Warranty'
  },
  {
    id: 'w-2',
    productName: 'Samsung 55" 4K Smart TV',
    brand: 'Samsung',
    store: 'Reliance Digital',
    purchaseDate: '2025-10-10',
    durationMonths: 24,
    expiryDate: '2027-10-10',
    price: 48990,
    invoiceNumber: 'RD-BLR-48291',
    notes: 'Panel warranty 2 years'
  }
];

export const WarrantiesTracker: React.FC = () => {
  const { activePartnerId } = usePartner();
  const [warranties, setWarranties] = useState<WarrantyItem[]>(DEFAULT_WARRANTIES);
  const [settings, setSettings] = useState<ExpenseSettings>(getDefaultExpenseSettings(activePartnerId));
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WarrantyItem | null>(null);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [store, setStore] = useState('');
  const [purchaseDate, setPurchaseDate] = useState<string>(() => formatLocalDate(new Date()));
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [price, setPrice] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchWarranties();
  }, [activePartnerId]);

  const fetchWarranties = async () => {
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
      if (Array.isArray(sJson.customWarranties)) {
        setWarranties(sJson.customWarranties);
      } else if (activePartnerId === 'partner_1') {
        setWarranties(DEFAULT_WARRANTIES);
      } else {
        setWarranties([]);
      }
    } else {
      setSettings(defaults);
      setWarranties(DEFAULT_WARRANTIES);
    }
    setLoading(false);
  };

  const persistWarranties = async (updated: WarrantyItem[]) => {
    setWarranties(updated);
    const newSettings = { ...settings, customWarranties: updated };
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

  const computeExpiry = (pDate: string, months: number) => {
    const d = new Date(pDate);
    d.setMonth(d.getMonth() + months);
    return formatLocalDate(d);
  };

  const warrantiesWithStatus = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return warranties.map(w => {
      const exp = new Date(w.expiryDate);
      exp.setHours(0, 0, 0, 0);
      const diffTime = exp.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let status: 'active' | 'expiring' | 'expired' = 'active';
      if (daysLeft < 0) status = 'expired';
      else if (daysLeft <= 30) status = 'expiring';

      return {
        ...w,
        daysLeft,
        computedStatus: status
      };
    });
  }, [warranties]);

  const activeCount = useMemo(() => warrantiesWithStatus.filter(w => w.computedStatus === 'active').length, [warrantiesWithStatus]);
  const expiringCount = useMemo(() => warrantiesWithStatus.filter(w => w.computedStatus === 'expiring').length, [warrantiesWithStatus]);

  const handleOpenAdd = (months: number = 12) => {
    setEditingItem(null);
    setProductName('');
    setBrand('');
    setStore('');
    const todayStr = formatLocalDate(new Date());
    setPurchaseDate(todayStr);
    setDurationMonths(months);
    setPrice('');
    setInvoiceNumber('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (w: WarrantyItem) => {
    setEditingItem(w);
    setProductName(w.productName);
    setBrand(w.brand || '');
    setStore(w.store || '');
    setPurchaseDate(w.purchaseDate);
    setDurationMonths(w.durationMonths);
    setPrice(w.price !== undefined && w.price !== 0 ? String(w.price) : '');
    setInvoiceNumber(w.invoiceNumber || '');
    setNotes(w.notes || '');
    setShowModal(true);
  };

  const handleSaveWarranty = async () => {
    if (!productName.trim() || !purchaseDate) return;

    const expiryDate = computeExpiry(purchaseDate, durationMonths);
    const numPrice = parseFloat(price) || 0;

    if (editingItem) {
      const updated = warranties.map(w =>
        w.id === editingItem.id
          ? {
              ...w,
              productName: productName.trim(),
              brand,
              store,
              purchaseDate,
              durationMonths,
              expiryDate,
              price: numPrice,
              invoiceNumber,
              notes
            }
          : w
      );
      await persistWarranties(updated);
    } else {
      const newItem: WarrantyItem = {
        id: `w-${Date.now()}`,
        productName: productName.trim(),
        brand,
        store,
        purchaseDate,
        durationMonths,
        expiryDate,
        price: numPrice,
        invoiceNumber,
        notes
      };
      await persistWarranties([...warranties, newItem]);
    }
    setShowModal(false);
  };

  const handleDeleteWarranty = async (id: string) => {
    if (window.confirm('Delete this warranty record?')) {
      const updated = warranties.filter(w => w.id !== id);
      await persistWarranties(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* ════════ Sharp Emerald Hero Card (Concise & Impactful) ════════ */}
      <div
        className="rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                Warranties
              </h2>
            </div>
            <p className="text-xs text-emerald-100 font-semibold mt-1.5 flex items-center gap-2">
              <span>● {activeCount} Active</span>
              {expiringCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-200">⚠️ {expiringCount} Expiring</span>
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd(12)}
            style={{
              background: '#ffffff',
              color: '#065f46',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              flexShrink: 0,
              transition: 'transform 0.15s ease'
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* ════════ Quick Presets (Compact Horizontal Pills) ════════ */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Quick Add
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '1 Year', months: 12, icon: '📱' },
            { label: '2 Years', months: 24, icon: '📺' },
            { label: '3 Years', months: 36, icon: '💻' },
            { label: '5 Years', months: 60, icon: '🚗' }
          ].map(preset => (
            <button
              key={preset.months}
              type="button"
              onClick={() => handleOpenAdd(preset.months)}
              style={{
                borderRadius: '9999px',
                padding: '6px 6px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-2xs hover:shadow-xs active:scale-95"
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span className="text-sm leading-none">{preset.icon}</span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none whitespace-nowrap">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ════════ Protected Products List ════════ */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p
            style={{ fontSize: '11px', margin: 0 }}
            className="font-bold text-slate-400 uppercase tracking-wider"
          >
            Protected Items ({warranties.length})
          </p>
        </div>

        {warrantiesWithStatus.map(w => {
          const isExpired = w.computedStatus === 'expired';
          const isExpiring = w.computedStatus === 'expiring';

          return (
            <div
              key={w.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Product Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isExpired
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                        : isExpiring
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                    }`}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
                      {w.productName}
                    </h4>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {w.brand && <span className="font-semibold text-slate-600 dark:text-slate-300">{w.brand}</span>}
                      {w.brand && w.store && <span>•</span>}
                      {w.store && <span>{w.store}</span>}
                      {w.price != null && w.price > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">₹{w.price.toLocaleString()}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(w)}
                    aria-label="Edit warranty"
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition active:scale-95 cursor-pointer"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWarranty(w.id)}
                    aria-label="Delete warranty"
                    className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition active:scale-95 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Status and Expiry Pill */}
              <div className="flex items-center justify-between text-xs bg-slate-50/80 dark:bg-slate-800/60 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 min-w-0 text-slate-500 dark:text-slate-400 font-medium">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">
                    Expires: <strong className="text-slate-800 dark:text-slate-200">{new Date(w.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                  </span>
                </div>

                <div className="shrink-0">
                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                      Expired
                    </span>
                  ) : isExpiring ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                      <AlertTriangle size={11} /> {w.daysLeft}d left
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={11} /> {w.daysLeft}d left
                    </span>
                  )}
                </div>
              </div>

              {w.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic px-1 break-words">
                  {w.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* ════════ Add / Edit Warranty Modal (Clean Mobile-First Layout) ════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 sm:p-5 w-full max-w-md shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>{editingItem ? 'Edit Warranty' : 'Add Warranty'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              {/* Product Name */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. iPhone 15 Pro, Smart TV"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                  required
                />
              </div>

              {/* Brand & Store */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Brand</label>
                  <input
                    type="text"
                    placeholder="e.g. Apple"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Store / Dealer</label>
                  <input
                    type="text"
                    placeholder="e.g. Croma"
                    value={store}
                    onChange={e => setStore(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Purchase Date (Full width so date is never clipped!) */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                  required
                />
              </div>

              {/* Duration with Quick Tap Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Duration</label>
                  <span className="font-black text-emerald-700 dark:text-emerald-400">{durationMonths} Months ({durationMonths / 12} Yrs)</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[6, 12, 24, 36, 60].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMonths(m)}
                      className={`py-1.5 text-xs font-extrabold rounded-lg border transition cursor-pointer ${
                        durationMonths === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {m >= 12 ? `${m / 12}Y` : `${m}M`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Invoice Number */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    placeholder="0"
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Invoice / Serial #</label>
                  <input
                    type="text"
                    placeholder="INV-1092"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Extended warranty coverage details"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer active:scale-97"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveWarranty}
                disabled={!productName.trim() || !purchaseDate}
                style={{
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                }}
                className="flex-1 py-3 px-4 rounded-xl border-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-97"
              >
                <Check size={17} strokeWidth={2.5} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantiesTracker;
