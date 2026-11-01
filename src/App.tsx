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
import { playReminderChime, sendBrowserNotification } from './utils/notificationService';
import { formatLocalDate } from './utils/expenseUtils';

const AppContent: React.FC = () => {
  const { isUnlocked, activePartnerId } = usePartner();
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [tabHistory, setTabHistory] = useState<TabId[]>(['expenses']);

  // Universal background reminder engine: checks due reminders every 12 seconds
  // across all pages and pushes notifications to the mobile top bar and audio chime
  useEffect(() => {
    if (!isUnlocked) return;

    const checkGlobalReminders = async () => {
      try {
        const storageKey = `xpenser_reminders_${activePartnerId}`;
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;

        const list = JSON.parse(raw);
        if (!Array.isArray(list)) return;

        const now = new Date();
        const todayStr = formatLocalDate(now);
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        let changed = false;
        const updated = list.map((item: any) => {
          const rTime = (item.reminder_time || '').slice(0, 5);
          if (
            item &&
            item.partner_id === activePartnerId &&
            !item.is_completed &&
            !item.notification_sent &&
            (item.reminder_date < todayStr || (item.reminder_date === todayStr && rTime <= currentTimeStr))
          ) {
            changed = true;
            playReminderChime();
            sendBrowserNotification(
              `⏰ Remainder: ${item.title}`,
              item.description || `Scheduled for ${rTime}`
            );

            if (item.repeat_type && item.repeat_type !== 'none') {
              const d = new Date(item.reminder_date);
              if (item.repeat_type === 'daily') d.setDate(d.getDate() + 1);
              else if (item.repeat_type === 'weekly') d.setDate(d.getDate() + 7);
              else if (item.repeat_type === 'monthly') d.setMonth(d.getMonth() + 1);
              else if (item.repeat_type === 'yearly') d.setFullYear(d.getFullYear() + 1);
              return {
                ...item,
                reminder_date: formatLocalDate(d),
                notification_sent: false,
                updated_at: new Date().toISOString()
              };
            }

            return {
              ...item,
              notification_sent: true,
              updated_at: new Date().toISOString()
            };
          }
          return item;
        });

        if (changed) {
          localStorage.setItem(storageKey, JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('xpenser-reminders-updated'));
        }
      } catch {
        // ignore
      }
    };

    const interval = setInterval(checkGlobalReminders, 10000);
    checkGlobalReminders();
    return () => clearInterval(interval);
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
