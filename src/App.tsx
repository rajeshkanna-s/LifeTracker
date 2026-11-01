import React, { useState, useEffect } from 'react';
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

const AppContent: React.FC = () => {
  const { isUnlocked, activePartnerId } = usePartner();
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [tabHistory, setTabHistory] = useState<TabId[]>(['expenses']);

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

  // Reset to first page ('expenses') whenever partner is switched or application is unlocked
  useEffect(() => {
    setActiveTab('expenses');
    setTabHistory(['expenses']);
  }, [activePartnerId, isUnlocked]);

  const handleTabChange = (newTab: TabId) => {
    if (newTab === activeTab) return;
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
    } else if (activeTab !== 'expenses') {
      setActiveTab('expenses');
      setTabHistory(['expenses']);
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
