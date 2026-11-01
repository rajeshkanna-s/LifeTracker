import React, { useState } from 'react';
import { X, Lock, KeyRound, CheckCircle2, AlertCircle, RefreshCw, UserCheck, LogOut, Download } from 'lucide-react';
import { usePartner } from '../context/PartnerContext';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallClick?: () => void;
  isInstalled?: boolean;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ 
  isOpen, 
  onClose,
  onInstallClick,
  isInstalled = false
}) => {
  const { activePartner, activePartnerId, changePasscode, updatePartnerProfile, switchPartner } = usePartner();

  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Name editing
  const [customName, setCustomName] = useState(activePartner?.name || '');
  const [nameSaving, setNameSaving] = useState(false);

  if (!isOpen || !activePartner) return null;

  const isP1 = activePartnerId === 'partner_1';
  const accentColor = isP1 ? '#7c3aed' : '#0ea5e9';

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!oldPin) {
      setStatusMessage({ type: 'error', text: 'Please enter your current PIN.' });
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setStatusMessage({ type: 'error', text: 'New PIN must be exactly 6 digits.' });
      return;
    }
    if (newPin !== confirmPin) {
      setStatusMessage({ type: 'error', text: 'New PIN and Confirmation PIN do not match.' });
      return;
    }
    if (newPin === oldPin) {
      setStatusMessage({ type: 'error', text: 'New PIN cannot be the same as your current PIN.' });
      return;
    }

    setIsSubmitting(true);
    const res = await changePasscode(activePartnerId, oldPin, newPin);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: `Passcode successfully updated for ${activePartner.name}!` });
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update passcode.' });
    }
  };

  const handleUpdateName = async () => {
    if (!customName.trim()) return;
    setNameSaving(true);
    const res = await updatePartnerProfile(activePartnerId, { name: customName.trim() });
    setNameSaving(false);
    if (res.success) {
      setStatusMessage({ type: 'success', text: 'Profile name updated!' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update name.' });
    }
  };

  return (
    <div
      className="security-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="security-modal-box"
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.2)',
          padding: '1.5rem',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${accentColor}, #a78bfa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#fff'
              }}
            >
              <KeyRound size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: '#0f172a' }}>
                Profile & Security
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#475569', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Manage PIN and settings for {activePartner.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
              color: '#475569'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Active Profile Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '0.85rem 1rem',
            borderRadius: '16px',
            background: isP1 ? 'rgba(124, 58, 237, 0.08)' : 'rgba(14, 165, 233, 0.08)',
            border: `1.5px solid ${isP1 ? 'rgba(124, 58, 237, 0.2)' : 'rgba(14, 165, 233, 0.2)'}`,
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{activePartner.avatar}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activePartner.name}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Active Profile • Fully Isolated Data
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 700,
              lineHeight: 1,
              background: accentColor,
              color: '#fff',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isP1 ? 'Partner 1' : 'Partner 2'}
          </span>
        </div>

        {/* Alert Notification */}
        {statusMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1.25rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: statusMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
              color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${statusMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}
          >
            {statusMessage.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* SECTION 1: RESET PASSCODE */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={15} color={accentColor} /> Reset 6-Digit Passcode
          </h4>

          <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                Current 6-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={oldPin}
                onChange={e => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter current PIN"
                style={{
                  width: '100%',
                  minWidth: 0,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '16px',
                  color: '#0f172a',
                  background: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  New 6-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digits"
                  style={{
                    width: '100%',
                    minWidth: 0,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '16px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ minWidth: 0 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Confirm PIN"
                  style={{
                    width: '100%',
                    minWidth: 0,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '16px',
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || newPin.length !== 6 || confirmPin.length !== 6}
              style={{
                marginTop: '4px',
                minHeight: '44px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: 'none',
                background: `linear-gradient(135deg, ${accentColor}, #4f46e5)`,
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.84rem',
                lineHeight: 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: newPin.length === 6 && confirmPin.length === 6 ? 1 : 0.6,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Saving PIN...
                </>
              ) : (
                'Save New Passcode'
              )}
            </button>
          </form>
        </div>

        {/* SECTION 2: EDIT PROFILE NAME */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.25rem', marginBottom: '1.1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserCheck size={15} color={accentColor} /> Display Name
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="e.g. Rajesh or Partner"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '16px',
                color: '#0f172a',
                background: '#ffffff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={handleUpdateName}
              disabled={nameSaving || !customName.trim()}
              style={{
                minHeight: '42px',
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.82rem',
                lineHeight: 1,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {nameSaving ? 'Saving...' : 'Update Name'}
            </button>
          </div>
        </div>

        {/* FOOTER ACTIONS: APP INSTALLATION + LOCK & SWITCH */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
          {!isInstalled && onInstallClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onInstallClick();
              }}
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1.5px solid #ddd6fe',
                background: '#f5f3ff',
                color: '#7c3aed',
                fontWeight: 700,
                fontSize: '0.84rem',
                lineHeight: 1.2,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Download size={16} style={{ flexShrink: 0 }} />
              <span>Install App on this Device</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              switchPartner();
            }}
            style={{
              width: '100%',
              minHeight: '44px',
              padding: '11px 14px',
              borderRadius: '12px',
              border: '1.5px solid #fecaca',
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 700,
              fontSize: '0.84rem',
              lineHeight: 1.2,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            <span>Lock & Switch to Other Partner</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityModal;
