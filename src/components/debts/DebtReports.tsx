import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Debt, DebtSettings } from '../../types';

interface DebtReportsProps {
  debts: Debt[];
  settings: DebtSettings;
}

const COLORS = ['#dc2626', '#ea580c', '#f59e0b', '#16a34a', '#2563eb', '#7c3aed', '#d946ef', '#0891b2'];

const DebtReports: React.FC<DebtReportsProps> = ({ debts, settings }) => {
  const chartData = debts
    .filter(d => Number(d.current_balance) > 0)
    .map(d => ({ name: d.source, value: Number(d.current_balance) }));

  const progressData = debts.map(d => ({
    name: d.source,
    paid: Number(d.paid_amount),
    remaining: Number(d.current_balance)
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outstanding Balance Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Balance Breakdown</h3>
          {chartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">No active debts to display</div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={90} 
                    dataKey="value" 
                    paddingAngle={2}
                  >
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${settings.currencySymbol}${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-4">
            {chartData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></span>
                {d.name} ({settings.currencySymbol}{(d.value/1000).toFixed(1)}k)
              </span>
            ))}
          </div>
        </div>

        {/* Repayment Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm min-w-0">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Repayment Progress</h3>
          {progressData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">No data to display</div>
          ) : (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} hide />
                  <YAxis dataKey="name" type="category" width={84} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '12px' }}
                    formatter={(v: any, name: any) => [`${settings.currencySymbol}${Number(v).toLocaleString()}`, name === 'paid' ? 'Paid' : 'Remaining']}
                  />
                  <Bar dataKey="paid" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="remaining" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Paid</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtReports;
