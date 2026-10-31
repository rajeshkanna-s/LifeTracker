import React, { useState, useMemo } from 'react';
import {
  Calculator as CalcIcon,
  Percent,
  Landmark,
  BadgePercent,
  TrendingUp,
  Delete,
  Wallet,
  Clock,
  Receipt,
  Zap
} from 'lucide-react';

type CalcTab = 'basic' | 'emi' | 'loan' | 'gst' | 'interest';

// ══════════════════════════════════════════════════════════════
// CLEAN, ALIGNED CALCULATOR FIELD (Groww / Zerodha Style)
// ══════════════════════════════════════════════════════════════
interface CalcFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  minLabel?: string;
  maxLabel?: string;
  unitToggle?: { options: string[]; active: string; onChange: (opt: string) => void };
}

const CalcField: React.FC<CalcFieldProps> = ({
  label,
  icon,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix = '',
  suffix = '',
  minLabel,
  maxLabel,
  unitToggle
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition hover:border-slate-300">
      {/* Top Header: Label & Input Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            {icon}
          </div>
          <span className="text-sm font-bold text-slate-800 truncate">{label}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unitToggle && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {unitToggle.options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => unitToggle.onChange(opt)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                    unitToggle.active === opt
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
            {prefix && <span className="text-xs font-black text-emerald-700 mr-1">{prefix}</span>}
            <input
              type="number"
              min={min}
              max={max}
              step={step}
              value={Number.isFinite(value) ? value : 0}
              onChange={e => {
                const n = parseFloat(e.target.value);
                onChange(isNaN(n) ? 0 : n);
              }}
              className="w-20 sm:w-26 text-right font-black text-sm text-slate-900 outline-none bg-transparent"
            />
            {suffix && <span className="text-xs font-bold text-slate-500 ml-1">{suffix}</span>}
          </div>
        </div>
      </div>

      {/* Slider */}
      <div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="calc-range-slider"
        />
        <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1.5 px-0.5">
          <span>{minLabel || `${prefix}${min.toLocaleString('en-IN')}${suffix}`}</span>
          <span>{maxLabel || `${prefix}${max.toLocaleString('en-IN')}${suffix}`}</span>
        </div>
      </div>
    </div>
  );
};

export const CalculatorHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalcTab>('basic');

  // ══════════════════════════════════════════════════════════════
  // 1. BASIC ARITHMETIC CALCULATOR
  // ══════════════════════════════════════════════════════════════
  const [basicDisplay, setBasicDisplay] = useState('0');
  const [basicExpr, setBasicExpr] = useState('');
  const [hasEvaluated, setHasEvaluated] = useState(false);

  const handleBasicInput = (val: string) => {
    if (hasEvaluated) {
      if (['+', '-', '×', '÷', '%'].includes(val)) {
        setBasicExpr(basicDisplay + ' ' + val + ' ');
        setHasEvaluated(false);
        return;
      } else {
        setBasicDisplay(val);
        setBasicExpr('');
        setHasEvaluated(false);
        return;
      }
    }

    if (val === 'AC') {
      setBasicDisplay('0');
      setBasicExpr('');
      setHasEvaluated(false);
      return;
    }

    if (val === 'DEL') {
      if (basicDisplay.length <= 1 || basicDisplay === '0') {
        setBasicDisplay('0');
      } else {
        setBasicDisplay(prev => prev.slice(0, -1));
      }
      return;
    }

    if (['+', '-', '×', '÷'].includes(val)) {
      setBasicExpr(prev => prev + basicDisplay + ' ' + val + ' ');
      setBasicDisplay('0');
      return;
    }

    if (val === '%') {
      const num = parseFloat(basicDisplay);
      if (!isNaN(num)) {
        setBasicDisplay((num / 100).toString());
      }
      return;
    }

    if (val === '=') {
      try {
        const fullExpr = basicExpr + basicDisplay;
        const sanitized = fullExpr.replace(/×/g, '*').replace(/÷/g, '/');
        const result = Function(`'use strict'; return (${sanitized})`)();
        const formatted = Number.isFinite(result)
          ? Number(result.toFixed(8)).toString()
          : 'Error';
        setBasicExpr(fullExpr + ' =');
        setBasicDisplay(formatted);
        setHasEvaluated(true);
      } catch {
        setBasicDisplay('Error');
        setHasEvaluated(true);
      }
      return;
    }

    if (val === '.') {
      if (!basicDisplay.includes('.')) {
        setBasicDisplay(prev => prev + '.');
      }
      return;
    }

    if (val === '00') {
      if (basicDisplay !== '0') {
        setBasicDisplay(prev => prev + '00');
      }
      return;
    }

    if (basicDisplay === '0') {
      setBasicDisplay(val);
    } else {
      setBasicDisplay(prev => prev + val);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // 2. EMI CALCULATOR
  // ══════════════════════════════════════════════════════════════
  const [emiAmount, setEmiAmount] = useState<number>(500000);
  const [emiRate, setEmiRate] = useState<number>(9.5);
  const [emiTenure, setEmiTenure] = useState<number>(5);
  const [emiTenureType, setEmiTenureType] = useState<'years' | 'months'>('years');

  const emiResults = useMemo(() => {
    const P = emiAmount || 0;
    const r = (emiRate || 0) / 12 / 100;
    const n = emiTenureType === 'years' ? (emiTenure || 0) * 12 : (emiTenure || 0);

    if (P <= 0 || r <= 0 || n <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayment: P, principalPct: 100, interestPct: 0 };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const principalPct = Math.round((P / totalPayment) * 100);
    const interestPct = 100 - principalPct;

    return {
      monthlyEmi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment),
      principalPct,
      interestPct
    };
  }, [emiAmount, emiRate, emiTenure, emiTenureType]);

  // ══════════════════════════════════════════════════════════════
  // 3. LOAN CALCULATOR (Eligibility & Prepayment)
  // ══════════════════════════════════════════════════════════════
  const [loanMode, setLoanMode] = useState<'eligibility' | 'prepayment'>('eligibility');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(60000);
  const [existingEmi, setExistingEmi] = useState<number>(10000);
  const [eligibilityRate, setEligibilityRate] = useState<number>(8.5);
  const [eligibilityTenure, setEligibilityTenure] = useState<number>(20);

  const [prepayBalance, setPrepayBalance] = useState<number>(1500000);
  const [prepayRate, setPrepayRate] = useState<number>(9.0);
  const [prepayTenureMonths, setPrepayTenureMonths] = useState<number>(180);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(3000);

  const loanEligibilityResults = useMemo(() => {
    const maxAllowedEmiTotal = (monthlyIncome || 0) * 0.5;
    const availableEmi = Math.max(0, maxAllowedEmiTotal - (existingEmi || 0));
    const r = (eligibilityRate || 0) / 12 / 100;
    const n = (eligibilityTenure || 0) * 12;

    if (availableEmi <= 0 || r <= 0 || n <= 0) {
      return { maxLoan: 0, affordableEmi: 0 };
    }

    const maxLoan = (availableEmi * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
    return {
      maxLoan: Math.round(maxLoan),
      affordableEmi: Math.round(availableEmi)
    };
  }, [monthlyIncome, existingEmi, eligibilityRate, eligibilityTenure]);

  const prepaymentResults = useMemo(() => {
    const P = prepayBalance || 0;
    const r = (prepayRate || 0) / 12 / 100;
    const n = prepayTenureMonths || 0;

    if (P <= 0 || r <= 0 || n <= 0) {
      return { originalEmi: 0, newEmi: 0, interestSaved: 0, monthsSaved: 0 };
    }

    const originalEmi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const originalTotalInterest = originalEmi * n - P;

    const newEmi = originalEmi + (extraMonthlyPayment || 0);
    let balance = P;
    let newMonths = 0;
    let newTotalInterest = 0;

    while (balance > 0 && newMonths < n * 2) {
      newMonths++;
      const interestForMonth = balance * r;
      newTotalInterest += interestForMonth;
      const principalPaid = newEmi - interestForMonth;
      balance -= principalPaid;
      if (balance <= 0) break;
    }

    const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);
    const monthsSaved = Math.max(0, n - newMonths);

    return {
      originalEmi: Math.round(originalEmi),
      newEmi: Math.round(newEmi),
      interestSaved: Math.round(interestSaved),
      monthsSaved
    };
  }, [prepayBalance, prepayRate, prepayTenureMonths, extraMonthlyPayment]);

  // ══════════════════════════════════════════════════════════════
  // 4. GST CALCULATOR
  // ══════════════════════════════════════════════════════════════
  const [gstAmount, setGstAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstMode, setGstMode] = useState<'exclusive' | 'inclusive'>('exclusive');

  const gstResults = useMemo(() => {
    const val = gstAmount || 0;
    const rate = gstRate || 0;

    if (val <= 0 || rate <= 0) {
      return { netAmount: val, gstTotal: 0, cgst: 0, sgst: 0, totalAmount: val };
    }

    if (gstMode === 'exclusive') {
      const gstTotal = (val * rate) / 100;
      const totalAmount = val + gstTotal;
      return {
        netAmount: Math.round(val * 100) / 100,
        gstTotal: Math.round(gstTotal * 100) / 100,
        cgst: Math.round((gstTotal / 2) * 100) / 100,
        sgst: Math.round((gstTotal / 2) * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100
      };
    } else {
      const netAmount = val / (1 + rate / 100);
      const gstTotal = val - netAmount;
      return {
        netAmount: Math.round(netAmount * 100) / 100,
        gstTotal: Math.round(gstTotal * 100) / 100,
        cgst: Math.round((gstTotal / 2) * 100) / 100,
        sgst: Math.round((gstTotal / 2) * 100) / 100,
        totalAmount: Math.round(val * 100) / 100
      };
    }
  }, [gstAmount, gstRate, gstMode]);

  // ══════════════════════════════════════════════════════════════
  // 5. INTEREST CALCULATOR (Simple & Compound)
  // ══════════════════════════════════════════════════════════════
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('simple');
  const [interestPrincipal, setInterestPrincipal] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(7.5);
  const [interestTenure, setInterestTenure] = useState<number>(3);
  const [interestTenureUnit, setInterestTenureUnit] = useState<'years' | 'months'>('years');
  const [compoundFreq, setCompoundFreq] = useState<number>(1);

  const interestResults = useMemo(() => {
    const P = interestPrincipal || 0;
    const r = (interestRate || 0) / 100;
    const t = interestTenureUnit === 'years' ? (interestTenure || 0) : (interestTenure || 0) / 12;

    if (P <= 0 || r <= 0 || t <= 0) {
      return { interestEarned: 0, maturityAmount: P, principalPct: 100, interestPct: 0 };
    }

    if (interestType === 'simple') {
      const SI = P * r * t;
      const total = P + SI;
      const pPct = Math.round((P / total) * 100);
      return {
        interestEarned: Math.round(SI),
        maturityAmount: Math.round(total),
        principalPct: pPct,
        interestPct: 100 - pPct
      };
    } else {
      const n = compoundFreq;
      const A = P * Math.pow(1 + r / n, n * t);
      const CI = A - P;
      const pPct = Math.round((P / A) * 100);
      return {
        interestEarned: Math.round(CI),
        maturityAmount: Math.round(A),
        principalPct: pPct,
        interestPct: 100 - pPct
      };
    }
  }, [interestType, interestPrincipal, interestRate, interestTenure, interestTenureUnit, compoundFreq]);

  // 5 Calculator Tabs config with distinct icons
  const calcTabs = [
    { id: 'basic', label: 'Basic', icon: <CalcIcon size={16} /> },
    { id: 'emi', label: 'EMI', icon: <Landmark size={16} /> },
    { id: 'loan', label: 'Loan', icon: <TrendingUp size={16} /> },
    { id: 'gst', label: 'GST', icon: <BadgePercent size={16} /> },
    { id: 'interest', label: 'Interest', icon: <Percent size={16} /> }
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10">
      {/* ════════ White & Emerald Top Nav Bar (100% Mobile Clean Grid) ════════ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-xs">
        <div className="grid grid-cols-5 gap-1 w-full">
          {calcTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as CalcTab)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 2px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(5, 150, 105, 0.28)' : 'none',
                  transition: 'all 0.18s ease'
                }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ opacity: isActive ? 1 : 0.85 }}>
                  {tab.icon}
                </div>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: isActive ? 800 : 600,
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. BASIC ARITHMETIC CALCULATOR
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'basic' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          {/* Crisp Display Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-right min-h-[96px] flex flex-col justify-end shadow-inner">
            <div className="text-xs sm:text-sm font-semibold text-slate-500 truncate mb-1">
              {basicExpr || '\u00A0'}
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight overflow-x-auto whitespace-nowrap scrollbar-none">
              {basicDisplay}
            </div>
          </div>

          {/* Keypad Grid (Matte Buttons) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
            {/* Row 1 */}
            <button
              type="button"
              onClick={() => handleBasicInput('AC')}
              className="h-12 sm:h-14 rounded-2xl bg-rose-50 text-rose-700 font-extrabold text-sm active:scale-95 transition flex items-center justify-center cursor-pointer border border-rose-200/70 hover:bg-rose-100"
            >
              AC
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('DEL')}
              className="h-12 sm:h-14 rounded-2xl bg-slate-100 text-slate-700 font-bold active:scale-95 transition flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200"
              aria-label="Delete last digit"
            >
              <Delete size={18} />
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('%')}
              className="h-12 sm:h-14 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-base active:scale-95 transition flex items-center justify-center cursor-pointer border border-slate-200 hover:bg-slate-200"
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('÷')}
              className="h-12 sm:h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 font-black text-xl active:scale-95 transition flex items-center justify-center cursor-pointer border border-emerald-200 hover:bg-emerald-200"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              type="button"
              onClick={() => handleBasicInput('7')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('8')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('9')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('×')}
              className="h-12 sm:h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 font-black text-xl active:scale-95 transition flex items-center justify-center cursor-pointer border border-emerald-200 hover:bg-emerald-200"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              type="button"
              onClick={() => handleBasicInput('4')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('5')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('6')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('-')}
              className="h-12 sm:h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 font-black text-xl active:scale-95 transition flex items-center justify-center cursor-pointer border border-emerald-200 hover:bg-emerald-200"
            >
              −
            </button>

            {/* Row 4 */}
            <button
              type="button"
              onClick={() => handleBasicInput('1')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('2')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('3')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('+')}
              className="h-12 sm:h-14 rounded-2xl bg-emerald-100/80 text-emerald-800 font-black text-xl active:scale-95 transition flex items-center justify-center cursor-pointer border border-emerald-200 hover:bg-emerald-200"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              type="button"
              onClick={() => handleBasicInput('0')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('00')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-base active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              00
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('.')}
              className="h-12 sm:h-14 rounded-2xl bg-white border border-slate-200 text-slate-900 font-bold text-2xl active:scale-95 transition flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-2xs"
            >
              .
            </button>
            <button
              type="button"
              onClick={() => handleBasicInput('=')}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
              }}
              className="h-12 sm:h-14 rounded-2xl text-white font-black text-2xl active:scale-95 transition flex items-center justify-center cursor-pointer"
            >
              =
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          2. EMI CALCULATOR
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'emi' && (
        <div className="space-y-4">
          {/* Emerald Hero EMI Card */}
          <div
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            className="rounded-3xl p-5 text-white shadow-md relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider flex items-center gap-1.5">
                <Landmark size={14} /> Monthly EMI
              </span>
              <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                {emiTenure} {emiTenureType}
              </span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-black mt-1">₹{emiResults.monthlyEmi.toLocaleString('en-IN')}</h3>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">Total Interest</p>
                <p className="font-extrabold text-base text-white">₹{emiResults.totalInterest.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">Total Payment</p>
                <p className="font-extrabold text-base text-white">₹{emiResults.totalPayment.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Visual Ratio Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Principal ({emiResults.principalPct}%)
              </span>
              <span className="text-amber-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Interest ({emiResults.interestPct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-amber-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${emiResults.principalPct}%` }}
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Clean Fields (No wrapping boxes) */}
          <div className="space-y-3">
            <CalcField
              label="Loan Amount"
              icon={<Wallet size={16} />}
              value={emiAmount}
              onChange={setEmiAmount}
              min={10000}
              max={10000000}
              step={10000}
              prefix="₹"
              minLabel="₹10K"
              maxLabel="₹1 Cr"
            />

            <CalcField
              label="Interest Rate"
              icon={<Percent size={16} />}
              value={emiRate}
              onChange={setEmiRate}
              min={1}
              max={20}
              step={0.1}
              suffix="%"
              minLabel="1%"
              maxLabel="20%"
            />

            <CalcField
              label="Loan Tenure"
              icon={<Clock size={16} />}
              value={emiTenure}
              onChange={setEmiTenure}
              min={emiTenureType === 'years' ? 1 : 6}
              max={emiTenureType === 'years' ? 30 : 360}
              step={emiTenureType === 'years' ? 1 : 6}
              suffix={emiTenureType === 'years' ? 'Y' : 'M'}
              unitToggle={{
                options: ['Years', 'Months'],
                active: emiTenureType === 'years' ? 'Years' : 'Months',
                onChange: opt => {
                  if (opt === 'Years' && emiTenureType === 'months') {
                    setEmiTenure(Math.max(1, Math.round(emiTenure / 12)));
                    setEmiTenureType('years');
                  } else if (opt === 'Months' && emiTenureType === 'years') {
                    setEmiTenure(emiTenure * 12);
                    setEmiTenureType('months');
                  }
                }
              }}
              minLabel={emiTenureType === 'years' ? '1 Year' : '6 Mos'}
              maxLabel={emiTenureType === 'years' ? '30 Years' : '360 Mos'}
            />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          3. LOAN CALCULATOR (Eligibility & Prepayment)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'loan' && (
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setLoanMode('eligibility')}
              style={{
                background: loanMode === 'eligibility' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                color: loanMode === 'eligibility' ? '#ffffff' : '#64748b'
              }}
              className="py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <TrendingUp size={14} /> Eligibility
            </button>
            <button
              type="button"
              onClick={() => setLoanMode('prepayment')}
              style={{
                background: loanMode === 'prepayment' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                color: loanMode === 'prepayment' ? '#ffffff' : '#64748b'
              }}
              className="py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Zap size={14} /> Prepayment
            </button>
          </div>

          {loanMode === 'eligibility' ? (
            <div className="space-y-3">
              {/* Emerald Result Card */}
              <div
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                className="rounded-3xl p-5 text-white shadow-md"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                  Max Eligible Loan
                </span>
                <h3 className="text-3xl font-black mt-1">₹{loanEligibilityResults.maxLoan.toLocaleString('en-IN')}</h3>
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                  <span className="text-emerald-100">Max Affordable EMI:</span>
                  <span className="font-extrabold text-sm text-white">₹{loanEligibilityResults.affordableEmi.toLocaleString('en-IN')} / mo</span>
                </div>
              </div>

              {/* Clean Fields (Properly Aligned & No confusing wrapping boxes) */}
              <CalcField
                label="Monthly Income"
                icon={<Wallet size={16} />}
                value={monthlyIncome}
                onChange={setMonthlyIncome}
                min={10000}
                max={500000}
                step={5000}
                prefix="₹"
                minLabel="₹10K"
                maxLabel="₹5L"
              />

              <CalcField
                label="Existing EMIs"
                icon={<Receipt size={16} />}
                value={existingEmi}
                onChange={setExistingEmi}
                min={0}
                max={200000}
                step={2000}
                prefix="₹"
                minLabel="₹0"
                maxLabel="₹2L"
              />

              <CalcField
                label="Interest Rate"
                icon={<Percent size={16} />}
                value={eligibilityRate}
                onChange={setEligibilityRate}
                min={5}
                max={18}
                step={0.1}
                suffix="%"
                minLabel="5%"
                maxLabel="18%"
              />

              <CalcField
                label="Loan Tenure"
                icon={<Clock size={16} />}
                value={eligibilityTenure}
                onChange={setEligibilityTenure}
                min={1}
                max={30}
                step={1}
                suffix="Y"
                minLabel="1 Yr"
                maxLabel="30 Yrs"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Prepayment Result Card */}
              <div
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                className="rounded-3xl p-5 text-white shadow-md"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Interest Saved</span>
                    <h3 className="text-2xl font-black text-white mt-0.5">₹{prepaymentResults.interestSaved.toLocaleString('en-IN')}</h3>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Time Saved</span>
                    <h3 className="text-2xl font-black text-white mt-0.5">{prepaymentResults.monthsSaved} Months</h3>
                  </div>
                </div>
              </div>

              {/* Prepayment Clean Fields */}
              <CalcField
                label="Current Balance"
                icon={<Wallet size={16} />}
                value={prepayBalance}
                onChange={setPrepayBalance}
                min={50000}
                max={10000000}
                step={50000}
                prefix="₹"
                minLabel="₹50K"
                maxLabel="₹1 Cr"
              />

              <CalcField
                label="Extra Monthly Payment"
                icon={<Zap size={16} />}
                value={extraMonthlyPayment}
                onChange={setExtraMonthlyPayment}
                min={500}
                max={50000}
                step={500}
                prefix="₹"
                minLabel="₹500"
                maxLabel="₹50K"
              />

              <CalcField
                label="Interest Rate"
                icon={<Percent size={16} />}
                value={prepayRate}
                onChange={setPrepayRate}
                min={5}
                max={18}
                step={0.1}
                suffix="%"
                minLabel="5%"
                maxLabel="18%"
              />

              <CalcField
                label="Remaining Months"
                icon={<Clock size={16} />}
                value={prepayTenureMonths}
                onChange={setPrepayTenureMonths}
                min={12}
                max={360}
                step={6}
                suffix="M"
                minLabel="12 Mos"
                maxLabel="360 Mos"
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          4. GST CALCULATOR
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'gst' && (
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setGstMode('exclusive')}
              style={{
                background: gstMode === 'exclusive' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                color: gstMode === 'exclusive' ? '#ffffff' : '#64748b'
              }}
              className="py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              Exclusive (+GST)
            </button>
            <button
              type="button"
              onClick={() => setGstMode('inclusive')}
              style={{
                background: gstMode === 'inclusive' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                color: gstMode === 'inclusive' ? '#ffffff' : '#64748b'
              }}
              className="py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              Inclusive (−GST)
            </button>
          </div>

          {/* Emerald GST Result Card */}
          <div
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            className="rounded-3xl p-5 text-white shadow-md text-center"
          >
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              {gstMode === 'exclusive' ? 'Total Amount (Incl. GST)' : 'Net Amount (Excl. GST)'}
            </p>
            <h3 className="text-3xl sm:text-4xl font-black text-white mt-1">
              ₹{gstResults.totalAmount.toLocaleString('en-IN')}
            </h3>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">Total GST</p>
                <p className="font-extrabold text-sm text-white">₹{gstResults.gstTotal.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">CGST (50%)</p>
                <p className="font-extrabold text-sm text-white">₹{gstResults.cgst.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">SGST (50%)</p>
                <p className="font-extrabold text-sm text-white">₹{gstResults.sgst.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Amount Slider */}
          <CalcField
            label={gstMode === 'exclusive' ? 'Net Base Amount' : 'Total Gross Amount'}
            icon={<Receipt size={16} />}
            value={gstAmount}
            onChange={setGstAmount}
            min={100}
            max={500000}
            step={100}
            prefix="₹"
            minLabel="₹100"
            maxLabel="₹5L"
          />

          {/* GST Slab Cards (Proper Grid) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
            <label className="text-xs font-extrabold text-slate-700 block">GST Rate Slab</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { r: 3, label: 'Gold' },
                { r: 5, label: 'Basic' },
                { r: 12, label: 'Standard' },
                { r: 18, label: 'Services' },
                { r: 28, label: 'Luxury' }
              ].map(item => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => setGstRate(item.r)}
                  className={`py-2 px-1 text-center rounded-xl border transition cursor-pointer active:scale-95 ${
                    gstRate === item.r
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200/90 hover:bg-slate-100'
                  }`}
                >
                  <p className="text-xs font-black">{item.r}%</p>
                  <p className="text-[9px] font-semibold opacity-75 truncate">{item.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          5. INTEREST CALCULATOR (Simple & Compound)
          ══════════════════════════════════════════════════════════ */}
      {activeTab === 'interest' && (
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setInterestType('simple')}
              style={{
                background: interestType === 'simple' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                color: interestType === 'simple' ? '#ffffff' : '#64748b'
              }}
              className="py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              Simple (SI)
            </button>
            <button
              type="button"
              onClick={() => setInterestType('compound')}
              style={{
                background: interestType === 'compound' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
                color: interestType === 'compound' ? '#ffffff' : '#64748b'
              }}
              className="py-2 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              Compound (CI)
            </button>
          </div>

          {/* Interest Emerald Result Card */}
          <div
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
            className="rounded-3xl p-5 text-white shadow-md text-center"
          >
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Maturity Total Amount</p>
            <h3 className="text-3xl sm:text-4xl font-black text-white mt-1">
              ₹{interestResults.maturityAmount.toLocaleString('en-IN')}
            </h3>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">Principal</p>
                <p className="font-extrabold text-base text-white">₹{interestPrincipal.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-100 font-bold uppercase">Total Interest Earned</p>
                <p className="font-extrabold text-base text-white">+₹{interestResults.interestEarned.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Visual Ratio Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Principal ({interestResults.principalPct}%)
              </span>
              <span className="text-teal-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Interest ({interestResults.interestPct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-teal-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${interestResults.principalPct}%` }}
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Clean Fields (Zero wrapping boxes) */}
          <div className="space-y-3">
            <CalcField
              label="Principal Amount"
              icon={<Wallet size={16} />}
              value={interestPrincipal}
              onChange={setInterestPrincipal}
              min={5000}
              max={5000000}
              step={5000}
              prefix="₹"
              minLabel="₹5K"
              maxLabel="₹50L"
            />

            <CalcField
              label="Interest Rate"
              icon={<Percent size={16} />}
              value={interestRate}
              onChange={setInterestRate}
              min={1}
              max={20}
              step={0.1}
              suffix="%"
              minLabel="1%"
              maxLabel="20%"
            />

            <CalcField
              label="Time Period"
              icon={<Clock size={16} />}
              value={interestTenure}
              onChange={setInterestTenure}
              min={interestTenureUnit === 'years' ? 1 : 1}
              max={interestTenureUnit === 'years' ? 30 : 120}
              step={1}
              suffix={interestTenureUnit === 'years' ? 'Y' : 'M'}
              unitToggle={{
                options: ['Years', 'Months'],
                active: interestTenureUnit === 'years' ? 'Years' : 'Months',
                onChange: opt => {
                  if (opt === 'Years' && interestTenureUnit === 'months') {
                    setInterestTenure(Math.max(1, Math.round(interestTenure / 12)));
                    setInterestTenureUnit('years');
                  } else if (opt === 'Months' && interestTenureUnit === 'years') {
                    setInterestTenure(interestTenure * 12);
                    setInterestTenureUnit('months');
                  }
                }
              }}
              minLabel={interestTenureUnit === 'years' ? '1 Year' : '1 Mo'}
              maxLabel={interestTenureUnit === 'years' ? '30 Years' : '120 Mos'}
            />

            {/* Compounding frequency for CI */}
            {interestType === 'compound' && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2 shadow-xs">
                <label className="text-xs font-bold text-slate-800 block">Compounding Frequency</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Annual', freq: 1 },
                    { label: 'Half-Yr', freq: 2 },
                    { label: 'Quarter', freq: 4 },
                    { label: 'Monthly', freq: 12 }
                  ].map(f => (
                    <button
                      key={f.label}
                      type="button"
                      onClick={() => setCompoundFreq(f.freq)}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer active:scale-95 ${
                        compoundFreq === f.freq
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculatorHub;
