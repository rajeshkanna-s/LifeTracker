import React, { useState, useRef, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8f7f4 0%, #ede9e3 50%, #f3eff8 100%)',
    }}>
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%', width: '350px', height: '350px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)',
        filter: 'blur(40px)',
      }} />

      <div style={{
        position: 'relative', textAlign: 'center' as const, padding: '2.5rem 2rem',
        width: '90%', maxWidth: '380px', background: 'rgba(255,255,255,0.7)',
        borderRadius: '24px', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 4px 20px rgba(124,58,237,0.05)',
      }} className={error ? 'animate-shake' : ''}>
        {/* Icon */}
        <div style={{
          width: '76px', height: '76px', borderRadius: '22px', margin: '0 auto 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: success ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #6d28d9, #a78bfa)',
          boxShadow: success ? '0 8px 24px rgba(16,185,129,0.25)' : '0 8px 24px rgba(124,58,237,0.2)',
          transition: 'all 0.4s ease',
        }}>
          {success ? <CheckCircle2 size={34} color="#fff" /> : <Lock size={34} color="#fff" />}
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e1b4b', marginBottom: '0.25rem' }}>MyLife Tracker</h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '2rem' }}>Enter your 6-digit PIN</p>

        {/* PIN Inputs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1.5rem' }} onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text" inputMode="numeric" maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={checking || success}
              style={{
                width: '48px', height: '56px', textAlign: 'center' as const,
                fontSize: '1.5rem', fontWeight: 700, borderRadius: '14px',
                border: `2px solid ${success ? '#10b981' : error ? '#ef4444' : digit ? '#7c3aed' : '#e5e7eb'}`,
                background: success ? '#ecfdf5' : error ? '#fef2f2' : digit ? '#f5f3ff' : '#fff',
                color: success ? '#059669' : error ? '#dc2626' : '#1e1b4b',
                outline: 'none', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                boxShadow: digit ? '0 2px 8px rgba(124,58,237,0.08)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Status Messages */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#059669', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
            <CheckCircle2 size={16} /> Access granted!
          </div>
        )}
        {checking && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#7c3aed', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid #7c3aed', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Verifying...
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#9ca3af', fontSize: '0.72rem', marginTop: '2rem' }}>
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
