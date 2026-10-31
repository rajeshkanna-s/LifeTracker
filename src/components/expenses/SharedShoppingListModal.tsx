import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  User,
  DollarSign,
  ArrowRight,
  PackageCheck,
  Sparkles,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePartner } from '../../context/PartnerContext';
import { formatLocalDate } from '../../utils/expenseUtils';
import type { Expense } from '../../types';

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  estimatedAmount?: number;
  addedBy: string;
  isBought: boolean;
  boughtBy?: string;
  boughtAmount?: number;
  boughtDate?: string;
}

interface SharedShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense?: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
}

const COMMON_ITEMS = [
  { name: 'Milk / Dairy', category: 'Grocery', price: 60, icon: '🥛' },
  { name: 'Vegetables', category: 'Vegetables', price: 200, icon: '🥬' },
  { name: 'Fruits / Banana', category: 'Grocery', price: 100, icon: '🍌' },
  { name: 'Eggs (Pack of 6/12)', category: 'Grocery', price: 90, icon: '🥚' },
  { name: 'Rice / Provisions', category: 'Grocery', price: 800, icon: '🍚' },
  { name: 'Cooking Oil', category: 'Grocery', price: 180, icon: '🫒' },
  { name: 'Snacks / Biscuits', category: 'Food', price: 80, icon: '🍪' },
  { name: 'Cleaning / Soap', category: 'Home Maintenance', price: 120, icon: '🧼' },
];

export const SharedShoppingListModal: React.FC<SharedShoppingListModalProps> = ({
  isOpen,
  onClose,
  onAddExpense
}) => {
  const { activePartner, activePartnerId } = usePartner();
  const partnerName = activePartner?.name || (activePartnerId === 'partner_1' ? 'Rajesh' : 'Mia');

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Grocery');
  const [estimatedPrice, setEstimatedPrice] = useState('');

  // Buying prompt state
  const [buyingItem, setBuyingItem] = useState<ShoppingItem | null>(null);
  const [actualAmount, setActualAmount] = useState('');
  const [logAsExpense, setLogAsExpense] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSharedList();
    }
  }, [isOpen]);

  const loadSharedList = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('expense_settings')
        .select('settings_json')
        .eq('partner_id', 'partner_1')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (data?.settings_json?.sharedShoppingList) {
        setItems(data.settings_json.sharedShoppingList);
      } else {
        // Fallback default sample if empty
        setItems([]);
      }
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  const syncListToBothPartners = async (updated: ShoppingItem[]) => {
    setItems(updated);
    try {
      const { data: p1Row } = await supabase
        .from('expense_settings')
        .select('*')
        .eq('partner_id', 'partner_1')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (p1Row) {
        const p1Settings = { ...(p1Row.settings_json || {}), sharedShoppingList: updated };
        await supabase
          .from('expense_settings')
          .update({ settings_json: p1Settings, updated_at: new Date().toISOString() })
          .eq('id', p1Row.id);
      }

      const { data: p2Row } = await supabase
        .from('expense_settings')
        .select('*')
        .eq('partner_id', 'partner_2')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (p2Row) {
        const p2Settings = { ...(p2Row.settings_json || {}), sharedShoppingList: updated };
        await supabase
          .from('expense_settings')
          .update({ settings_json: p2Settings, updated_at: new Date().toISOString() })
          .eq('id', p2Row.id);
      }
    } catch (e) {
      console.error('Error syncing shared shopping list:', e);
    }
  };

  const handleAddItem = async (name?: string, cat?: string, price?: number) => {
    const finalName = (name || itemName).trim();
    if (!finalName) return;

    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}`,
      name: finalName,
      category: cat || itemCategory || 'Grocery',
      estimatedAmount: price !== undefined ? price : Number(estimatedPrice) || undefined,
      addedBy: partnerName,
      isBought: false
    };

    const updated = [newItem, ...items];
    await syncListToBothPartners(updated);

    setItemName('');
    setEstimatedPrice('');
  };

  const handleOpenBuyPrompt = (item: ShoppingItem) => {
    if (item.isBought) {
      // Toggle back to unbought
      const updated = items.map(i =>
        i.id === item.id
          ? { ...i, isBought: false, boughtBy: undefined, boughtAmount: undefined, boughtDate: undefined }
          : i
      );
      syncListToBothPartners(updated);
      return;
    }

    setBuyingItem(item);
    setActualAmount(item.estimatedAmount ? String(item.estimatedAmount) : '');
    setLogAsExpense(true);
  };

  const handleConfirmBuy = async () => {
    if (!buyingItem) return;
    const finalAmt = Number(actualAmount) || buyingItem.estimatedAmount || 0;
    const today = formatLocalDate(new Date());

    const updated = items.map(i =>
      i.id === buyingItem.id
        ? {
          ...i,
          isBought: true,
          boughtBy: partnerName,
          boughtAmount: finalAmt,
          boughtDate: today
        }
        : i
    );

    await syncListToBothPartners(updated);

    // Auto-create expense record in active partner's expenses
    if (logAsExpense && onAddExpense && finalAmt > 0) {
      const timeStr = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      await onAddExpense({
        type: 'expense',
        amount: finalAmt,
        category: buyingItem.category || 'Grocery',
        platform: 'Local Market',
        payment_method: 'UPI',
        date: today,
        time: timeStr,
        description: buyingItem.name,
        person: partnerName,
        tags: '#shared, Shopping List',
        notes: `Bought from shared shopping list by ${partnerName}`
      });
    }

    setBuyingItem(null);
  };

  const handleDeleteItem = async (id: string) => {
    const updated = items.filter(i => i.id !== id);
    await syncListToBothPartners(updated);
  };

  const handleClearBought = async () => {
    const updated = items.filter(i => !i.isBought);
    await syncListToBothPartners(updated);
  };

  if (!isOpen) return null;

  const pendingItems = items.filter(i => !i.isBought);
  const boughtItems = items.filter(i => i.isBought);

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
            background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
            padding: '18px 20px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingCart size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>
                  Shared Shopping List
                </h3>
                <span
                  style={{
                    fontSize: '0.66rem',
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 8px',
                    borderRadius: '99px',
                    fontWeight: 700
                  }}
                >
                  Rajesh 🤝 Mia
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', opacity: 0.9, margin: '2px 0 0 0' }}>
                Shared in real-time. Checking an item auto-adds an expense!
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
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleAddItem();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Add grocery or household item..."
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-emerald-500 shadow-2xs"
            />
            <input
              type="number"
              placeholder="Est. ₹"
              value={estimatedPrice}
              onChange={e => setEstimatedPrice(e.target.value)}
              className="w-20 sm:w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 text-center outline-none focus:border-emerald-500 shadow-2xs shrink-0"
            />
            <button
              type="submit"
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.28)'
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white font-extrabold text-xs shrink-0 active:scale-95 transition cursor-pointer shadow-xs min-h-[38px]"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add</span>
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick Add:</span>
            {COMMON_ITEMS.map(ci => (
              <button
                key={ci.name}
                type="button"
                onClick={() => handleAddItem(ci.name, ci.category, ci.price)}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 shadow-2xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition active:scale-95 cursor-pointer"
              >
                <span>{ci.icon}</span>
                <span>{ci.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">₹{ci.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-4">
          {/* Pending to Buy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                To Buy ({pendingItems.length})
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Auto-syncs in real-time</span>
            </div>

            {pendingItems.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                <PackageCheck size={28} className="mx-auto text-emerald-500 mb-1" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">All groceries & items are bought!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Type above or tap quick suggestions to add items.</p>
              </div>
            ) : (
              pendingItems.map(item => (
                <div
                  key={item.id}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-300 dark:hover:border-emerald-700 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleOpenBuyPrompt(item)}
                      title="Click when bought (auto-records expense)"
                      className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-center transition cursor-pointer shrink-0 group active:scale-90"
                    >
                      <Check size={12} className="text-transparent group-hover:text-emerald-500 transition" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 leading-none">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>Added by <strong className="font-semibold text-slate-600 dark:text-slate-300">{item.addedBy}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.estimatedAmount && (
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/80 dark:border-emerald-800/40">
                        ₹{item.estimatedAmount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenBuyPrompt(item)}
                      style={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.28)'
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-xs"
                    >
                      <Check size={12} strokeWidth={2.5} />
                      <span>Bought</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Remove item"
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Already Bought */}
          {boughtItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-0.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Bought Items ({boughtItems.length})
                </h4>
                <button
                  type="button"
                  onClick={handleClearBought}
                  className="text-[11px] font-bold text-rose-500 hover:text-rose-700 cursor-pointer"
                >
                  Clear Completed
                </button>
              </div>

              {boughtItems.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 opacity-80"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleOpenBuyPrompt(item)}
                      title="Mark as unbought"
                      className="text-emerald-600 cursor-pointer"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 line-through truncate leading-snug">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Bought by {item.boughtBy || 'Partner'} {item.boughtAmount ? `• ₹${item.boughtAmount}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bought Confirm Modal Popover */}
        {buyingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1200
            }}
            onClick={() => setBuyingItem(null)}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '20px',
                padding: '20px',
                maxWidth: '360px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px auto'
                  }}
                >
                  <PackageCheck size={24} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                  Mark "{buyingItem.name}" as Bought
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem', color: '#64748b' }}>
                  Purchased by <span style={{ fontWeight: 700, color: '#059669' }}>{partnerName}</span>
                </p>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="label-unified">Actual Amount Paid (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={actualAmount}
                  onChange={e => setActualAmount(e.target.value)}
                  className="input-unified font-bold text-base"
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#334155'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={logAsExpense}
                    onChange={e => setLogAsExpense(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#059669' }}
                  />
                  <span>Auto-add ₹{actualAmount || '0'} to {partnerName}'s Expenses</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setBuyingItem(null)}
                  style={{
                    flex: 1,
                    minHeight: '40px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBuy}
                  style={{
                    flex: 1,
                    minHeight: '40px',
                    borderRadius: '12px',
                    background: '#059669',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(5,150,105,0.3)'
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedShoppingListModal;

