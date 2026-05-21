import React, { useState } from 'react';
import { Calculator, Settings, RefreshCw, XCircle, ChevronDown, ChevronRight, Coins } from 'lucide-react';
import type { DebtSettings, Debt } from '../../types';
import { CURRENCIES, DEBT_CATEGORIES } from '../../data/constants';
import { Download } from 'lucide-react';

interface DebtSettingsProps {
  settings: DebtSettings;
  debts: Debt[];
  onSettingsChange: (s: DebtSettings) => void;
}

const Section: React.FC<{
  id: string; title: string; Icon: any; badge?: number | string;
  open: string; setOpen: (v: string) => void; children: React.ReactNode;
}> = ({ id, title, Icon, badge, open, setOpen, children }) => (
  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mb-3">
    <button onClick={() => setOpen(open === id ? '' : id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-red-600" />
        </div>
        <span className="font-medium text-slate-800 text-sm">{title}</span>
        {badge !== undefined && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{badge}</span>}
      </div>
      {open === id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
    </button>
    {open === id && <div className="p-4 pt-0 border-t border-slate-100">{children}</div>}
  </div>
);

const DebtSettingsTab: React.FC<DebtSettingsProps> = ({ settings, debts, onSettingsChange }) => {
  const [openSection, setOpenSection] = useState('currency');
  const [newCategory, setNewCategory] = useState('');

  const [calcPrincipal, setCalcPrincipal] = useState('');
  const [calcRate, setCalcRate] = useState('');
  const [calcTenure, setCalcTenure] = useState('');

  const update = (partial: Partial<DebtSettings>) => onSettingsChange({ ...settings, ...partial });



  const calculateEMI = (principal: number, ratePerAnnum: number, months: number): number => {
    if (ratePerAnnum === 0) return Math.round(principal / months);
    const r = ratePerAnnum / 12 / 100;
    return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  };

  const emiResult = calcPrincipal && calcRate && calcTenure ? (() => {
    const p = parseFloat(calcPrincipal); const r = parseFloat(calcRate); const t = parseInt(calcTenure);
    if (p > 0 && r >= 0 && t > 0) {
      const emi = calculateEMI(p, r, t);
      const totalPayable = emi * t;
      const totalInterest = totalPayable - p;
      return { emi, totalPayable, totalInterest };
    }
    return null;
  })() : null;

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      {/* Currency */}
      <Section id="currency" title="Currency" Icon={Coins} open={openSection} setOpen={setOpenSection}>
        <div className="space-y-2 pt-4">
          <label className="text-xs font-medium text-slate-600 block">Select Currency</label>
          <select value={settings.currency} onChange={e => {
            const curr = CURRENCIES.find(c => c.code === e.target.value);
            if (curr) update({ currency: curr.code, currencySymbol: curr.symbol });
          }} className="input-unified">
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.name} ({c.code})</option>)}
          </select>
        </div>
      </Section>

      {/* Income & Reminders */}
      <Section id="income" title="Income & Reminders" Icon={Settings} open={openSection} setOpen={setOpenSection}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Monthly Income ({settings.currencySymbol})</label>
            <input type="number" min={0} value={settings.monthlyIncome || ''} onChange={e => update({ monthlyIncome: parseFloat(e.target.value) || 0 })} className="input-unified" placeholder="e.g., 50000" />
            <p className="text-[10px] text-slate-400 mt-1">Used for Debt-to-Income ratio</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">EMI Reminder Days</label>
            <input type="number" min={1} max={30} value={settings.reminderDays || 7} onChange={e => update({ reminderDays: parseInt(e.target.value) || 7 })} className="input-unified" />
            <p className="text-[10px] text-slate-400 mt-1">Alert when EMI is due</p>
          </div>
        </div>
      </Section>

      {/* Custom Categories */}
      <Section id="categories" title="Debt Categories" Icon={Settings} badge={DEBT_CATEGORIES.length + settings.customCategories.length} open={openSection} setOpen={setOpenSection}>
        <div className="space-y-3 pt-4">
          <div className="flex gap-2">
            <input placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-unified" />
            <button onClick={() => { if (newCategory.trim()) { update({ customCategories: [...settings.customCategories, newCategory.trim()] }); setNewCategory(""); } }} className="h-[38px] px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEBT_CATEGORIES.map(c => <span key={c} className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">{c}</span>)}
            {settings.customCategories.map(c => (
              <span key={c} className="bg-red-50 border border-red-200 text-red-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                {c} <button onClick={() => update({ customCategories: settings.customCategories.filter(x => x !== c) })} className="text-red-500 hover:text-red-700"><XCircle size={12} /></button>
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* EMI Calculator */}
      <Section id="calculator" title="EMI Calculator" Icon={Calculator} open={openSection} setOpen={setOpenSection}>
        <div className="bg-red-50 rounded-xl p-4 mt-4 space-y-3 border border-red-100">
          <h4 className="text-xs font-bold text-red-800">EMI Calculator (Reducing Balance)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-red-700 mb-1 block">Loan Amount</label>
              <input type="number" placeholder="1000000" value={calcPrincipal} onChange={e => setCalcPrincipal(e.target.value)} className="input-unified" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-red-700 mb-1 block">Rate (% p.a.)</label>
              <input type="number" step="0.1" placeholder="8.5" value={calcRate} onChange={e => setCalcRate(e.target.value)} className="input-unified" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-red-700 mb-1 block">Tenure (months)</label>
              <input type="number" placeholder="60" value={calcTenure} onChange={e => setCalcTenure(e.target.value)} className="input-unified" />
            </div>
          </div>
          {emiResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-semibold mb-1">Monthly EMI</p>
                <p className="text-sm font-bold text-red-600">{settings.currencySymbol}{emiResult.emi.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-semibold mb-1">Total Interest</p>
                <p className="text-sm font-bold text-orange-500">{settings.currencySymbol}{emiResult.totalInterest.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-semibold mb-1">Total Payable</p>
                <p className="text-sm font-bold text-slate-800">{settings.currencySymbol}{emiResult.totalPayable.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
};

export default DebtSettingsTab;
