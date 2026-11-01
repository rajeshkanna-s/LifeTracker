import React, { useState, useMemo } from 'react';
import {
  Coins,
  ArrowRightLeft,
  TrendingUp,
  RefreshCw,
  Search,
  Sparkles,
  Calculator
} from 'lucide-react';

interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToInr: number; // 1 Unit of this currency = X INR
}

const DEFAULT_RATES: CurrencyRate[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rateToInr: 86.85 },
  { code: 'EUR', name: 'Euro', symbol: '€', rateToInr: 94.20 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rateToInr: 112.60 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', rateToInr: 23.65 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rateToInr: 65.40 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rateToInr: 62.10 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToInr: 56.70 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', rateToInr: 23.15 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'QR', rateToInr: 23.85 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rateToInr: 19.50 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', rateToInr: 2.52 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToInr: 0.58 }
];

export const CurrencyTracker: React.FC = () => {
  const [rates, setRates] = useState<CurrencyRate[]>(DEFAULT_RATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<number>(100);
  const [direction, setDirection] = useState<'foreignToInr' | 'inrToForeign'>('foreignToInr');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedRateObj = useMemo(() => {
    return rates.find(r => r.code === selectedCurrency) || rates[0];
  }, [rates, selectedCurrency]);

  const convertedResult = useMemo(() => {
    if (!amount || amount <= 0) return 0;
    if (direction === 'foreignToInr') {
      return Math.round(amount * selectedRateObj.rateToInr * 100) / 100;
    } else {
      return Math.round((amount / selectedRateObj.rateToInr) * 100) / 100;
    }
  }, [amount, selectedRateObj, direction]);

  const filteredRates = useMemo(() => {
    if (!searchTerm.trim()) return rates;
    const q = searchTerm.toLowerCase();
    return rates.filter(r => r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }, [rates, searchTerm]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Slight simulated real-time variation
    setTimeout(() => {
      setRates(prev =>
        prev.map(r => ({
          ...r,
          rateToInr: Math.round((r.rateToInr + (Math.random() * 0.4 - 0.2)) * 100) / 100
        }))
      );
      setIsRefreshing(false);
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-24">
      {/* ════════ Top Hero Banner (Matches Reference Image "Currency rates") ════════ */}
      <div
        className="rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider leading-none mb-2">
              <Sparkles size={11} className="text-amber-300 shrink-0" /> Forex & Exchange Rates
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Currency Rates
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-md">
              Click on any currency pair to convert instantly against Indian Rupee (INR).
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center leading-none gap-2 min-h-[36px] px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-2xl backdrop-blur-xs active:scale-95 transition cursor-pointer self-start sm:self-auto shrink-0 whitespace-nowrap"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Update Rates</span>
          </button>
        </div>
      </div>

      {/* ════════ Interactive Quick Converter ════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <Calculator size={18} className="text-purple-600 shrink-0" />
            <h3 className="text-sm font-extrabold text-slate-900">Instant Currency Converter</h3>
          </div>
          <button
            type="button"
            onClick={() => setDirection(prev => (prev === 'foreignToInr' ? 'inrToForeign' : 'foreignToInr'))}
            className="inline-flex items-center justify-center leading-none gap-1.5 min-h-[32px] text-xs font-bold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100/80 border border-purple-200/70 px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowRightLeft size={13} />
            <span>Switch Direction</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Source Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">You Convert</span>
              <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-extrabold text-slate-800 leading-none shrink-0">
                {direction === 'foreignToInr' ? `${selectedRateObj.symbol} ${selectedRateObj.code}` : '₹ INR'}
              </span>
            </div>
            <input
              type="number"
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-black text-slate-900 outline-none"
            />
          </div>

          {/* Converted Output */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-purple-700 uppercase">You Get</span>
              <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-xs font-extrabold text-purple-900 leading-none shrink-0">
                {direction === 'foreignToInr' ? '₹ INR' : `${selectedRateObj.symbol} ${selectedRateObj.code}`}
              </span>
            </div>
            <p className="text-2xl font-black text-purple-950 truncate">
              {direction === 'foreignToInr' ? '₹' : selectedRateObj.code + ' '}
              {convertedResult.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium text-center">
          Exchange rate: 1 {selectedRateObj.code} ({selectedRateObj.symbol}) = ₹{selectedRateObj.rateToInr.toFixed(2)} INR
        </p>
      </div>

      {/* ════════ Currency Pairs Grid (Matches Reference Image) ════════ */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Live Exchange Pairs
          </h3>
          <div className="relative flex-1 min-w-[150px] sm:flex-none sm:w-48 max-w-xs">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search currency..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredRates.map(r => {
            const isSelected = selectedCurrency === r.code;
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => setSelectedCurrency(r.code)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs ${
                  isSelected
                    ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 font-black text-xs border leading-none ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-purple-50 text-purple-700 border-purple-200/80'
                    }`}
                  >
                    {r.symbol}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">
                      INR / {r.code}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{r.name}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">
                    ₹{r.rateToInr.toFixed(2)}
                  </p>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center justify-center leading-none gap-0.5 mt-0.5">
                    <TrendingUp size={9} /> Live
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurrencyTracker;

