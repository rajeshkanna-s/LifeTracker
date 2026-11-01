import React, { useState, useMemo } from 'react';
import { Shield, Heart, Activity, FileText, Calendar, Plus, Search, Trash2, Pencil, Download, AlertCircle, X } from 'lucide-react';
import type { Insurance, DebtSettings } from '../../types';
import { formatLocalDate } from '../../utils/expenseUtils';

interface DebtInsuranceProps {
  settings: DebtSettings;
  onSave: (insurance: Insurance) => void;
  onDelete: (id: string) => void;
}

const DebtInsurance: React.FC<DebtInsuranceProps> = ({ settings, onSave, onDelete }) => {
  const insurances = useMemo(() => settings.insurances || [], [settings.insurances]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Insurance | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    policyName: '',
    type: 'Term Ins',
    policyNumber: '',
    startDate: '',
    expireDate: '',
    paymentAmount: '',
    paymentFrequency: 'yearly',
    downloadUrl: '',
    fileName: ''
  });

  const openAddModal = () => {
    setEditingPolicy(null);
    setFormData({
      policyName: '',
      type: 'Term Ins',
      policyNumber: '',
      startDate: '',
      expireDate: '',
      paymentAmount: '',
      paymentFrequency: 'yearly',
      downloadUrl: '',
      fileName: ''
    });
    setShowModal(true);
  };

  const openEditModal = (policy: Insurance) => {
    setEditingPolicy(policy);
    setFormData({
      policyName: policy.policyName,
      type: policy.type,
      policyNumber: policy.policyNumber,
      startDate: policy.startDate,
      expireDate: policy.expireDate,
      paymentAmount: policy.paymentAmount.toString(),
      paymentFrequency: policy.paymentFrequency,
      downloadUrl: policy.downloadUrl || '',
      fileName: policy.fileName || ''
    });
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the 2MB limit. Please upload a smaller file or paste an external URL link.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          downloadUrl: reader.result as string,
          fileName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.policyName || !formData.policyNumber || !formData.startDate || !formData.expireDate || !formData.paymentAmount) {
      alert('Please fill out all required fields.');
      return;
    }

    const payload: Insurance = {
      id: editingPolicy?.id || crypto.randomUUID(),
      policyName: formData.policyName,
      type: formData.type,
      policyNumber: formData.policyNumber,
      startDate: formData.startDate,
      expireDate: formData.expireDate,
      paymentAmount: parseFloat(formData.paymentAmount),
      paymentFrequency: formData.paymentFrequency as 'monthly' | 'yearly',
      downloadUrl: formData.downloadUrl || undefined,
      fileName: formData.fileName || undefined,
      created_at: editingPolicy?.created_at || new Date().toISOString()
    };

    onSave(payload);
    setShowModal(false);
  };

  const handleDownload = (policy: Insurance) => {
    if (!policy.downloadUrl) return;

    if (policy.downloadUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = policy.downloadUrl;
      link.setAttribute('download', policy.fileName || `${policy.policyName}_policy`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // External link
      let url = policy.downloadUrl;
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Stat Calculations
  const today = formatLocalDate(new Date());

  const stats = useMemo(() => {
    let activeCount = 0;
    let expiredCount = 0;
    let monthlyPremiumTotal = 0;
    let yearlyPremiumTotal = 0;
    let expiringSoonCount = 0;

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysFromNowStr = formatLocalDate(thirtyDaysFromNow);

    insurances.forEach(p => {
      const isExpired = p.expireDate < today;
      const isExpiringSoon = !isExpired && p.expireDate <= thirtyDaysFromNowStr;

      if (isExpired) {
        expiredCount++;
      } else {
        activeCount++;
        if (isExpiringSoon) expiringSoonCount++;
      }

      const amt = Number(p.paymentAmount) || 0;
      if (p.paymentFrequency === 'monthly') {
        monthlyPremiumTotal += amt;
        yearlyPremiumTotal += amt * 12;
      } else {
        monthlyPremiumTotal += amt / 12;
        yearlyPremiumTotal += amt;
      }
    });

    return {
      activeCount,
      expiredCount,
      monthlyPremiumTotal,
      yearlyPremiumTotal,
      expiringSoonCount
    };
  }, [insurances, today]);

  // Filtering
  const filteredPolicies = useMemo(() => {
    return insurances.filter(p => {
      const matchesSearch =
        p.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.policyNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [insurances, searchQuery, selectedTypeFilter]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Term Ins':
        return <Shield size={18} className="text-blue-500" />;
      case 'Life Ins':
        return <Heart size={18} className="text-rose-500" />;
      case 'Medical Ins':
        return <Activity size={18} className="text-emerald-500" />;
      default:
        return <FileText size={18} className="text-slate-500" />;
    }
  };

  const getExpiryBadge = (expireDate: string) => {
    const isExpired = expireDate < today;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysFromNowStr = formatLocalDate(thirtyDaysFromNow);
    const isExpiringSoon = !isExpired && expireDate <= thirtyDaysFromNowStr;

    if (isExpired) {
      return (
        <span className="status-badge rejected">
          Expired
        </span>
      );
    } else if (isExpiringSoon) {
      return (
        <span className="status-badge interview">
          Expiring Soon
        </span>
      );
    } else {
      return (
        <span className="status-badge offer">
          Active
        </span>
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-bl-full -mr-2 -mt-2"></div>
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm">
            <Shield size={18} />
          </div>
          <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 relative z-10">Active Policies</p>
          <p className="text-2xl font-bold text-indigo-950 dark:text-indigo-100 mt-1 tracking-tight relative z-10">
            {stats.activeCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {insurances.length}</span>
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/40 dark:to-green-950/40 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-bl-full -mr-2 -mt-2"></div>
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm">
            <Activity size={18} />
          </div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 relative z-10">Monthly Premium</p>
          <p className="text-2xl font-bold text-emerald-950 dark:text-emerald-100 mt-1 tracking-tight relative z-10">
            {settings.currencySymbol}{Math.round(stats.monthlyPremiumTotal).toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100/50 dark:bg-amber-900/20 rounded-bl-full -mr-2 -mt-2"></div>
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm">
            <Calendar size={18} />
          </div>
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 relative z-10">Yearly Premium</p>
          <p className="text-2xl font-bold text-amber-950 dark:text-amber-100 mt-1 tracking-tight relative z-10">
            {settings.currencySymbol}{Math.round(stats.yearlyPremiumTotal).toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/40 dark:to-red-950/40 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100/50 dark:bg-rose-900/20 rounded-bl-full -mr-2 -mt-2"></div>
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 rounded-xl flex items-center justify-center mb-3 relative z-10 shadow-sm">
            <AlertCircle size={18} />
          </div>
          <p className="text-xs font-semibold text-rose-800 dark:text-rose-300 relative z-10">Expiring Soon</p>
          <p className="text-2xl font-bold text-rose-950 dark:text-rose-100 mt-1 tracking-tight relative z-10">
            {stats.expiringSoonCount}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search policy name or no..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          >
            <option value="all">All Types</option>
            <option value="Term Ins">Term Insurance</option>
            <option value="Life Ins">Life Insurance</option>
            <option value="Medical Ins">Medical Insurance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition shadow-sm w-full sm:w-auto shrink-0"
        >
          <Plus size={16} /> Add Policy
        </button>
      </div>

      {/* Grid List */}
      {filteredPolicies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-4xl mb-3">🛡️</div>
          <h4 className="text-sm font-bold text-slate-800">No insurance policies found</h4>
          <p className="text-xs text-slate-500 mt-1">Get started by uploading your first insurance details</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map(p => {
            const isExpired = p.expireDate < today;
            return (
              <div
                key={p.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:shadow-md min-w-0 ${
                  isExpired ? 'border-red-100 bg-red-50/10' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3 min-w-0">
                  <div className="flex justify-between items-start gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {getTypeIcon(p.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate" title={p.policyName}>
                          {p.policyName}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{p.type}</p>
                      </div>
                    </div>
                    {getExpiryBadge(p.expireDate)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div className="min-w-0">
                      <p className="text-slate-500 font-medium">Policy No</p>
                      <p className="text-slate-700 font-bold mt-0.5 truncate" title={p.policyNumber}>
                        {p.policyNumber}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 font-medium">Premium</p>
                      <p className="text-orange-600 font-bold mt-0.5 truncate">
                        {settings.currencySymbol}
                        {p.paymentAmount.toLocaleString()}
                        <span className="text-[9px] text-slate-500 font-normal"> / {p.paymentFrequency}</span>
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 font-medium">Start Date</p>
                      <p className="text-slate-700 font-semibold mt-0.5">
                        {new Date(p.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 font-medium">Expiry Date</p>
                      <p className="text-slate-700 font-semibold mt-0.5">
                        {new Date(p.expireDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 mt-4 pt-3">
                  {p.downloadUrl ? (
                    <button
                      type="button"
                      onClick={() => handleDownload(p)}
                      className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Download size={12} />
                      Download Policy
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium italic">No document attached</span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(p)}
                      className="w-8 h-8 inline-flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      className="w-8 h-8 inline-flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPolicy ? 'Edit Insurance Policy' : 'Add New Insurance Policy'}</h3>
              <button
                type="button"
                aria-label="Close"
                className="modal-close inline-flex items-center justify-center"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Policy Name *</label>
                    <input
                      type="text"
                      className="form-control-custom"
                      placeholder="e.g. ICICI Pru Term Life Plan"
                      required
                      value={formData.policyName}
                      onChange={e => setFormData({ ...formData, policyName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Insurance Type *</label>
                    <select
                      className="form-control-custom"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Term Ins">Term Insurance</option>
                      <option value="Life Ins">Life Insurance</option>
                      <option value="Medical Ins">Medical Insurance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Policy Number *</label>
                    <input
                      type="text"
                      className="form-control-custom"
                      placeholder="e.g. POL-1234567"
                      required
                      value={formData.policyNumber}
                      onChange={e => setFormData({ ...formData, policyNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input
                      type="date"
                      className="form-control-custom"
                      required
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expiry Date *</label>
                    <input
                      type="date"
                      className="form-control-custom"
                      required
                      value={formData.expireDate}
                      onChange={e => setFormData({ ...formData, expireDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Premium Amount ({settings.currencySymbol}) *</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-control-custom"
                      placeholder="Amount paid"
                      required
                      value={formData.paymentAmount}
                      onChange={e => setFormData({ ...formData, paymentAmount: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Payment Frequency *</label>
                    <select
                      className="form-control-custom"
                      value={formData.paymentFrequency}
                      onChange={e => setFormData({ ...formData, paymentFrequency: e.target.value })}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">Policy Link / URL</label>
                    <input
                      type="text"
                      className="form-control-custom"
                      placeholder="https://drive.google.com/file/..."
                      value={formData.downloadUrl && !formData.downloadUrl.startsWith('data:') ? formData.downloadUrl : ''}
                      onChange={e => setFormData({ ...formData, downloadUrl: e.target.value, fileName: '' })}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">Or Upload Policy File (Max 2MB)</label>
                    <div className="flex flex-wrap items-center gap-2 mt-1 min-w-0">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleFileChange}
                        className="max-w-full min-w-0 text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                      />
                      {formData.fileName && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-md max-w-full truncate">
                          📎 <span className="truncate">{formData.fileName}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel inline-flex items-center justify-center" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit red inline-flex items-center justify-center">
                  {editingPolicy ? 'Update Policy' : 'Add Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtInsurance;
