import React from 'react';
import { Receipt, CreditCard, Building2, CheckSquare, Dumbbell, StickyNote, ListChecks, Lock, Download } from 'lucide-react';
import type { TabId } from '../types';
import { usePWA } from '../utils/usePWA';

interface NavbarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} /> },
  { id: 'debt', label: 'Debt', icon: <CreditCard size={16} /> },
  { id: 'jobs', label: 'Jobs', icon: <Building2 size={16} /> },
  { id: 'habits', label: 'Habits', icon: <CheckSquare size={16} /> },
  { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={16} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={16} /> },
  { id: 'routines', label: 'Routines', icon: <ListChecks size={16} /> },
  { id: 'vault', label: 'Vault', icon: <Lock size={16} /> },
];

const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { isInstallable, install } = usePWA();

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="app-navbar">
        <div className="app-brand">
          <div className="brand-icon">M</div>
          <span>MyLife Tracker</span>
          {isInstallable && (
            <button className="btn-install-desktop" onClick={install}>
              <Download size={14} />
              <span>Install App</span>
            </button>
          )}
        </div>
        <div className="nav-tabs-custom">
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
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        <div className="bottom-nav-inner">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`bottom-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="bottom-nav-icon">{tab.icon}</div>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navbar;
