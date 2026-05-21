import React, { useState } from 'react';
import { Settings, Plus, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { HabitSettings, Habit } from '../../types';

interface HabitSettingsProps {
  settings: HabitSettings;
  habits: Habit[];
  onSettingsChange: (s: HabitSettings) => void;
}

const Section: React.FC<{
  id: string; title: string; Icon: any; badge?: number | string;
  open: string; setOpen: (v: string) => void; children: React.ReactNode;
}> = ({ id, title, Icon, badge, open, setOpen, children }) => (
  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mb-3">
    <button onClick={() => setOpen(open === id ? '' : id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-purple-600" />
        </div>
        <span className="font-medium text-slate-800 text-sm">{title}</span>
        {badge !== undefined && <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{badge}</span>}
      </div>
      {open === id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
    </button>
    {open === id && <div className="p-4 pt-0 border-t border-slate-100">{children}</div>}
  </div>
);

const HabitSettingsTab: React.FC<HabitSettingsProps> = ({ settings, habits, onSettingsChange }) => {
  const [openSection, setOpenSection] = useState('categories');
  const [newCategory, setNewCategory] = useState('');

  const update = (partial: Partial<HabitSettings>) => onSettingsChange({ ...settings, ...partial });




  return (
    <div className="max-w-3xl mx-auto space-y-2 mt-4">
      {/* Custom Categories */}
      <Section id="categories" title="Custom Habit Categories" Icon={Settings} open={openSection} setOpen={setOpenSection}>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Categories</label>
            <div className="flex gap-2 mb-2">
              <input placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="input-unified" />
              <button onClick={() => { if (newCategory.trim()) { update({ customCategories: [...(settings.customCategories || []), newCategory.trim()] }); setNewCategory(""); } }} className="h-[38px] px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(settings.customCategories || []).map(c => (
                <span key={c} className="bg-purple-50 border border-purple-200 text-purple-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  {c} <button onClick={() => update({ customCategories: settings.customCategories.filter(x => x !== c) })} className="text-purple-500 hover:text-purple-700"><XCircle size={12} /></button>
                </span>
              ))}
              {(!settings.customCategories || settings.customCategories.length === 0) && <span className="text-xs text-slate-400 italic">No custom categories added.</span>}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default HabitSettingsTab;
