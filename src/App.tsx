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
import { playReminderChime, sendBrowserNotification } from './utils/notificationService';
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
