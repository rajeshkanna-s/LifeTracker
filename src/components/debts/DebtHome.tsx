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

const DebtHome: React.FC<DebtHomeProps> = ({ debts, settings, onEdit, onDelete, onMarkPaid, onNavigate }) => {
  const totalOutstanding = debts.reduce((s, d) => s + Number(d.current_balance), 0);
  const totalEMI = debts.reduce((s, d) => s + Number(d.emi_amount), 0);
  const totalPaid = debts.reduce((s, d) => s + Number(d.paid_amount), 0);
  const totalOriginal = debts.reduce((s, d) => s + Number(d.original_amount), 0);

  const chartData = debts.filter(d => Number(d.current_balance) > 0).map(d => ({ name: d.source, value: Number(d.current_balance) }));

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm"><Wallet size={18} /></div>
          <p className="text-sm font-semibold text-red-800 relative z-10">Total Outstanding</p>
          <p className="text-2xl font-bold text-red-950 mt-1 tracking-tight relative z-10">{settings.currencySymbol}{totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm"><CreditCard size={18} /></div>
          <p className="text-sm font-semibold text-orange-800 relative z-10">Monthly EMI</p>
          <p className="text-2xl font-bold text-orange-950 mt-1 tracking-tight relative z-10">{settings.currencySymbol}{totalEMI.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm"><TrendingDown size={18} /></div>
          <p className="text-sm font-semibold text-emerald-800 relative z-10">Total Paid</p>
          <p className="text-2xl font-bold text-emerald-950 mt-1 tracking-tight relative z-10">{settings.currencySymbol}{totalPaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {chartData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm lg:col-span-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Balance Breakdown</h3>
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
                <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                  {d.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm ${chartData.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Active Debts</h3>
            <button onClick={() => onNavigate('add')} className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">Add New</button>
          </div>
          
          {debts.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <div className="text-4xl mb-3">💳</div>
              <h4 className="text-sm font-bold text-slate-800">No debts recorded</h4>
              <p className="text-xs text-slate-500 mt-1">Add your first debt entry to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-2 font-semibold text-slate-500">Source</th>
                    <th className="pb-2 font-semibold text-slate-500">Balance</th>
                    <th className="pb-2 font-semibold text-slate-500">EMI</th>
                    <th className="pb-2 font-semibold text-slate-500">Progress</th>
                    <th className="pb-2 font-semibold text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debts.map(d => {
                    const progress = Number(d.original_amount) > 0 ? Math.round((Number(d.paid_amount) / Number(d.original_amount)) * 100) : 0;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 font-semibold text-slate-800">{d.source}</td>
                        <td className="py-3 text-red-600 font-bold">{settings.currencySymbol}{Number(d.current_balance).toLocaleString()}</td>
                        <td className="py-3 text-orange-500 font-bold">{settings.currencySymbol}{Number(d.emi_amount).toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => onMarkPaid(d)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Mark EMI Paid"><CheckCircle size={14} /></button>
                            <button onClick={() => onEdit(d)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => onDelete(d.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtHome;
