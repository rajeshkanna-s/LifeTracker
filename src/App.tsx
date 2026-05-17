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

const App: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('expenses');

  if (!unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <div>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
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
