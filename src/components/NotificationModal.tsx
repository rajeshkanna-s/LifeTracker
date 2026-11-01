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
          overflow: 'hidden'
        }}
      >
        {/* Header — Clean Light-Mode Vibrant Violet-Indigo Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #6d28d9 0%, #7c3aed 55%, #6366f1 100%)',
            padding: '16px 18px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.16)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bell size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Alerts & Reminders
              </h3>
              <p style={{ fontSize: '0.73rem', color: 'rgba(255, 255, 255, 0.88)', margin: '2px 0 0 0' }}>
                EMIs, Insurance, Warranties & Budgets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.28)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Push Notification Opt-in Banner */}
        {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 sm:px-4.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold text-emerald-900">
                Enable Native Reminders
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-700">
                Get notified before bills, EMIs & warranties expire
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-0 py-1.5 px-3 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 transition"
            >
              Turn On
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2.5 bg-white">
          {notifications.length === 0 ? (
            <div className="text-center py-9 px-4 text-slate-600">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 inline-flex items-center justify-center mx-auto mb-3">
                <Check size={26} strokeWidth={2.5} />
              </div>
              <p className="font-extrabold text-sm text-slate-900 m-0">
                All Clear! No Pending Dues
              </p>
              <p className="text-xs text-slate-600 mt-1">
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
                  n.linkTab ? 'cursor-pointer hover:border-violet-300' : 'cursor-default'
                } ${
                  n.urgency === 'high'
                    ? 'border border-rose-200 bg-rose-50/70'
                    : 'border border-slate-200 bg-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl inline-flex items-center justify-center shrink-0 ${
                    n.urgency === 'high' ? 'bg-rose-100' : 'bg-slate-100'
                  }`}
                >
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="m-0 font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {n.title}
                    </h4>
                    {n.urgency === 'high' && (
                      <span className="inline-flex items-center justify-center text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 uppercase tracking-wide shrink-0 leading-none">
                        Action Due
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-snug">
                    {n.message}
                  </p>
                </div>

                {n.linkTab && (
                  <ChevronRight size={16} className="text-slate-500 mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:px-4.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-600">
            {notifications.length} active {notifications.length === 1 ? 'alert' : 'alerts'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold border-0 cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
