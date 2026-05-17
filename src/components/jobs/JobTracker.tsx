import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, Pencil, Trash2, Briefcase, Calendar, Users, XCircle, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { JobApplication, JobSettings } from '../../types';
import { getDefaultJobSettings } from '../../data/constants';
import JobSettingsTab from './JobSettings';

const SOURCES = ['LinkedIn', 'Naukri', 'Indeed', 'Company Website', 'Referral', 'Other'];
const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Freelance', 'Internship'];
const MODES = ['Online', 'In-person', 'Phone'];

const JobTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [settings, setSettings] = useState<JobSettings>(getDefaultJobSettings());
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [form, setForm] = useState({
    company: '', role: '', applied_date: new Date().toISOString().split('T')[0],
    source: '', status: 'Applied', job_type: '', first_call_date: '', first_call_info: '',
    interview_date: '', interview_time: '', interview_mode: '', offer_amount: '', notes: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('job_applications').select('*').order('applied_date', { ascending: false });
    if (data) setJobs(data);
    const { data: setObj, error } = await supabase.from('job_settings').select('*').limit(1).single();
    if (setObj) {
      setSettingsId(setObj.id);
      setSettings({ ...getDefaultJobSettings(), ...(setObj.settings_json || {}) });
    } else if (error && error.code === 'PGRST116') {
      const { data: newRow } = await supabase.from('job_settings').insert({ settings_json: getDefaultJobSettings() }).select().single();
      if (newRow) setSettingsId(newRow.id);
    }
    setLoading(false);
  };

  const handleSettingsChange = async (newSettings: JobSettings) => {
    setSettings(newSettings);
    if (settingsId) {
      await supabase.from('job_settings').update({ settings_json: newSettings, updated_at: new Date().toISOString() }).eq('id', settingsId);
    }
  };

  const resetForm = () => {
    setForm({ company: '', role: '', applied_date: new Date().toISOString().split('T')[0], source: '', status: 'Applied', job_type: '', first_call_date: '', first_call_info: '', interview_date: '', interview_time: '', interview_mode: '', offer_amount: '', notes: '' });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.company) return;
    const payload = {
      company: form.company, role: form.role, applied_date: form.applied_date,
      source: form.source, status: form.status, job_type: form.job_type,
      first_call_date: form.first_call_date || null, first_call_info: form.first_call_info,
      interview_date: form.interview_date || null, interview_time: form.interview_time || null,
      interview_mode: form.interview_mode, offer_amount: form.offer_amount ? Number(form.offer_amount) : null, notes: form.notes
    };
    if (editId) { await supabase.from('job_applications').update(payload).eq('id', editId); }
    else { await supabase.from('job_applications').insert(payload); }
    setShowModal(false); resetForm(); fetchData();
  };

  const handleEdit = (j: JobApplication) => {
    setForm({ company: j.company, role: j.role || '', applied_date: j.applied_date || '', source: j.source || '', status: j.status || 'Applied', job_type: j.job_type || '', first_call_date: j.first_call_date || '', first_call_info: j.first_call_info || '', interview_date: j.interview_date || '', interview_time: j.interview_time || '', interview_mode: j.interview_mode || '', offer_amount: j.offer_amount ? String(j.offer_amount) : '', notes: j.notes || '' });
    setEditId(j.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => { await supabase.from('job_applications').delete().eq('id', id); fetchData(); };

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.company?.toLowerCase().includes(search.toLowerCase()) || j.role?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All Status' || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalApplied = jobs.length;
  const interviews = jobs.filter(j => j.status === 'Interview').length;
  const offers = jobs.filter(j => j.status === 'Offer').length;
  const rejected = jobs.filter(j => j.status === 'Rejected').length;
  const statusClass = (s: string) => s === 'Applied' ? 'applied' : s === 'Interview' ? 'interview' : s === 'Offer' ? 'offer' : 'rejected';

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const allSources = [...SOURCES, ...(settings.customSources || [])];
  const allStatuses = [...STATUSES, ...(settings.customStatuses || [])];

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="module-subtabs">
        <button onClick={() => setActiveTab('home')} className={`module-subtab ${activeTab === 'home' ? 'active-job' : ''}`}>
          <Building2 size={16} /> <span className="label-text">Dashboard</span>
        </button>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="module-subtab"
          style={{ color: '#6366f1' }}>
          <Plus size={16} /> <span className="label-text">Add Job</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`module-subtab ${activeTab === 'settings' ? 'active-job' : ''}`}>
          <Settings size={16} /> <span className="label-text">Settings</span>
        </button>
      </div>

      <div>
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Applied', value: totalApplied, icon: '💼', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
                { label: 'Interviews', value: interviews, icon: '📅', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
                { label: 'Offers', value: offers, icon: '🎉', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
                { label: 'Rejected', value: rejected, icon: '❌', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-4 shadow-md text-white" style={{ background: s.gradient }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-base">{s.icon}</div>
                    <span className="text-xs font-semibold text-white/80">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Job List */}
            <div className="card-dark !p-0">
              <div className="flex items-center gap-2 p-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 outline-none focus:border-indigo-400 placeholder:text-gray-400"
                    placeholder="Search company or role..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-xs text-gray-700 outline-none cursor-pointer"
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option>All Status</option>{allStatuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {filtered.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="text-4xl mb-3 opacity-40">🏢</div>
                  <h4 className="text-sm font-bold text-gray-800">No applications found</h4>
                  <p className="text-xs text-gray-400 mt-1">Start tracking your job applications</p>
                </div>
              ) : (
                <div className="px-1">
                  {filtered.map((j, i) => (
                    <div key={j.id} className="tx-item">
                      <div className="tx-icon" style={{ background: '#f0f0ff' }}>💼</div>
                      <div className="tx-details">
                        <p className="tx-amount">{j.company}</p>
                        <p className="tx-category">{j.role || 'No role specified'} · {j.source || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`status-badge ${statusClass(j.status)}`}>{j.status}</span>
                        <button className="btn-action" onClick={() => handleEdit(j)}><Pencil size={13} /></button>
                        <button className="btn-action danger" onClick={() => handleDelete(j.id)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <JobSettingsTab settings={settings} jobs={jobs} onSettingsChange={handleSettingsChange} />
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editId ? 'Edit Application' : 'Add Job Application'}</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Company Name *</label><input className="form-control-custom" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Role / Position</label><input className="form-control-custom" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Applied Date</label><input type="date" className="form-control-custom" value={form.applied_date} onChange={e => setForm({ ...form, applied_date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Source</label><select className="form-control-custom" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}><option value="">Select</option>{allSources.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-control-custom" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{allStatuses.map(s => <option key={s}>{s}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Job Type</label><select className="form-control-custom" value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })}><option value="">Select</option>{JOB_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div className="form-group"><label className="form-label">1st Call Date</label><input type="date" className="form-control-custom" value={form.first_call_date} onChange={e => setForm({ ...form, first_call_date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">1st Call Info</label><input className="form-control-custom" value={form.first_call_info} onChange={e => setForm({ ...form, first_call_info: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Interview Date</label><input type="date" className="form-control-custom" value={form.interview_date} onChange={e => setForm({ ...form, interview_date: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Interview Time</label><input type="time" className="form-control-custom" value={form.interview_time} onChange={e => setForm({ ...form, interview_time: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Interview Mode</label><select className="form-control-custom" value={form.interview_mode} onChange={e => setForm({ ...form, interview_mode: e.target.value })}><option value="">Select</option>{MODES.map(m => <option key={m}>{m}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Offer Amount (₹)</label><input type="number" className="form-control-custom" value={form.offer_amount} onChange={e => setForm({ ...form, offer_amount: e.target.value })} /></div>
                <div className="form-group full"><label className="form-label">Notes</label><textarea className="form-control-custom" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-submit blue" onClick={handleSubmit}>{editId ? 'Update' : 'Add'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTracker;
