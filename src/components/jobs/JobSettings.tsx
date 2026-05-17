import React, { useState } from 'react';
import { Settings, Plus, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { JobSettings, JobApplication } from '../../types';

interface JobSettingsProps {
  settings: JobSettings;
  jobs: JobApplication[];
  onSettingsChange: (s: JobSettings) => void;
}

const Section: React.FC<{
  id: string; title: string; Icon: any; badge?: number | string;
  open: string; setOpen: (v: string) => void; children: React.ReactNode;
}> = ({ id, title, Icon, badge, open, setOpen, children }) => (
  <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mb-3">
    <button onClick={() => setOpen(open === id ? '' : id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Icon size={16} className="text-indigo-600" />
        </div>
        <span className="font-medium text-slate-800 text-sm">{title}</span>
        {badge !== undefined && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">{badge}</span>}
      </div>
      {open === id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
    </button>
    {open === id && <div className="p-4 pt-0 border-t border-slate-100">{children}</div>}
  </div>
);

const JobSettingsTab: React.FC<JobSettingsProps> = ({ settings, jobs, onSettingsChange }) => {
  const [openSection, setOpenSection] = useState('categories');
  const [newSource, setNewSource] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const update = (partial: Partial<JobSettings>) => onSettingsChange({ ...settings, ...partial });

  const inputClass = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white";

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jobs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "job_applications_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-2 mt-4">
      {/* Custom Categories */}
      <Section id="categories" title="Custom Sources & Statuses" Icon={Settings} open={openSection} setOpen={setOpenSection}>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Custom Application Sources</label>
            <div className="flex gap-2 mb-2">
              <input placeholder="New Source" value={newSource} onChange={e => setNewSource(e.target.value)} className={inputClass} />
              <button onClick={() => { if (newSource.trim()) { update({ customSources: [...(settings.customSources || []), newSource.trim()] }); setNewSource(""); } }} className="h-[38px] px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(settings.customSources || []).map(c => (
                <span key={c} className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  {c} <button onClick={() => update({ customSources: settings.customSources.filter(x => x !== c) })} className="text-indigo-500 hover:text-indigo-700"><XCircle size={12} /></button>
                </span>
              ))}
              {(!settings.customSources || settings.customSources.length === 0) && <span className="text-xs text-slate-400 italic">No custom sources added.</span>}
            </div>
          </div>
          
          <hr className="border-slate-100" />
          
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">Custom Job Statuses</label>
            <div className="flex gap-2 mb-2">
              <input placeholder="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)} className={inputClass} />
              <button onClick={() => { if (newStatus.trim()) { update({ customStatuses: [...(settings.customStatuses || []), newStatus.trim()] }); setNewStatus(""); } }} className="h-[38px] px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(settings.customStatuses || []).map(c => (
                <span key={c} className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                  {c} <button onClick={() => update({ customStatuses: settings.customStatuses.filter(x => x !== c) })} className="text-indigo-500 hover:text-indigo-700"><XCircle size={12} /></button>
                </span>
              ))}
              {(!settings.customStatuses || settings.customStatuses.length === 0) && <span className="text-xs text-slate-400 italic">No custom statuses added.</span>}
            </div>
          </div>
        </div>
      </Section>

    </div>
  );
};

export default JobSettingsTab;
