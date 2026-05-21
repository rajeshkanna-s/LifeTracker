import React, { useState } from 'react';
import { Settings, Plus, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { FitnessSettings, Workout } from '../../types';

interface FitnessSettingsProps {
  settings: FitnessSettings;
  workouts: Workout[];
  onSettingsChange: (s: FitnessSettings) => void;
}

const Section: React.FC<{
  id: string; title: string; Icon: any; badge?: number | string;
  open: string; setOpen: (v: string) => void; children: React.ReactNode;
}> = ({ id, title, Icon, badge, open, setOpen, children }) => (
  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mb-3">
    <button onClick={() => setOpen(open === id ? '' : id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-orange-600" />
        </div>
        <span className="font-medium text-slate-800 text-sm">{title}</span>
        {badge !== undefined && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{badge}</span>}
      </div>
      {open === id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
    </button>
    {open === id && <div className="p-4 pt-0 border-t border-slate-100">{children}</div>}
  </div>
);

const FitnessSettingsTab: React.FC<FitnessSettingsProps> = ({ settings, workouts, onSettingsChange }) => {
  const [openSection, setOpenSection] = useState('types');
  const [newType, setNewType] = useState('');

  const update = (partial: Partial<FitnessSettings>) => onSettingsChange({ ...settings, ...partial });




  return (
    <div className="max-w-3xl mx-auto space-y-2 mt-4">
      {/* Custom Workout Types */}
      <Section id="types" title="Custom Workout Types" Icon={Settings} open={openSection} setOpen={setOpenSection}>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Workout Types</label>
            <div className="flex gap-2 mb-2">
              <input placeholder="New Workout Type" value={newType} onChange={e => setNewType(e.target.value)} className="input-unified" />
              <button onClick={() => { if (newType.trim()) { update({ customTypes: [...(settings.customTypes || []), newType.trim()] }); setNewType(""); } }} className="h-[38px] px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(settings.customTypes || []).map(c => (
                <span key={c} className="bg-orange-50 border border-orange-200 text-orange-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  {c} <button onClick={() => update({ customTypes: settings.customTypes.filter(x => x !== c) })} className="text-orange-500 hover:text-orange-700"><XCircle size={12} /></button>
                </span>
              ))}
              {(!settings.customTypes || settings.customTypes.length === 0) && <span className="text-xs text-slate-400 italic">No custom types added.</span>}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default FitnessSettingsTab;
