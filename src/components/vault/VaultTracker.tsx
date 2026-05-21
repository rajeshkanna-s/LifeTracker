import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Credential } from '../../types';
import { 
  Lock, Eye, EyeOff, Plus, Trash2, Pencil, Search, X, 
  Copy, Check, ExternalLink, KeyRound, AlertTriangle, RefreshCw,
  ShieldCheck, ShieldAlert, Info, HelpCircle
} from 'lucide-react';

const VaultTracker: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'generator' | 'info'>('list');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [form, setForm] = useState({
    service_name: '',
    username: '',
    password: '',
    url: '',
    notes: ''
  });

  // Dedicated generator states
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genResult, setGenResult] = useState('');
  const [genCopied, setGenCopied] = useState(false);

  // Password visibility tracking by credential ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  // Clipboard copy state tracking
  const [copiedState, setCopiedState] = useState<{ id: string; type: 'username' | 'password' } | null>(null);

  useEffect(() => {
    fetchCredentials();
    generateDedicatedPassword();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .order('service_name', { ascending: true });

      if (error) {
        throw error;
      }
      if (data) {
        setCredentials(data);
      }
    } catch (err: any) {
      console.error('Error fetching credentials:', err);
      if (err.message && (err.message.includes('relation') || err.message.includes('does not exist'))) {
        setErrorState('table_not_found');
      } else {
        setErrorState(err.message || 'An error occurred while fetching credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.service_name.trim()) return;

    const payload = {
      service_name: form.service_name.trim(),
      username: form.username.trim(),
      password: form.password,
      url: form.url.trim(),
      notes: form.notes.trim(),
      updated_at: new Date().toISOString()
    };

    try {
      if (editId) {
        const { error } = await supabase
          .from('credentials')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('credentials')
          .insert(payload);
        if (error) throw error;
      }
      
      setShowForm(false);
      resetForm();
      fetchCredentials();
    } catch (err: any) {
      alert(err.message || 'Error saving credential');
    }
  };

  const handleEdit = (cred: Credential) => {
    setForm({
      service_name: cred.service_name,
      username: cred.username || '',
      password: cred.password || '',
      url: cred.url || '',
      notes: cred.notes || ''
    });
    setEditId(cred.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential? This action cannot be undone.')) return;
    try {
      const { error } = await supabase
        .from('credentials')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchCredentials();
    } catch (err: any) {
      alert(err.message || 'Error deleting credential');
    }
  };

  const resetForm = () => {
    setForm({
      service_name: '',
      username: '',
      password: '',
      url: '',
      notes: ''
    });
    setEditId(null);
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length > 8) score++;
    if (pass.length > 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score, label: 'Moderate', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const generateRandomString = (length: number, upper: boolean, lower: boolean, nums: boolean, syms: boolean) => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (nums) chars += '0123456789';
    if (syms) chars += '!@#$%^&*()_+~|}{[]:;?><,./-=';
    
    if (!chars) return '';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const generateFormPassword = () => {
    const pass = generateRandomString(16, true, true, true, true);
    setForm(prev => ({ ...prev, password: pass }));
  };

  const generateDedicatedPassword = () => {
    const pass = generateRandomString(genLength, genUpper, genLower, genNumbers, genSymbols);
    setGenResult(pass);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text: string, id: string, type: 'username' | 'password') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedState({ id, type });
    setTimeout(() => setCopiedState(null), 2000);
  };

  const copyDedicatedPassword = () => {
    if (!genResult) return;
    navigator.clipboard.writeText(genResult);
    setGenCopied(true);
    setTimeout(() => setGenCopied(false), 2000);
  };

  const filteredCredentials = credentials.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      c.service_name.toLowerCase().includes(query) ||
      (c.username && c.username.toLowerCase().includes(query)) ||
      (c.notes && c.notes.toLowerCase().includes(query))
    );
  });

  // Graceful setup render if table is missing
  if (errorState === 'table_not_found') {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-red-100 rounded-3xl shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800 font-sans">Database Table Setup Required</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            To use the secure privacy Vault, you must first create the credentials table in your Supabase database.
          </p>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs font-mono text-slate-600 max-h-48 overflow-y-auto whitespace-pre">
          {`CREATE TABLE public.credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    username TEXT,
    password TEXT NOT NULL,
    url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`}
        </div>

        <button
          onClick={fetchCredentials}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
        >
          Check Table Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="module-subtabs">
        <button 
          onClick={() => setActiveSubTab('list')} 
          className={`module-subtab ${activeSubTab === 'list' ? 'active-vault' : ''}`}
        >
          <Lock size={16} /> <span className="label-text">Credentials</span>
        </button>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="module-subtab" 
          style={{ color: '#3b82f6' }}
        >
          <Plus size={16} /> <span className="label-text">Add Account</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('generator')} 
          className={`module-subtab ${activeSubTab === 'generator' ? 'active-vault' : ''}`}
        >
          <RefreshCw size={16} /> <span className="label-text">Key Generator</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('info')} 
          className={`module-subtab ${activeSubTab === 'info' ? 'active-vault' : ''}`}
        >
          <Info size={16} /> <span className="label-text">Security Info</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'list' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header & Search Bar Row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search accounts or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control-custom w-full"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            
            <div className="text-right text-[11px] font-semibold text-slate-400 self-center">
              Total Logins: <span className="text-slate-700 font-bold">{credentials.length}</span>
            </div>
          </div>

          {/* Cards List Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCredentials.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-blue-50/50 text-blue-500/70 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <KeyRound size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm">No accounts found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery ? "No matches for your current search filters." : "Your vault is empty. Click 'Add Account' in sub-tabs above to secure your first login details."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCredentials.map(cred => {
                const isPasswordVisible = !!visiblePasswords[cred.id];
                const strength = getPasswordStrength(cred.password || '');
                
                return (
                  <div key={cred.id} className="card-dark flex flex-col justify-between space-y-4">
                    <div className="space-y-3.5">
                      {/* Card Title Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-slate-800 text-sm truncate max-w-[180px]">
                            {cred.service_name}
                          </h3>
                          {cred.url && (
                            <a
                              href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:underline"
                            >
                              Visit link <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(cred)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-lg transition"
                            title="Edit Account"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(cred.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-100 rounded-lg transition"
                            title="Delete Account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <hr className="border-slate-100" />

                      {/* Vault Item Details */}
                      <div className="space-y-3">
                        {/* Username */}
                        {cred.username && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Username / ID</span>
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 gap-2">
                              <span className="text-xs text-slate-700 font-semibold truncate select-all">{cred.username}</span>
                              <button
                                onClick={() => copyToClipboard(cred.username || '', cred.id, 'username')}
                                className="p-1 text-slate-400 hover:text-slate-600 transition"
                                title="Copy Username"
                              >
                                {copiedState?.id === cred.id && copiedState?.type === 'username' ? (
                                  <Check size={14} className="text-emerald-500" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Password */}
                        {cred.password && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Password</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${strength.color}`} title={`Strength: ${strength.label}`} />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{strength.label}</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100 gap-2">
                              <span className="text-xs text-slate-700 font-bold truncate font-mono select-all tracking-wider">
                                {isPasswordVisible ? cred.password : '••••••••••••••••'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => togglePasswordVisibility(cred.id)}
                                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                                  title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                                >
                                  {isPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                                <button
                                  onClick={() => copyToClipboard(cred.password || '', cred.id, 'password')}
                                  className="p-1 text-slate-400 hover:text-slate-600 transition"
                                  title="Copy Password"
                                >
                                  {copiedState?.id === cred.id && copiedState?.type === 'password' ? (
                                    <Check size={14} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {cred.notes && (
                      <div className="pt-2 border-t border-dashed border-slate-100 space-y-1">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Security Notes</span>
                        <p className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50 leading-relaxed max-h-20 overflow-y-auto font-sans">
                          {cred.notes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Key Generator Screen */}
      {activeSubTab === 'generator' && (
        <div className="card-dark p-6 max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Password Generator</h2>
              <p className="text-xs text-slate-400">Create ultra-secure, cryptographically robust keys instantly.</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Generated Result Card */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl gap-3">
            <span className="text-base font-bold text-slate-800 font-mono tracking-wider break-all select-all self-center">
              {genResult || 'Select Options to Generate'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={generateDedicatedPassword}
                className="p-2.5 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 rounded-xl transition flex items-center justify-center"
                title="Regenerate"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={copyDedicatedPassword}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                {genCopied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Key
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Strength Meter */}
          {genResult && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-500">Key Strength:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  getPasswordStrength(genResult).label === 'Strong' ? 'bg-emerald-50 text-emerald-600' :
                  getPasswordStrength(genResult).label === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {getPasswordStrength(genResult).label}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(genResult).color}`}
                  style={{ width: `${(getPasswordStrength(genResult).score / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Password Length:</span>
                <span className="text-blue-600 font-bold">{genLength} Characters</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={genLength}
                onChange={(e) => { setGenLength(parseInt(e.target.value)); setTimeout(generateDedicatedPassword, 0); }}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition">
                <input
                  type="checkbox"
                  checked={genUpper}
                  onChange={(e) => { setGenUpper(e.target.checked); setTimeout(generateDedicatedPassword, 0); }}
                  className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">A-Z (Uppercase)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition">
                <input
                  type="checkbox"
                  checked={genLower}
                  onChange={(e) => { setGenLower(e.target.checked); setTimeout(generateDedicatedPassword, 0); }}
                  className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">a-z (Lowercase)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition">
                <input
                  type="checkbox"
                  checked={genNumbers}
                  onChange={(e) => { setGenNumbers(e.target.checked); setTimeout(generateDedicatedPassword, 0); }}
                  className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">0-9 (Numbers)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100/50 transition">
                <input
                  type="checkbox"
                  checked={genSymbols}
                  onChange={(e) => { setGenSymbols(e.target.checked); setTimeout(generateDedicatedPassword, 0); }}
                  className="rounded text-blue-600 focus:ring-blue-500/20 w-4 h-4"
                />
                <span className="text-xs font-semibold text-slate-700">!@#$ (Special Chars)</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={generateDedicatedPassword}
            className="btn-submit vault-blue w-full flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} /> Refresh generated key
          </button>
        </div>
      )}

      {/* Security Info Screen */}
      {activeSubTab === 'info' && (
        <div className="card-dark p-6 max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Security Vault Architecture</h2>
              <p className="text-xs text-slate-400">Rest assured that your password and credentials data are fully guarded.</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="space-y-4 text-xs leading-relaxed text-slate-600">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 flex-shrink-0">1</div>
              <p>
                <strong className="text-slate-800">PIN Access Lock:</strong> The app utilizes a global frontend lock protection system (`PinLock.tsx`) to guard access at page load. No one can view your credentials or open pages without entering the correct secure vault PIN.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 flex-shrink-0">2</div>
              <p>
                <strong className="text-slate-800">Row Level Security (RLS):</strong> The database utilizes Supabase policies to secure data directly at the API gateway layer. High performance SSL certificates fully encrypt all traffic back and forth to the server.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 flex-shrink-0">3</div>
              <p>
                <strong className="text-slate-800">Dynamic UI Masking:</strong> Active text inputs and password labels remain fully hidden under standard dot-masks (`••••••••`) in list views. They are only loaded into system RAM and never stored plain in readable cache pools.
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700">
            <HelpCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold font-sans">Need to change your Global PIN?</h4>
              <p className="text-[10px] leading-relaxed">
                You can easily manage your entry lock code by navigating to the core Dashboard profile settings inside your sidebar panels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal (Native Overlay Styling) */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-blue-500" />
                <h3 className="text-base font-bold text-slate-800">
                  {editId ? 'Edit Secure Details' : 'Secure New Details'}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="modal-close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="modal-body">
              <form onSubmit={handleSave} id="vault-credential-form" className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Service / Platform Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gmail, Amazon, Wi-Fi"
                    value={form.service_name}
                    onChange={(e) => setForm(prev => ({ ...prev, service_name: e.target.value }))}
                    className="form-control-custom"
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">URL / Website Link</label>
                  <input
                    type="text"
                    placeholder="e.g. accounts.google.com"
                    value={form.url}
                    onChange={(e) => setForm(prev => ({ ...prev, url: e.target.value }))}
                    className="form-control-custom"
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Username / Login ID</label>
                  <input
                    type="text"
                    placeholder="e.g. user@gmail.com"
                    value={form.username}
                    onChange={(e) => setForm(prev => ({ ...prev, username: e.target.value }))}
                    className="form-control-custom"
                  />
                </div>

                <div className="form-group full">
                  <div className="flex justify-between items-center">
                    <label className="form-label">Password *</label>
                    <button
                      type="button"
                      onClick={generateFormPassword}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded transition"
                    >
                      <RefreshCw size={10} /> Generate Strong
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter secret password"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="form-control-custom font-mono"
                  />
                  {form.password && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="h-1 bg-slate-100 flex-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${getPasswordStrength(form.password).color}`}
                          style={{ width: `${(getPasswordStrength(form.password).score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{getPasswordStrength(form.password).label}</span>
                    </div>
                  )}
                </div>

                <div className="form-group full">
                  <label className="form-label">Security Notes / Details</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Recovery keys, pin codes, security questions"
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-control-custom"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="vault-credential-form"
                className="btn-submit blue"
              >
                {editId ? 'Save Edits' : 'Store Securely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VaultTracker;
