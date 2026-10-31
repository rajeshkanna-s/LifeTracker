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
  flag: string;
  rateToInr: number; // 1 Unit of this currency = X INR
}

const DEFAULT_RATES: CurrencyRate[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', rateToInr: 86.85 },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', rateToInr: 94.20 },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', rateToInr: 112.60 },
  { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rateToInr: 23.65 },
  { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬', rateToInr: 65.40 },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', rateToInr: 62.10 },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', rateToInr: 56.70 },
  { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', rateToInr: 23.15 },
  { code: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦', rateToInr: 23.85 },
  { code: 'MYR', name: 'Malaysian Ringgit', flag: '🇲🇾', rateToInr: 19.50 },
  { code: 'THB', name: 'Thai Baht', flag: '🇹🇭', rateToInr: 2.52 },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', rateToInr: 0.58 }
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
    <div className="space-y-4 max-w-4xl mx-auto pb-10">
      {/* ════════ Top Hero Banner (Matches Reference Image "Currency rates") ════════ */}
      <div
        className="rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-purple-100 text-[10px] font-extrabold uppercase tracking-wider mb-2">
              <Sparkles size={11} className="text-amber-300" /> Forex & Exchange Rates
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Currency Rates
            </h2>
            <p className="text-xs text-purple-100/90 mt-1 max-w-md">
              Click on any currency pair to convert instantly against Indian Rupee (INR).
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs rounded-2xl backdrop-blur-xs active:scale-95 transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Update Rates</span>
          </button>
        </div>
      </div>

      {/* ════════ Interactive Quick Converter ════════ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-purple-600" />
            <h3 className="text-sm font-extrabold text-slate-900">Instant Currency Converter</h3>
          </div>
          <button
            type="button"
            onClick={() => setDirection(prev => (prev === 'foreignToInr' ? 'inrToForeign' : 'foreignToInr'))}
            className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl transition cursor-pointer"
          >
            <ArrowRightLeft size={13} />
            <span>Switch Direction</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          {/* Source Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">You Convert</span>
              <span className="text-xs font-extrabold text-slate-700">
                {direction === 'foreignToInr' ? `${selectedRateObj.flag} ${selectedRateObj.code}` : '🇮🇳 INR'}
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
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-purple-600 uppercase">You Get</span>
              <span className="text-xs font-extrabold text-purple-800">
                {direction === 'foreignToInr' ? '🇮🇳 INR' : `${selectedRateObj.flag} ${selectedRateObj.code}`}
              </span>
            </div>
            <p className="text-2xl font-black text-purple-950 truncate">
              {direction === 'foreignToInr' ? '₹' : selectedRateObj.code + ' '}
              {convertedResult.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 font-medium text-center">
          Exchange rate: 1 {selectedRateObj.code} = ₹{selectedRateObj.rateToInr.toFixed(2)} INR
        </p>
      </div>

      {/* ════════ Currency Pairs Grid (Matches Reference Image) ════════ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Popular Currency Pairs
          </h3>
          <div className="relative max-w-xs w-44">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-500"
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
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between shadow-2xs hover:shadow-xs ${
                  isSelected
                    ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/30'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{r.flag}</span>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-slate-900 truncate">
                      INR / {r.code}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{r.name}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">
                    ₹{r.rateToInr.toFixed(2)}
                  </p>
                  <p className="text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-0.5">
                    <TrendingUp size={9} /> Live
                  </p>
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

