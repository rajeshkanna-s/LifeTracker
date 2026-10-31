import React, { useState } from 'react';
import { PartnerProvider, usePartner } from './context/PartnerContext';
import PartnerGateway from './components/PartnerGateway';
import Navbar from './components/Navbar';
import ExpenseTracker from './components/expenses/ExpenseTracker';
import DebtTracker from './components/debts/DebtTracker';
import JobTracker from './components/jobs/JobTracker';
import HabitTracker from './components/habits/HabitTracker';
import FitnessTracker from './components/fitness/FitnessTracker';
import NotesTracker from './components/notes/NotesTracker';
import RoutineTracker from './components/routines/RoutineTracker';
import VaultTracker from './components/vault/VaultTracker';
import type { TabId } from './types';
import { usePWA } from './utils/usePWA';
import { InstallModal } from './components/InstallModal';
import { AppInstallBanner } from './components/AppInstallBanner';

const AppContent: React.FC = () => {
  const { isUnlocked } = usePartner();
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
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
            onTabChange={setActiveTab} 
            onInstallClick={triggerInstall}
            isInstalled={isInstalled}
          />

          <main>
            {activeTab === 'expenses' && <ExpenseTracker />}
            {activeTab === 'debt' && <DebtTracker />}
            {activeTab === 'jobs' && <JobTracker />}
            {activeTab === 'habits' && <HabitTracker />}
            {activeTab === 'fitness' && <FitnessTracker />}
            {activeTab === 'notes' && <NotesTracker />}
            {activeTab === 'routines' && <RoutineTracker />}
            {activeTab === 'vault' && <VaultTracker />}
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
    <PartnerProvider>
      <AppContent />
    </PartnerProvider>
  );
};

export default App;
