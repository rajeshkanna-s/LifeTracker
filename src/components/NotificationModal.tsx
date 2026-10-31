import React, { useState } from 'react';
import {
  Bell,
  X,
  CreditCard,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Repeat,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';
import {
  type AppNotification,
  requestNotificationPermission
} from '../utils/notificationService';
import type { TabId } from '../types';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onNavigateTab: (tab: TabId) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onNavigateTab
}) => {
  const [pushStatus, setPushStatus] = useState<string>(() => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const granted = await requestNotificationPermission();
    setPushStatus(granted ? 'granted' : 'denied');
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'emi':
        return <CreditCard size={18} className="text-rose-500" />;
      case 'insurance':
        return <Shield size={18} className="text-blue-500" />;
      case 'warranty':
        return <ShieldCheck size={18} className="text-amber-500" />;
      case 'budget':
        return <AlertTriangle size={18} className="text-red-500" />;
      case 'recurring':
        return <Repeat size={18} className="text-purple-500" />;
      default:
        return <Bell size={18} className="text-emerald-500" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            padding: '18px 20px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                Alerts & Reminders
              </h3>
              <p style={{ fontSize: '0.72rem', opacity: 0.8, margin: '2px 0 0 0' }}>
                EMIs, Insurance, Warranties & Budgets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Push Notification Opt-in Banner */}
        {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60 p-3 sm:px-4.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Enable Native Reminders
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                Get notified before bills, EMIs & warranties expire
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 py-1.5 px-3 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition"
            >
              Turn On
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="text-center py-9 px-4 text-slate-500 dark:text-slate-400">
              <div className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <Check size={26} strokeWidth={2.5} />
              </div>
              <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 m-0">
                All Clear! No Pending Dues
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                No warranties expiring within 30 days, EMIs are settled, and budget is on track.
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.linkTab) {
                    onNavigateTab(n.linkTab as TabId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl flex items-start gap-3 transition shadow-2xs ${
                  n.linkTab ? 'cursor-pointer hover:border-violet-300 dark:hover:border-violet-600' : 'cursor-default'
                } ${
                  n.urgency === 'high'
                    ? 'border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30'
                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.urgency === 'high' ? 'bg-rose-100 dark:bg-rose-950/60' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="m-0 font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {n.title}
                    </h4>
                    {n.urgency === 'high' && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 uppercase tracking-wide shrink-0">
                        Action Due
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {n.message}
                  </p>
                </div>

                {n.linkTab && (
                  <ChevronRight size={16} className="text-slate-400 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-4.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {notifications.length} active {notifications.length === 1 ? 'alert' : 'alerts'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold border-0 cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

