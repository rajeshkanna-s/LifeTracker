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
          <div
            style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              borderBottom: '1px solid #bbf7d0',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
                Enable Native Reminders
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#15803d' }}>
                Get notified before bills, EMIs & warranties expire
              </p>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              style={{
                borderRadius: '12px',
                background: '#15803d',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Turn On
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }} className="space-y-2.5">
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto',
                  color: '#10b981'
                }}
              >
                <Check size={26} strokeWidth={2.5} />
              </div>
              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b', margin: 0 }}>
                All Clear! No Pending Dues
              </p>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
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
                style={{
                  padding: '12px 14px',
                  borderRadius: '16px',
                  border: n.urgency === 'high' ? '1.5px solid #fecaca' : '1px solid #e2e8f0',
                  background: n.urgency === 'high' ? '#fff5f5' : '#ffffff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  cursor: n.linkTab ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    background: n.urgency === 'high' ? '#fee2e2' : '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getIcon(n.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>
                      {n.title}
                    </h4>
                    {n.urgency === 'high' && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          letterSpacing: '0.02em',
                          textTransform: 'uppercase'
                        }}
                      >
                        Action Due
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.35 }}>
                    {n.message}
                  </p>
                </div>

                {n.linkTab && (
                  <ChevronRight size={16} style={{ color: '#94a3b8', marginTop: '10px', flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 18px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {notifications.length} active {notifications.length === 1 ? 'alert' : 'alerts'}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '0.76rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;

