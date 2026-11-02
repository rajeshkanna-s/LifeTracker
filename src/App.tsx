import React, { useState, useEffect, useRef } from 'react';
import { PartnerProvider, usePartner } from './context/PartnerContext';
import { ThemeProvider } from './context/ThemeContext';
import PartnerGateway from './components/PartnerGateway';
import Navbar from './components/Navbar';
import ExpenseTracker from './components/expenses/ExpenseTracker';
import AccountsTracker from './components/accounts/AccountsTracker';
import BudgetsTracker from './components/budgets/BudgetsTracker';
import GoalsTracker from './components/goals/GoalsTracker';
import CalendarTracker from './components/calendar/CalendarTracker';
import CalculatorHub from './components/calculator/CalculatorHub';
import WarrantiesTracker from './components/warranties/WarrantiesTracker';
import DebtTracker from './components/debts/DebtTracker';
import JobTracker from './components/jobs/JobTracker';
import HabitTracker from './components/habits/HabitTracker';
import FitnessTracker from './components/fitness/FitnessTracker';
import NotesTracker from './components/notes/NotesTracker';
import RoutineTracker from './components/routines/RoutineTracker';
import VaultTracker from './components/vault/VaultTracker';
import RemindersTracker from './components/reminders/RemindersTracker';
import type { TabId } from './types';
import { usePWA } from './utils/usePWA';
import { InstallModal } from './components/InstallModal';
import { AppInstallBanner } from './components/AppInstallBanner';
import { triggerDueReminders } from './utils/notificationService';
import { formatLocalDate } from './utils/expenseUtils';

const VALID_TABS: readonly TabId[] = [
  'expenses',
  'accounts',
  'budgets',
  'goals',
  'calendar',
  'calculator',
  'warranties',
  'debt',
  'jobs',
  'habits',
  'fitness',
  'notes',
  'routines',
  'vault',
  'remainder'
];

function isValidTab(tab: unknown): tab is TabId {
  return typeof tab === 'string' && (VALID_TABS as readonly string[]).includes(tab);
}

function getSavedTab(partnerId?: string): TabId {
  try {
    const hash = window.location.hash.replace(/^#/, '').trim();
    if (isValidTab(hash)) return hash;

    if (partnerId) {
      const partnerSaved = sessionStorage.getItem(`mylife_active_tab_${partnerId}`) || localStorage.getItem(`mylife_active_tab_${partnerId}`);
      if (isValidTab(partnerSaved)) return partnerSaved;
    }

    const globalSaved = sessionStorage.getItem('mylife_active_tab') || localStorage.getItem('mylife_active_tab');
    if (isValidTab(globalSaved)) return globalSaved;
  } catch {
    // ignore
  }
  return 'expenses';
}

function persistActiveTab(tab: TabId, partnerId?: string) {
  try {
    sessionStorage.setItem('mylife_active_tab', tab);
    localStorage.setItem('mylife_active_tab', tab);
    if (partnerId) {
      sessionStorage.setItem(`mylife_active_tab_${partnerId}`, tab);
      localStorage.setItem(`mylife_active_tab_${partnerId}`, tab);
    }
    if (window.history && window.history.replaceState) {
      const targetHash = tab === 'expenses' ? '' : `#${tab}`;
      const newUrl = `${window.location.pathname}${window.location.search}${targetHash}`;
      window.history.replaceState(null, '', newUrl);
    }
  } catch {
    // ignore
  }
}

const AppContent: React.FC = () => {
  const { isUnlocked, activePartnerId } = usePartner();
  const [activeTab, setActiveTab] = useState<TabId>(() => getSavedTab(activePartnerId));
  const [tabHistory, setTabHistory] = useState<TabId[]>(() => {
    const initial = getSavedTab(activePartnerId);
    return initial === 'expenses' ? ['expenses'] : ['expenses', initial];
  });

  const prevPartnerIdRef = useRef<string>(activePartnerId);

  // Sync initial tab state to URL & storage on mount so everything is unified
  useEffect(() => {
    persistActiveTab(activeTab, activePartnerId);
  }, []);

  // When switching between partners, switch to the newly active partner's saved tab
  useEffect(() => {
    if (prevPartnerIdRef.current !== activePartnerId) {
      prevPartnerIdRef.current = activePartnerId;
      const partnerTab = getSavedTab(activePartnerId);
      setActiveTab(partnerTab);
      setTabHistory(partnerTab === 'expenses' ? ['expenses'] : ['expenses', partnerTab]);
      persistActiveTab(partnerTab, activePartnerId);
    }
  }, [activePartnerId]);

  // Listen to browser navigation (back/forward button hash changes)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '').trim();
      const targetTab = isValidTab(hash) ? hash : 'expenses';
      if (targetTab !== activeTab) {
        setActiveTab(targetTab);
        setTabHistory(prev => [...prev, targetTab]);
        persistActiveTab(targetTab, activePartnerId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab, activePartnerId]);

  // Universal background reminder engine: checks due reminders every 4 seconds
  // across all pages and on mobile wakeup / visibilitychange, pushing notifications to the top bar
  useEffect(() => {
    if (!isUnlocked || !activePartnerId) return;

    // Run immediately on unlock/mount
    triggerDueReminders(activePartnerId);

    // Fast 4-second ticker so reminders fire promptly at due minute
    const interval = setInterval(() => {
      triggerDueReminders(activePartnerId);
    }, 4000);

    // Immediate evaluation when user turns on phone screen or switches back to tab
    const handleWakeup = () => {
      if (document.visibilityState === 'visible') {
        triggerDueReminders(activePartnerId);
      }
    };

    document.addEventListener('visibilitychange', handleWakeup);
    window.addEventListener('focus', handleWakeup);
    window.addEventListener('pageshow', handleWakeup);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWakeup);
      window.removeEventListener('focus', handleWakeup);
      window.removeEventListener('pageshow', handleWakeup);
    };
  }, [activePartnerId, isUnlocked]);

  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    install,
    triggerInstall,
    showInstallModal,
    setShowInstallModal
  } = usePWA();

  const handleTabChange = (newTab: TabId) => {
    if (newTab === activeTab) return;
    persistActiveTab(newTab, activePartnerId);
    setTabHistory(prev => [...prev, newTab]);
    setActiveTab(newTab);
  };

  const handleBack = () => {
    // First dispatch event for nested module handlers (e.g. Expense subtabs)
    const event = new CustomEvent('app-back-pressed', { cancelable: true });
    window.dispatchEvent(event);
    if (event.defaultPrevented) return;

    if (tabHistory.length > 1) {
      const newHistory = [...tabHistory];
      newHistory.pop();
      const prevTab = newHistory[newHistory.length - 1];
      setTabHistory(newHistory);
      setActiveTab(prevTab);
      persistActiveTab(prevTab, activePartnerId);
    } else if (activeTab !== 'expenses') {
      setActiveTab('expenses');
      setTabHistory(['expenses']);
      persistActiveTab('expenses', activePartnerId);
    }
  };

  const canGoBack = activeTab !== 'expenses' || tabHistory.length > 1;

  return (
    <div>
      {/* Universal Top Automatic App Install Bar */}
      <AppInstallBanner
        onInstall={triggerInstall}
        isInstalled={isInstalled}
      />

      {!isUnlocked ? (
        <PartnerGateway onInstallClick={triggerInstall} isInstalled={isInstalled} />
      ) : (
        <>
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onInstallClick={triggerInstall}
            isInstalled={isInstalled}
          />

          <main key={activePartnerId}>
            {activeTab === 'expenses' && <ExpenseTracker key={`expenses-${activePartnerId}`} />}
            {activeTab === 'accounts' && <AccountsTracker key={`accounts-${activePartnerId}`} />}
            {activeTab === 'budgets' && <BudgetsTracker key={`budgets-${activePartnerId}`} />}
            {activeTab === 'goals' && <GoalsTracker key={`goals-${activePartnerId}`} />}
            {activeTab === 'calendar' && <CalendarTracker key={`calendar-${activePartnerId}`} onNavigateTab={handleTabChange} />}
            {activeTab === 'calculator' && <CalculatorHub key={`calculator-${activePartnerId}`} />}
            {activeTab === 'warranties' && <WarrantiesTracker key={`warranties-${activePartnerId}`} />}
            {activeTab === 'debt' && <DebtTracker key={`debt-${activePartnerId}`} />}
            {activeTab === 'jobs' && <JobTracker key={`jobs-${activePartnerId}`} />}
            {activeTab === 'habits' && <HabitTracker key={`habits-${activePartnerId}`} />}
            {activeTab === 'fitness' && <FitnessTracker key={`fitness-${activePartnerId}`} />}
            {activeTab === 'notes' && <NotesTracker key={`notes-${activePartnerId}`} />}
            {activeTab === 'routines' && <RoutineTracker key={`routines-${activePartnerId}`} />}
            {activeTab === 'vault' && <VaultTracker key={`vault-${activePartnerId}`} />}
            {activeTab === 'remainder' && <RemindersTracker key={`remainder-${activePartnerId}`} />}
          </main>
        </>
      )}

      {/* Redesigned Native Installation Modal */}
      <InstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        isInstallable={isInstallable}
        onNativeInstall={install}
        isIOS={isIOS}
        isAndroid={isAndroid}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PartnerProvider>
        <AppContent />
      </PartnerProvider>
    </ThemeProvider>
  );
};

export default App;
