import React, { useMemo } from 'react';
import { Check, X, Calendar } from 'lucide-react';
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-slate-800">
            <Calendar size={18} className="text-orange-600" />
            <h3 className="text-sm font-bold">Monthly EMI Tracker</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Track and pay your EMIs month by month</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMonthOffset(prev => prev - 6)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            &larr; Prev 6 Months
          </button>
          <button 
            onClick={() => setMonthOffset(-2)}
            className="px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 rounded-lg hover:bg-orange-100 transition"
          >
            Today
          </button>
          <button 
            onClick={() => setMonthOffset(prev => prev + 6)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            Next 6 Months &rarr;
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 font-semibold text-slate-600 border-b border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-48 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Debt Source
              </th>
              {months.map(m => (
                <th key={m.key} className="p-3 font-semibold text-slate-600 text-center border-b border-slate-200 min-w-[90px]">
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
                  <td className="p-3 font-semibold text-slate-800 border-r border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] z-10 truncate max-w-[192px]">
                    <div className="flex flex-col">
                      <span className="truncate">{debt.source}</span>
                      <span className="text-[10px] text-slate-500 font-normal">EMI: {settings.currencySymbol}{Number(debt.emi_amount).toLocaleString()}</span>
                    </div>
                  </td>
                  {months.map(m => {
                    const payment = payments.find(p => p.debt_id === debt.id && p.month_key === m.key);
                    const isPaid = !!payment;

                    return (
                      <td key={m.key} className="p-2 border-r border-slate-50 last:border-r-0 text-center align-middle">
                        {isPaid ? (
                          <div 
                            className="inline-flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-md border border-emerald-100 w-full cursor-pointer hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition group"
                            onClick={() => {
                              if(confirm(`Undo payment for ${m.shortName}?`)) {
                                onUnpay(payment);
                              }
                            }}
                            title="Click to Undo Payment"
                          >
                            <span className="group-hover:hidden flex items-center justify-center gap-1 font-bold">
                              <Check size={12} /> {settings.currencySymbol}{Number(payment.amount).toLocaleString()}
                            </span>
                            <span className="hidden group-hover:flex items-center justify-center gap-1 font-bold">
                              <X size={12} /> Undo
                            </span>
                          </div>
                        ) : (
                          <button
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
                            className="inline-flex items-center justify-center text-slate-400 hover:text-orange-600 hover:bg-orange-50 px-2 py-1.5 rounded-md border border-dashed border-slate-200 hover:border-orange-200 w-full transition"
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
