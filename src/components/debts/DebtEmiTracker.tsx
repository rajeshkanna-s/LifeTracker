import React, { useMemo } from 'react';
import { Check, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Debt, DebtSettings, DebtPayment } from '../../types';

interface DebtEmiTrackerProps {
  debts: Debt[];
  payments: DebtPayment[];
  settings: DebtSettings;
  onPay: (debtId: string, monthKey: string, amount: number) => void;
  onUnpay: (payment: DebtPayment) => void;
}

const DebtEmiTracker: React.FC<DebtEmiTrackerProps> = ({ debts, payments, settings, onPay, onUnpay }) => {
  const [monthOffset, setMonthOffset] = React.useState(-2);

  const months = useMemo(() => {
    const result = [];
    const date = new Date();
    date.setMonth(date.getMonth() + monthOffset);
    
    for (let i = 0; i < 12; i++) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const key = `${year}-${monthStr}`;
      
      const shortName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // e.g., "Mar 26"
      result.push({ key, shortName });
      
      date.setMonth(date.getMonth() + 1);
    }
    return result;
  }, [monthOffset]);

  const activeDebts = debts.filter(d => Number(d.current_balance) > 0 || Number(d.original_amount) === 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-amber-950/60 flex items-center justify-center text-orange-600 dark:text-amber-400 shrink-0 shadow-xs">
            <Calendar size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">Monthly EMI Tracker</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Track and pay your EMIs month by month</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs w-full sm:w-auto">
          <button 
            type="button"
            onClick={() => setMonthOffset(prev => prev - 6)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600 active:scale-95 transition whitespace-nowrap"
            title="Previous 6 months"
          >
            <ChevronLeft size={14} />
            <span>Prev 6M</span>
          </button>
          <button 
            type="button"
            onClick={() => setMonthOffset(-2)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-orange-600 dark:text-amber-400 bg-orange-50 dark:bg-amber-950/50 hover:bg-orange-100 dark:hover:bg-amber-900/50 rounded-lg border border-orange-200/80 dark:border-amber-800/60 active:scale-95 transition whitespace-nowrap"
            title="Current month"
          >
            Current
          </button>
          <button 
            type="button"
            onClick={() => setMonthOffset(prev => prev + 6)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg shadow-xs border border-slate-200/60 dark:border-slate-600 active:scale-95 transition whitespace-nowrap"
            title="Next 6 months"
          >
            <span>Next 6M</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2.5 sm:p-3 font-semibold text-slate-700 border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-32 sm:w-48 max-w-[128px] sm:max-w-[192px] truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Debt Source
              </th>
              {months.map(m => (
                <th key={m.key} className="p-2.5 sm:p-3 font-semibold text-slate-600 text-center border-b border-slate-200 min-w-[84px] sm:min-w-[90px]">
                  {m.shortName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeDebts.length === 0 ? (
              <tr>
                <td colSpan={months.length + 1} className="p-8 text-center text-slate-500">
                  No active debts to track.
                </td>
              </tr>
            ) : (
              activeDebts.map(debt => (
                <tr key={debt.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-2.5 sm:p-3 font-semibold text-slate-800 border-r border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] z-10 w-32 sm:w-48 max-w-[128px] sm:max-w-[192px] truncate">
                    <div className="flex flex-col min-w-0">
                      <span className="truncate" title={debt.source}>{debt.source}</span>
                      <span className="text-[10px] text-slate-500 font-normal truncate">EMI: {settings.currencySymbol}{Number(debt.emi_amount).toLocaleString()}</span>
                    </div>
                  </td>
                  {months.map(m => {
                    const payment = payments.find(p => p.debt_id === debt.id && p.month_key === m.key);
                    const isPaid = !!payment;

                    return (
                      <td key={m.key} className="p-2 border-r border-slate-50 last:border-r-0 text-center align-middle">
                        {isPaid ? (
                          <div 
                            className="inline-flex items-center justify-center leading-none gap-1 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-md border border-emerald-200/80 w-full cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition group"
                            onClick={() => {
                              if(confirm(`Undo payment for ${m.shortName}?`)) {
                                onUnpay(payment);
                              }
                            }}
                            title="Click to Undo Payment"
                          >
                            <span className="group-hover:hidden inline-flex items-center justify-center gap-1 font-bold leading-none">
                              <Check size={12} /> {settings.currencySymbol}{Number(payment.amount).toLocaleString()}
                            </span>
                            <span className="hidden group-hover:inline-flex items-center justify-center gap-1 font-bold leading-none">
                              <X size={12} /> Undo
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const val = window.prompt(`Enter amount paid for ${m.shortName}:`, debt.emi_amount.toString());
                              if (val !== null) {
                                const num = parseFloat(val);
                                if (!isNaN(num) && num > 0) {
                                  onPay(debt.id, m.key, num);
                                } else {
                                  alert('Please enter a valid amount.');
                                }
                              }
                            }}
                            className="inline-flex items-center justify-center leading-none text-slate-600 font-semibold hover:text-orange-600 hover:bg-orange-50 px-2 py-1.5 rounded-md border border-dashed border-slate-300 hover:border-orange-300 w-full transition"
                            title="Mark as Paid"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebtEmiTracker;
