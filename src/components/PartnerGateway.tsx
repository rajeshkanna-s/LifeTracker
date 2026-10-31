import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ArrowLeft, AlertCircle, CheckCircle2, ChevronRight, User, Users, Delete, Download } from 'lucide-react';
import { usePartner } from '../context/PartnerContext';
import type { PartnerId, PartnerProfile } from '../types';

interface PartnerGatewayProps {
  onUnlock?: () => void;
  onInstallClick?: () => void;
  isInstalled?: boolean;
}

export const PartnerGateway: React.FC<PartnerGatewayProps> = ({
  onUnlock,
  onInstallClick,
  isInstalled = false
}) => {
  const { partners, unlockPartner } = usePartner();
  // Start on the profile selection screen so both Rajesh and Seetha are prominently visible
  const [selectedPartner, setSelectedPartner] = useState<PartnerProfile | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [checking, setChecking] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Guarantee Rajesh and Mia exist even if Supabase is still loading
  const partnerList: PartnerProfile[] = partners.length >= 2 ? partners : [
    { id: 'partner_1', name: 'Rajesh', passcode: '689090', avatar: '👤', theme_color: '#7c3aed' },
    { id: 'partner_2', name: 'Mia', passcode: '689090', avatar: '👥', theme_color: '#0ea5e9' }
  ];

  const handleSelectPartner = (partner: PartnerProfile) => {
    setSelectedPartner(partner);
    setPin('');
    setError('');
    setSuccess(false);
  };

  const handleBackToSelection = () => {
    setSelectedPartner(null);
    setPin('');
    setError('');
    setSuccess(false);
  };

  const verifyPin = useCallback(async (partnerId: PartnerId, enteredPin: string) => {
    setChecking(true);
    setError('');

    const res = await unlockPartner(partnerId, enteredPin);
    setChecking(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        if (onUnlock) onUnlock();
      }, 450);
    } else {
      setError(res.error || 'Incorrect PIN. Try again.');
      setTimeout(() => {
        setPin('');
      }, 500);
    }
  }, [unlockPartner, onUnlock]);

  const handleDigitPress = (digit: string) => {
    if (checking || success || pin.length >= 6) return;
    const nextPin = pin + digit;
    setPin(nextPin);
    setError('');

    if (nextPin.length === 6 && selectedPartner) {
      verifyPin(selectedPartner.id, nextPin);
    }
  };

  const handleBackspace = () => {
    if (checking || success || pin.length === 0) return;
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (checking || success) return;
    setPin('');
    setError('');
  };

  // Physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPartner) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleBackToSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPartner, pin, checking, success]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        padding: '1rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Decorative ambient backdrop lights */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.2), transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 40px rgba(124, 58, 237, 0.15)',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
        className={error ? 'animate-shake' : ''}
      >
        {/* App Branding Top - Clean & Properly Centered */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 0.25rem 0', lineHeight: 1.2 }}>
            Xpenser
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
            Personal Life & Finance
          </p>
        </div>

        {/* Small Install App Icon Button on Gateway */}
        {!isInstalled && onInstallClick && (
          <button
            type="button"
            onClick={onInstallClick}
            title="Install App"
            aria-label="Install App"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1.5px solid #c4b5fd',
              background: 'rgba(245, 243, 255, 0.95)',
              color: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.15)',
              zIndex: 10
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Download size={18} />
          </button>
        )}

        {/* ════════ VIEW 1: CHOOSE PROFILE (RAJESH & SEETHA) ════════ */}
        {!selectedPartner ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.35rem 0', letterSpacing: '-0.01em' }}>
                Select Profile
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
                Choose your private workspace to continue
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '1.5rem' }}>
              {partnerList.map(partner => {
                const isRajesh = partner.id === 'partner_1' || partner.name.toLowerCase().includes('rajesh');
                const displayName = partner.name || (isRajesh ? 'Rajesh' : 'Mia');
                const accentColor = isRajesh ? '#7c3aed' : '#0ea5e9';
                const gradient = isRajesh
                  ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                  : 'linear-gradient(135deg, #0ea5e9, #06b6d4)';
                const lightBg = isRajesh ? 'rgba(124, 58, 237, 0.05)' : 'rgba(14, 165, 233, 0.05)';
                const borderColor = isRajesh ? 'rgba(124, 58, 237, 0.25)' : 'rgba(14, 165, 233, 0.25)';

                return (
                  <button
                    key={partner.id}
                    type="button"
                    onClick={() => handleSelectPartner(partner)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1.15rem 1.25rem',
                      borderRadius: '22px',
                      border: `2px solid ${borderColor}`,
                      background: lightBg,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = accentColor;
                      e.currentTarget.style.boxShadow = `0 10px 25px ${isRajesh ? 'rgba(124,58,237,0.18)' : 'rgba(14,165,233,0.18)'}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = borderColor;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onTouchStart={e => {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }}
                    onTouchEnd={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '18px',
                          background: gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: `0 6px 16px ${isRajesh ? 'rgba(124,58,237,0.3)' : 'rgba(14,165,233,0.3)'}`
                        }}
                      >
                        {isRajesh ? <User size={28} color="#fff" /> : <Users size={28} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
                          {displayName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                          {displayName}'s Private Workspace
                        </div>
                        <div style={{ fontSize: '0.72rem', color: accentColor, fontWeight: 700, marginTop: '2px' }}>
                          Protected • 6-digit PIN
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accentColor,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    >
                      <ChevronRight size={20} />
                    </div>
                  </button>
                );
              })}
            </div>


          </div>
        ) : (
          /* ════════ VIEW 2: NATIVE MOBILE PIN ENTRY SCREEN ════════ */
          <div>
            {/* Back button */}
            <button
              type="button"
              onClick={handleBackToSelection}
              style={{
                position: 'absolute',
                top: '1.25rem',
                left: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(0,0,0,0.04)',
                border: 'none',
                color: '#475569',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '10px',
                transition: 'all 0.15s'
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>

            {/* Selected Partner Header */}
            <div style={{ margin: '0.75rem 0 1rem' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '22px',
                  margin: '0 auto 0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: success
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : selectedPartner.id === 'partner_1'
                      ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
                      : 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
                  boxShadow: success
                    ? '0 8px 24px rgba(16,185,129,0.35)'
                    : '0 8px 24px rgba(124,58,237,0.25)',
                  transition: 'all 0.4s ease'
                }}
              >
                {success ? (
                  <CheckCircle2 size={36} color="#fff" />
                ) : (
                  <Lock size={32} color="#fff" />
                )}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.2rem 0' }}>
                Unlock {selectedPartner.name}
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
                Enter your 6-digit passcode
              </p>
            </div>

            {/* 6 Sleek Animated PIN Indicator Dots */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                margin: '1.25rem 0 1.25rem'
              }}
            >
              {[0, 1, 2, 3, 4, 5].map(index => {
                const isFilled = pin.length > index;
                const accent = selectedPartner.id === 'partner_1' ? '#7c3aed' : '#0ea5e9';
                return (
                  <div
                    key={index}
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${isFilled ? accent : '#cbd5e1'}`,
                      background: isFilled ? accent : 'transparent',
                      transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isFilled ? `0 0 10px ${accent}` : 'none',
                      transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                );
              })}
            </div>

            {/* Status Messages */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: '#fef2f2'
                }}
              >
                <AlertCircle size={15} /> {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: '#059669',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: '10px',
                  background: '#ecfdf5'
                }}
              >
                <CheckCircle2 size={16} /> Access granted! Welcome, {selectedPartner.name}
              </div>
            )}
            {checking && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#7c3aed',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem'
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #7c3aed',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }}
                />
                Verifying...
              </div>
            )}

            {/* ════════ NATIVE MOBILE KEYPAD ════════ */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                maxWidth: '280px',
                margin: '0 auto 1rem'
              }}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitPress(num)}
                  disabled={checking || success}
                  style={{
                    height: '56px',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    color: '#0f172a',
                    fontSize: '1.45rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                    transition: 'all 0.12s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#ede9fe';
                    e.currentTarget.style.borderColor = '#c4b5fd';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  onTouchStart={e => {
                    e.currentTarget.style.transform = 'scale(0.92)';
                    e.currentTarget.style.background = '#ede9fe';
                  }}
                  onTouchEnd={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  {num}
                </button>
              ))}

              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                disabled={checking || success}
                style={{
                  height: '56px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none'
                }}
              >
                Clear
              </button>

              {/* Zero */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                disabled={checking || success}
                style={{
                  height: '56px',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'all 0.12s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ede9fe';
                  e.currentTarget.style.borderColor = '#c4b5fd';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onTouchStart={e => {
                  e.currentTarget.style.transform = 'scale(0.92)';
                  e.currentTarget.style.background = '#ede9fe';
                }}
                onTouchEnd={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={checking || success}
                style={{
                  height: '56px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none'
                }}
              >
                <Delete size={22} />
              </button>
            </div>


          </div>
        )}
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.35s ease; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default PartnerGateway;
