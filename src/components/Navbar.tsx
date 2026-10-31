import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Building2,
  CheckSquare,
  Dumbbell,
  StickyNote,
  ListChecks,
  Lock,
  Download,
  KeyRound,
  LogOut,
  Menu,
  X,
  Shield,
  Smartphone,
  User,
  CalendarDays,
  Calculator,
  WalletCards,
  PieChart,
  Target,
  ShieldCheck
} from 'lucide-react';
import type { TabId } from '../types';
import { usePartner } from '../context/PartnerContext';
import SecurityModal from './SecurityModal';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onInstallClick?: () => void;
  isInstalled?: boolean;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={18} />, color: '#7c3aed', desc: 'Income & Expense Tracker' },
  { id: 'accounts', label: 'Accounts', icon: <WalletCards size={18} />, color: '#0284c7', desc: 'Cash, Banks & Cards' },
  { id: 'budgets', label: 'Budgets', icon: <PieChart size={18} />, color: '#ec4899', desc: 'Monthly & Category Budgets' },
  { id: 'goals', label: 'Goals', icon: <Target size={18} />, color: '#f59e0b', desc: 'Active & Reached Goals' },
  { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={18} />, color: '#0284c7', desc: 'Monthly Activity & Dues' },
  { id: 'calculator', label: 'Calculator', icon: <Calculator size={18} />, color: '#06b6d4', desc: 'Basic, EMI, Loan, GST, Interest' },
  { id: 'warranties', label: 'Warranties', icon: <ShieldCheck size={18} />, color: '#10b981', desc: 'Track Product Warranties' },
  { id: 'debt', label: 'Debt', icon: <CreditCard size={18} />, color: '#ef4444', desc: 'Loans & EMI Manager' },
  { id: 'habits', label: 'Habits', icon: <CheckSquare size={18} />, color: '#10b981', desc: 'Daily Habits & Streaks' },
  { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={18} />, color: '#f97316', desc: 'Workouts & Progress' },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={18} />, color: '#d97706', desc: 'Notebook & Quick Notes' },
  { id: 'routines', label: 'Routines', icon: <ListChecks size={18} />, color: '#0891b2', desc: 'Daily Schedules' },
  { id: 'vault', label: 'Vault', icon: <Lock size={18} />, color: '#2563eb', desc: 'Secure Credentials' },
  { id: 'jobs', label: 'Jobs', icon: <Building2 size={18} />, color: '#6366f1', desc: 'Job Application Tracker' },
];

const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onInstallClick,
  isInstalled = false
}) => {
  const { activePartner, activePartnerId, lockPartner } = usePartner();
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isP1 = activePartnerId === 'partner_1';
  const partnerName = activePartner?.name || (isP1 ? 'Rajesh' : 'Mia');
  const accentColor = isP1 ? '#7c3aed' : '#0ea5e9';

  const activeTabMeta = tabs.find(t => t.id === activeTab) || tabs[0];

  // Prevent background scroll and support Escape key when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  return (
    <>
      {/* ════════ Desktop Top Navbar (Hidden <= 768px) ════════ */}
      <nav className="app-navbar">
        <div className="app-brand" style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.02em' }}>
            Xpenser
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

          {!isInstalled && onInstallClick && (
            <button className="btn-install-desktop" onClick={onInstallClick}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hamburger Menu Button (Three Lines) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation sidebar"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.15s ease'
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Xpenser
            </span>
            <span style={{ fontSize: '0.68rem', color: activeTabMeta.color, fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeTabMeta.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Active Partner Pill with Name */}
          <button
            type="button"
            onClick={() => setSecurityModalOpen(true)}
            aria-label="Manage Profile and Security"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 9px',
              borderRadius: '18px',
              border: `1.5px solid ${accentColor}`,
              background: isP1 ? 'rgba(124, 58, 237, 0.08)' : 'rgba(14, 165, 233, 0.08)',
              color: accentColor,
              fontSize: '0.76rem',
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

      {/* ════════ Slide-out Mobile Sidebar Drawer (Menu) ════════ */}
      <div
        className={`app-drawer-overlay ${drawerOpen ? 'open' : 'closed'}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      <aside className={`app-drawer ${drawerOpen ? 'open' : 'closed'}`} role="dialog" aria-modal="true">
        {/* Drawer Header (Exact Match to User Reference Screenshot) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '24px 18px 20px 18px',
            position: 'relative',
            color: '#ffffff'
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDrawerOpen(false);
            }}
            aria-label="Close menu"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.28)',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 30,
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'transform 0.15s ease, background 0.15s ease'
            }}
            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.9)'; }}
            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '4px' }}>
            {/* Avatar Circle with User Icon (matches reference screenshot) */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#e2e8f0',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <User size={26} color="#64748b" strokeWidth={2.2} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontWeight: 800,
                  fontSize: '1.12rem',
                  color: '#ffffff',
                  lineHeight: 1.2,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {partnerName}
              </h3>
              <p
                style={{
                  fontSize: '0.78rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  fontWeight: 500,
                  marginTop: '2px',
                  marginBottom: 0
                }}
              >
                My Wallet
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Menu Body (List with Pill Highlight like reference screenshot) */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 10px calc(32px + env(safe-area-inset-bottom, 16px)) 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onTabChange(tab.id);
                  setDrawerOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isActive ? '#e0f2fe' : 'transparent',
                  color: isActive ? '#0284c7' : '#1e293b',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.92rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#0284c7' : tab.color,
                      flexShrink: 0
                    }}
                  >
                    {tab.icon}
                  </div>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </span>
                </div>
                {isActive && (
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#0284c7',
                      flexShrink: 0
                    }}
                  />
                )}
              </button>
            );
          })}

          {/* Divider between tabs and utility actions */}
          <div style={{ margin: '10px 6px 6px 6px', height: '1px', background: '#e2e8f0', flexShrink: 0 }} />

          {/* Profile & Security */}
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setSecurityModalOpen(true);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '14px',
              border: 'none',
              background: 'transparent',
              color: '#334155',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s ease'
            }}
            onTouchStart={e => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
            onTouchEnd={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Shield size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#1e293b' }}>Profile & Security</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>Manage passcode</p>
            </div>
          </button>

          {/* Install App */}
          {!isInstalled && onInstallClick && (
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onInstallClick();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: 'none',
                background: 'transparent',
                color: '#047857',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background-color 0.15s ease'
              }}
              onTouchStart={e => { e.currentTarget.style.backgroundColor = '#ecfdf5'; }}
              onTouchEnd={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Smartphone size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#065f46' }}>Install App</p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#059669' }}>Add to home screen</p>
              </div>
            </button>
          )}

          {/* Lock Profile */}
          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              lockPartner();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '14px',
              border: 'none',
              background: 'transparent',
              color: '#dc2626',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 0.15s ease'
            }}
            onTouchStart={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
            onTouchEnd={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <LogOut size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.86rem', color: '#b91c1c' }}>Lock Profile</p>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#ef4444' }}>Switch to {isP1 ? 'Mia' : 'Rajesh'}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Profile & Security Modal */}
      <SecurityModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onInstallClick={onInstallClick}
        isInstalled={isInstalled}
      />
    </>
  );
};

export default Navbar;
