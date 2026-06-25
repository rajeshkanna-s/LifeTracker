import React, { useState } from 'react';
import PinLock from './components/PinLock';
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

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('expenses');
  const [showMobileBanner, setShowMobileBanner] = useState(true);
  const { isInstallable, install } = usePWA();

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {isInstallable && showMobileBanner && (
        <div className="mobile-install-banner">
          <div className="banner-content">
            <div className="banner-logo">📊</div>
            <div className="banner-text">
              <strong>Install MyLife Tracker</strong>
              <span>Add to Home screen for quick offline access</span>
            </div>
          </div>
          <div className="banner-actions">
            <button className="btn-install-mobile" onClick={install}>Install</button>
            <button className="btn-close-banner" onClick={() => setShowMobileBanner(false)}>✕</button>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default App;
