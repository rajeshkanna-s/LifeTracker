import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2, Delete } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PinLockProps {
  onUnlock: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newPin.every(d => d !== '')) verifyPin(newPin.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newPin = [...pin]; newPin[index - 1] = ''; setPin(newPin);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { const newPin = pasted.split(''); setPin(newPin); verifyPin(pasted); }
  };

  const handleDigitClick = (digit: string) => {
    if (checking || success) return;
    const nextIdx = pin.findIndex(d => d === '');
    if (nextIdx === -1) return;
    const newPin = [...pin];
    newPin[nextIdx] = digit;
    setPin(newPin);
    setError('');
    if (nextIdx < 5) inputRefs.current[nextIdx + 1]?.focus();
    if (newPin.every(d => d !== '')) verifyPin(newPin.join(''));
  };

  const handleBackspaceClick = () => {
    if (checking || success) return;
    let lastFilled = -1;
    for (let i = 5; i >= 0; i--) {
      if (pin[i] !== '') { lastFilled = i; break; }
    }
    if (lastFilled >= 0) {
      const newPin = [...pin];
      newPin[lastFilled] = '';
      setPin(newPin);
      setError('');
      inputRefs.current[lastFilled]?.focus();
    }
  };

  const handleClearClick = () => {
    if (checking || success) return;
    setPin(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  const verifyPin = async (enteredPin: string) => {
    setChecking(true); setError('');
    try {
      const { data } = await supabase.from('app_pin').select('pin_code').limit(1).single();
      const correctPin = data?.pin_code || '689090';
      if (enteredPin === correctPin) { setSuccess(true); setTimeout(onUnlock, 500); }
      else { setError('Incorrect PIN'); shakeAndReset(); }
    } catch {
      if (enteredPin === '689090') { setSuccess(true); setTimeout(onUnlock, 500); }
      else { setError('Incorrect PIN'); shakeAndReset(); }
    }
    setChecking(false);
  };

  const shakeAndReset = () => {
    setTimeout(() => { setPin(['', '', '', '', '', '']); inputRefs.current[0]?.focus(); }, 700);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', justifyContent: 'center',
      padding: '24px 16px', boxSizing: 'border-box',
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      background: 'linear-gradient(145deg, #f8f7f4 0%, #eef2ff 50%, #f5f3ff 100%)',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-5%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.10), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-5%', width: '350px', height: '350px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', margin: 'auto', textAlign: 'center' as const, padding: '1.75rem 1.25rem',
        width: '100%', maxWidth: '380px', background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08), 0 4px 16px rgba(124, 58, 237, 0.05)',
        boxSizing: 'border-box' as const,
      }} className={error ? 'animate-shake' : ''}>
        {/* Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: success ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6d28d9, #7c3aed)',
          boxShadow: success ? '0 8px 20px rgba(16,185,129,0.25)' : '0 8px 20px rgba(124,58,237,0.2)',
          transition: 'all 0.4s ease',
        }}>
          {success ? <CheckCircle2 size={30} color="#fff" /> : <Lock size={30} color="#fff" />}
        </div>

        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Xpenser</h1>
        <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 1.25rem 0', fontWeight: 500 }}>Enter your 6-digit PIN</p>

        {/* PIN Inputs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.15rem', width: '100%', maxWidth: '310px', marginLeft: 'auto', marginRight: 'auto' }} onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="password" inputMode="numeric" maxLength={1} autoComplete="off"
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={checking || success}
              style={{
                flex: '1 1 0', minWidth: 0, maxWidth: '46px', height: '48px',
                padding: 0,
                textAlign: 'center' as const,
                fontSize: '18px', fontWeight: 700, borderRadius: '12px',
                border: `2px solid ${success ? '#10b981' : error ? '#ef4444' : digit ? '#7c3aed' : '#cbd5e1'}`,
                background: success ? '#ecfdf5' : error ? '#fef2f2' : digit ? '#f5f3ff' : '#ffffff',
                color: success ? '#059669' : error ? '#dc2626' : '#0f172a',
                outline: 'none', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                boxShadow: digit ? '0 2px 8px rgba(124,58,237,0.08)' : 'none',
                boxSizing: 'border-box' as const,
              }}
            />
          ))}
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#dc2626', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.85rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#059669', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.85rem' }}>
            <CheckCircle2 size={16} /> Access granted!
          </div>
        )}
        {checking && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#7c3aed', fontSize: '0.84rem', fontWeight: 600, marginBottom: '0.85rem' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #7c3aed', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Verifying...
          </div>
        )}

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', maxWidth: '264px', margin: '0 auto 1rem' }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigitClick(num)}
              disabled={checking || success}
              style={{
                height: '46px', borderRadius: '14px', border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#0f172a', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none'
              }}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClearClick}
            disabled={checking || success}
            style={{
              height: '46px', borderRadius: '14px', border: 'none',
              background: 'transparent', color: '#64748b', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none'
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            disabled={checking || success}
            style={{
              height: '46px', borderRadius: '14px', border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#0f172a', fontSize: '1.25rem', fontWeight: 700, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none'
            }}
          >
            0
          </button>
          <button
            type="button"
            aria-label="Backspace"
            onClick={handleBackspaceClick}
            disabled={checking || success}
            style={{
              height: '46px', borderRadius: '14px', border: 'none',
              background: 'transparent', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none'
            }}
          >
            <Delete size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.75rem' }}>
          <Shield size={14} /> Secured with PIN
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.35s ease; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PinLock;
