import React from 'react';
import { Wallet, CreditCard, TrendingDown, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Debt, DebtSettings } from '../../types';

interface DebtHomeProps {
  debts: Debt[];
  settings: DebtSettings;
  onEdit: (d: Debt) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (d: Debt) => void;
  onNavigate: (tab: 'home' | 'add' | 'reports' | 'settings') => void;
}

const COLORS = ['#dc2626', '#ea580c', '#f59e0b', '#16a34a', '#2563eb', '#7c3aed', '#d946ef', '#0891b2'];

const formatDebtType = (type?: string): string => {
  if (!type) return 'Debt';
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

const DebtHome: React.FC<DebtHomeProps> = ({ debts, settings, onEdit, onDelete, onMarkPaid, onNavigate }) => {
  const totalOutstanding = debts.reduce((s, d) => s + Number(d.current_balance), 0);
  const totalEMI = debts.reduce((s, d) => s + Number(d.emi_amount), 0);
  const totalPaid = debts.reduce((s, d) => s + Number(d.paid_amount), 0);

  const chartData = debts.filter(d => Number(d.current_balance) > 0).map(d => ({ name: d.source, value: Number(d.current_balance) }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-rose-950/40 dark:to-red-950/40 border border-red-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 dark:bg-rose-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-10 h-10 bg-red-100 dark:bg-rose-900/60 text-red-600 dark:text-rose-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm"><Wallet size={18} /></div>
          <p className="text-sm font-semibold text-red-800 dark:text-rose-300 relative z-10">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-950 dark:text-rose-100 mt-1 tracking-tight relative z-10">{settings.currencySymbol}{totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-orange-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/50 dark:bg-amber-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-10 h-10 bg-orange-100 dark:bg-amber-900/60 text-orange-600 dark:text-amber-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm"><CreditCard size={18} /></div>
          <p className="text-sm font-semibold text-orange-800 dark:text-amber-300 relative z-10">Monthly EMI</p>
          <p className="text-2xl font-bold text-orange-950 dark:text-amber-100 mt-1 tracking-tight relative z-10">{settings.currencySymbol}{totalEMI.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm"><TrendingDown size={18} /></div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 relative z-10">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1 tracking-tight relative z-10">{settings.currencySymbol}{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm lg:col-span-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Balance Breakdown</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${settings.currencySymbol}${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
              {chartData.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm min-w-0 ${chartData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-slate-800">Active Debts</h3>
            <button type="button" onClick={() => onNavigate('add')} className="inline-flex items-center justify-center text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition shrink-0">Add New</button>
          </div>
          
          {debts.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="text-4xl mb-3">💳</div>
              <h4 className="text-sm font-bold text-slate-800">No debts recorded</h4>
              <p className="text-xs text-slate-500 mt-1">Add your first debt entry to start tracking</p>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< sm) */}
              <div className="space-y-3 sm:hidden">
                {debts.map(d => {
                  const progress = Number(d.original_amount) > 0 ? Math.round((Number(d.paid_amount) / Number(d.original_amount)) * 100) : 0;
                  return (
                    <div key={d.id} className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight truncate" title={d.source}>{d.source}</h4>
                          <span className="inline-flex items-center justify-center text-[11px] font-semibold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-full mt-1 leading-none">
                            {formatDebtType(d.type)}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-red-600">{settings.currencySymbol}{Number(d.current_balance).toLocaleString()}</p>
                          <p className="text-[10px] font-semibold text-orange-600">EMI {settings.currencySymbol}{Number(d.emi_amount).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1 font-medium">
                          <span>Paid: {settings.currencySymbol}{Number(d.paid_amount).toLocaleString()}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => onMarkPaid(d)}
                          className="px-2.5 h-8 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg inline-flex items-center justify-center gap-1 transition"
                        >
                          <CheckCircle size={14} /> Pay EMI
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(d)}
                          className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded-lg transition"
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(d.id)}
                          className="w-8 h-8 inline-flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablet / Desktop Table (>= sm) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-2 font-semibold text-slate-600">Source</th>
                      <th className="pb-2 font-semibold text-slate-600">Balance</th>
                      <th className="pb-2 font-semibold text-slate-600">EMI</th>
                      <th className="pb-2 font-semibold text-slate-600">Progress</th>
                      <th className="pb-2 font-semibold text-slate-600 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {debts.map(d => {
                      const progress = Number(d.original_amount) > 0 ? Math.round((Number(d.paid_amount) / Number(d.original_amount)) * 100) : 0;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-semibold text-slate-800">
                            <div className="flex flex-col">
                              <span>{d.source}</span>
                              <span className="text-[10px] font-medium text-slate-500">{formatDebtType(d.type)}</span>
                            </div>
                          </td>
                          <td className="py-3 text-red-600 font-bold">{settings.currencySymbol}{Number(d.current_balance).toLocaleString()}</td>
                          <td className="py-3 text-orange-600 font-bold">{settings.currencySymbol}{Number(d.emi_amount).toLocaleString()}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                              </div>
                              <span className="text-[10px] text-slate-600 font-medium">{progress}%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => onMarkPaid(d)} className="w-8 h-8 inline-flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Mark EMI Paid" aria-label="Mark EMI Paid"><CheckCircle size={14} /></button>
                              <button type="button" onClick={() => onEdit(d)} className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Edit" aria-label="Edit"><Pencil size={14} /></button>
                              <button type="button" onClick={() => onDelete(d.id)} className="w-8 h-8 inline-flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete" aria-label="Delete"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtHome;
