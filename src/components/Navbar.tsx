import React, { useState, useRef, useEffect } from 'react';
import { Receipt, CreditCard, Building2, CheckSquare, Dumbbell, StickyNote, ListChecks, Lock, Download, KeyRound, LogOut } from 'lucide-react';
import type { TabId } from '../types';
import { usePWA } from '../utils/usePWA';
import { usePartner } from '../context/PartnerContext';
import SecurityModal from './SecurityModal';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={17} />, color: '#7c3aed' },
  { id: 'debt', label: 'Debt', icon: <CreditCard size={17} />, color: '#ef4444' },
  { id: 'jobs', label: 'Jobs', icon: <Building2 size={17} />, color: '#6366f1' },
  { id: 'habits', label: 'Habits', icon: <CheckSquare size={17} />, color: '#10b981' },
  { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={17} />, color: '#f97316' },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={17} />, color: '#d97706' },
  { id: 'routines', label: 'Routines', icon: <ListChecks size={17} />, color: '#0891b2' },
  { id: 'vault', label: 'Vault', icon: <Lock size={17} />, color: '#2563eb' },
];

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { isInstallable, install } = usePWA();
  const { activePartner, activePartnerId, lockPartner } = usePartner();
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const bottomNavRef = useRef<HTMLDivElement>(null);

  const isP1 = activePartnerId === 'partner_1';
  const partnerName = activePartner?.name || (isP1 ? 'Rajesh' : 'Seetha');
  const accentColor = isP1 ? '#7c3aed' : '#0ea5e9';

  // Auto-scroll the active tab into center on mobile
  useEffect(() => {
    if (!bottomNavRef.current) return;
    const activeEl = bottomNavRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

  const activeTabMeta = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <>
      {/* ════════ Desktop Top Navbar (Hidden <= 768px) ════════ */}
      <nav className="app-navbar">
        <div className="app-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
            MyLife Tracker
          </span>
          
          {/* Active Partner Pill Badge */}
          <button
            type="button"
            onClick={() => setSecurityModalOpen(true)}
            title="Click to manage profile or change passcode"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 11px',
              borderRadius: '20px',
              border: `1.5px solid ${accentColor}`,
              background: isP1 ? 'rgba(124, 58, 237, 0.09)' : 'rgba(14, 165, 233, 0.09)',
              color: accentColor,
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: '8px'
            }}
          >
            <span>{activePartner?.avatar || (isP1 ? '👤' : '👥')}</span>
            <span>{partnerName}</span>
            <KeyRound size={12} style={{ opacity: 0.7 }} />
          </button>

          {isInstallable && (
            <button className="btn-install-desktop" onClick={install}>
              <Download size={14} />
              <span>Install App</span>
            </button>
          )}
        </div>

        <div className="nav-tabs-custom" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab-item ${activeTab === tab.id ? `active-${tab.id}` : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}

          {/* Quick Lock Button */}
          <button
            type="button"
            onClick={lockPartner}
            title="Lock & Switch Partner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              background: '#fff',
              color: '#6b7280',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#6b7280';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <LogOut size={14} />
            <span>Lock</span>
          </button>
        </div>
      </nav>

      {/* ════════ Mobile Top App Bar (Visible <= 768px) ════════ */}
      <header className="mobile-app-header">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            MyLife Tracker
          </span>
          <span style={{ fontSize: '0.68rem', color: activeTabMeta.color, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeTabMeta.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Active Partner Pill with Name */}
          <button
            type="button"
            onClick={() => setSecurityModalOpen(true)}
            aria-label="Manage Profile and Security"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '18px',
              border: `1.5px solid ${accentColor}`,
              background: isP1 ? 'rgba(124, 58, 237, 0.08)' : 'rgba(14, 165, 233, 0.08)',
              color: accentColor,
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
              outline: 'none'
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span style={{ fontSize: '0.9rem' }}>{activePartner?.avatar || (isP1 ? '👤' : '👥')}</span>
            <span>{partnerName}</span>
            <KeyRound size={11} style={{ opacity: 0.75 }} />
          </button>

          {/* Quick Lock Button */}
          <button
            type="button"
            onClick={lockPartner}
            title="Lock & Switch Profile"
            aria-label="Lock application"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ════════ Mobile Bottom Navigation Bar (Visible <= 768px) ════════ */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner" ref={bottomNavRef}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                style={{
                  color: isActive ? tab.color : '#94a3b8'
                }}
              >
                <div
                  className="bottom-nav-icon"
                  style={{
                    color: isActive ? tab.color : '#64748b',
                    background: isActive ? `${tab.color}18` : 'transparent',
                    boxShadow: isActive ? `0 2px 8px ${tab.color}25` : 'none'
                  }}
                >
                  {tab.icon}
                </div>
                <span style={{ fontWeight: isActive ? 700 : 600 }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile & Security Modal */}
      <SecurityModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
