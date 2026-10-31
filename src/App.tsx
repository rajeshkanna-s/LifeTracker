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

const AppContent: React.FC = () => {
  const { isUnlocked } = usePartner();
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [showMobileBanner, setShowMobileBanner] = useState(true);
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
      {!isInstalled && showMobileBanner && (
        <div className="mobile-install-banner">
          <div className="banner-content">
            <div className="banner-logo">📊</div>
            <div className="banner-text">
              <strong>Install MyLife Tracker</strong>
              <span>Add to Home screen for quick offline access</span>
            </div>
          </div>
          <div className="banner-actions">
            <button className="btn-install-mobile" onClick={triggerInstall}>Install</button>
            <button className="btn-close-banner" onClick={() => setShowMobileBanner(false)}>✕</button>
          </div>
        </div>
      )}

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
