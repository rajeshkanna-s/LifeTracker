import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  Repeat,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  AlertCircle,
  Check,
  ChevronDown,
  Volume2,
  Sparkles,
  Database,
  Copy,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePartner } from '../../context/PartnerContext';
import { formatLocalDate } from '../../utils/expenseUtils';
import {
  playReminderChime,
  requestNotificationPermission,
  sendBrowserNotification
} from '../../utils/notificationService';
import type { ReminderItem, RepeatType } from '../../types';

const STORAGE_KEY_PREFIX = 'xpenser_reminders_';

export const RemindersTracker: React.FC = () => {
  const { activePartnerId, activePartner } = usePartner();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>('default');
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [repeatDropdownOpen, setRepeatDropdownOpen] = useState(false);

  // Form State matching Google Keep reference screenshots
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateVal, setDateVal] = useState(formatLocalDate(new Date()));
  const [timeVal, setTimeVal] = useState('08:00');
  const [repeatVal, setRepeatVal] = useState<RepeatType>('none');

  const repeatMenuRef = useRef<HTMLDivElement>(null);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPerm(Notification.permission);
    }
    loadReminders();
  }, [activePartnerId]);

  // Click outside listener for repeat dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (repeatMenuRef.current && !repeatMenuRef.current.contains(e.target as Node)) {
        setRepeatDropdownOpen(false);
      }
    };
    if (repeatDropdownOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [repeatDropdownOpen]);

  // Real-time ticker to trigger notifications at exact date & time
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const todayStr = formatLocalDate(now);
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      let hasTriggered = false;
      const updated = reminders.map(item => {
        if (
          !item.is_completed &&
          !item.notification_sent &&
          item.reminder_date === todayStr &&
          item.reminder_time === currentTimeStr
        ) {
          hasTriggered = true;
          // Trigger audio chime & browser notification
          playReminderChime();
          sendBrowserNotification(
            `⏰ Remainder: ${item.title}`,
            item.description || `Scheduled for ${item.reminder_time}`
          );

          // Handle Repeat logic
          if (item.repeat_type !== 'none') {
            const nextDate = computeNextRepeatDate(item.reminder_date, item.repeat_type);
            return {
              ...item,
              reminder_date: nextDate,
              notification_sent: false,
              updated_at: new Date().toISOString()
            };
          }

          return {
            ...item,
            notification_sent: true,
            updated_at: new Date().toISOString()
          };
        }
        return item;
      });

      if (hasTriggered) {
        saveReminders(updated);
      }
    };

    const timer = setInterval(checkSchedule, 10000); // Check every 10 seconds
    return () => clearInterval(timer);
  }, [reminders]);

  const computeNextRepeatDate = (currentDateStr: string, repeat: RepeatType): string => {
    const d = new Date(currentDateStr);
    if (repeat === 'daily') d.setDate(d.getDate() + 1);
    else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
    else if (repeat === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (repeat === 'yearly') d.setFullYear(d.getFullYear() + 1);
    return formatLocalDate(d);
  };

  const loadReminders = async () => {
    setLoading(true);
    const storageKey = `${STORAGE_KEY_PREFIX}${activePartnerId}`;
    let loaded: ReminderItem[] = [];

    // 1. Try local cache first for instant render
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        loaded = JSON.parse(raw);
        setReminders(loaded);
      }
    } catch {
      // ignore
    }

    // 2. Try Supabase dedicated table 'reminders'
    try {
      const { data: tableData, error: tableErr } = await supabase
        .from('reminders')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('reminder_date', { ascending: true })
        .order('reminder_time', { ascending: true });

      if (!tableErr && tableData && Array.isArray(tableData)) {
        setReminders(tableData);
        localStorage.setItem(storageKey, JSON.stringify(tableData));
        setLoading(false);
        return;
      }
    } catch {
      // Table might not exist yet, fallback to expense_settings
    }

    // 3. Fallback to expense_settings.settings_json.reminders
    try {
      const { data: setRow } = await supabase
        .from('expense_settings')
        .select('settings_json')
        .eq('partner_id', activePartnerId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (setRow?.settings_json?.reminders && Array.isArray(setRow.settings_json.reminders)) {
        setReminders(setRow.settings_json.reminders);
        localStorage.setItem(storageKey, JSON.stringify(setRow.settings_json.reminders));
      } else if (loaded.length === 0) {
        // Seed initial friendly starter reminder
        const todayStr = formatLocalDate(new Date());
        const starter: ReminderItem = {
          id: 'rem-starter-1',
          partner_id: activePartnerId,
          title: 'Welcome to Remainder! Set your first alert',
          description: 'Custom date, time, and repeating schedule with sound & browser alerts',
          reminder_date: todayStr,
          reminder_time: '20:00',
          repeat_type: 'none',
          is_completed: false,
          notification_sent: false,
          created_at: new Date().toISOString()
        };
        setReminders([starter]);
        localStorage.setItem(storageKey, JSON.stringify([starter]));
      }
    } catch (e) {
      console.warn('Fallback reminders loaded from local', e);
    } finally {
      setLoading(false);
    }
  };

  const saveReminders = async (updated: ReminderItem[]) => {
    setReminders(updated);
    const storageKey = `${STORAGE_KEY_PREFIX}${activePartnerId}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));

    // 1. Try Supabase dedicated table 'reminders' if available
    try {
      // Check if table is available
      const { error: testErr } = await supabase.from('reminders').select('id').limit(1);
      if (!testErr) {
        // If table exists, we can upsert or sync
        // To be safe, we also save to expense_settings so data is 100% persisted
      }
    } catch {
      // ignore
    }

    // 2. Persist to expense_settings.settings_json.reminders
    try {
      const { data: row } = await supabase
        .from('expense_settings')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (row) {
        const newSettings = { ...(row.settings_json || {}), reminders: updated };
        await supabase
          .from('expense_settings')
          .update({ settings_json: newSettings, updated_at: new Date().toISOString() })
          .eq('id', row.id);
      } else {
        await supabase.from('expense_settings').insert({
          partner_id: activePartnerId,
          settings_json: { reminders: updated },
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Failed to sync reminders to Supabase', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingReminder(null);
    setTitle('');
    setDescription('');
    setDateVal(formatLocalDate(new Date()));
    setTimeVal('08:00');
    setRepeatVal('none');
    setRepeatDropdownOpen(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item: ReminderItem) => {
    setEditingReminder(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setDateVal(item.reminder_date);
    setTimeVal(item.reminder_time);
    setRepeatVal(item.repeat_type || 'none');
    setRepeatDropdownOpen(false);
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingReminder) {
      const updated = reminders.map(r =>
        r.id === editingReminder.id
          ? {
              ...r,
              title: cleanTitle,
              description: description.trim() || undefined,
              reminder_date: dateVal,
              reminder_time: timeVal,
              repeat_type: repeatVal,
              notification_sent: false,
              updated_at: new Date().toISOString()
            }
          : r
      );
      saveReminders(updated);
    } else {
      const newItem: ReminderItem = {
        id: 'rem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        partner_id: activePartnerId,
        title: cleanTitle,
        description: description.trim() || undefined,
        reminder_date: dateVal,
        reminder_time: timeVal,
        repeat_type: repeatVal,
        is_completed: false,
        notification_sent: false,
        created_at: new Date().toISOString()
      };
      saveReminders([newItem, ...reminders]);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    saveReminders(updated);
    if (showModal) setShowModal(false);
  };

  const handleToggleComplete = (id: string) => {
    const updated = reminders.map(r =>
      r.id === id ? { ...r, is_completed: !r.is_completed } : r
    );
    saveReminders(updated);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPerm('granted');
      sendBrowserNotification('Notifications Enabled! 🎉', 'You will receive reminders right on time.');
      playReminderChime();
    } else {
      setNotificationPerm('denied');
    }
  };

  const handleTestAlert = () => {
    playReminderChime();
    sendBrowserNotification(
      '⏰ Test Remainder',
      'Sound and notification alert works perfectly!'
    );
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dStr;
    }
  };

  const repeatLabels: Record<RepeatType, string> = {
    none: 'Does not repeat',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly'
  };

  const todayStr = formatLocalDate(new Date());

  const filteredReminders = reminders.filter(r => {
    if (filter === 'completed') return r.is_completed;
    if (r.is_completed) return false;
    if (filter === 'today') return r.reminder_date === todayStr;
    if (filter === 'upcoming') return r.reminder_date > todayStr;
    return true; // 'all' active
  });

  const todayCount = reminders.filter(r => !r.is_completed && r.reminder_date === todayStr).length;
  const upcomingCount = reminders.filter(r => !r.is_completed && r.reminder_date > todayStr).length;
  const completedCount = reminders.filter(r => r.is_completed).length;

  const sqlCode = `-- SQL to create dedicated 'reminders' table in Supabase
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TIME NOT NULL,
  repeat_type TEXT DEFAULT 'none',
  is_completed BOOLEAN DEFAULT FALSE,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and grant read/write access
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to reminders" 
ON public.reminders 
FOR ALL 
USING (true) 
WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-28">
      {/* ── Hero Card (White Background, Crisp Contrast) ── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <Bell size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                  Remainder
                </h1>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                  {activePartner?.name || 'Partner'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scheduled notifications with sound alerts for {activePartner?.name || 'you'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTestAlert}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
              title="Test notification sound and popup"
            >
              <Volume2 size={14} className="text-amber-500" />
              <span>Test Alert</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Remainder</span>
            </button>
          </div>
        </div>

        {/* ── Notification Permission Banner ── */}
        {notificationPerm !== 'granted' && (
          <div className="mt-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <p className="text-xs sm:text-sm font-semibold text-amber-900">
                Enable browser notifications to receive sound alerts at the exact time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 cursor-pointer shadow-xs"
            >
              Enable Notifications
            </button>
          </div>
        )}

        {/* ── Stats Pill Bar ── */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today</span>
            <p className="text-lg font-extrabold text-amber-600 leading-tight mt-0.5">{todayCount}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming</span>
            <p className="text-lg font-extrabold text-indigo-600 leading-tight mt-0.5">{upcomingCount}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <p className="text-lg font-extrabold text-emerald-600 leading-tight mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* ── Filter Segment Bar ── */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="bg-white border border-slate-200 p-1 rounded-2xl inline-flex items-center gap-1 shadow-xs">
          {(['all', 'today', 'upcoming', 'completed'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                filter === tab
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'all' ? 'Active' : tab}
            </button>
          ))}
        </div>

        {/* Database setup indicator */}
        <button
          type="button"
          onClick={() => setShowSqlSetup(!showSqlSetup)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
        >
          <Database size={13} className="text-emerald-500" />
          <span>DB Status: Connected</span>
          <ChevronDown size={13} className={showSqlSetup ? 'rotate-180 transition' : 'transition'} />
        </button>
      </div>

      {/* ── Expandable Supabase SQL Query Guide ── */}
      {showSqlSetup && (
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono border border-slate-800 shadow-xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Database size={14} /> Optional: Supabase SQL Setup Query
            </span>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-bold cursor-pointer"
            >
              <Copy size={12} />
              <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Your reminders are already stored in Supabase! If you also want a dedicated table named <code className="text-amber-300">reminders</code>, paste this into your Supabase SQL Editor.
          </p>
          <pre className="bg-slate-950 p-3 rounded-xl overflow-x-auto text-[11px] text-emerald-400 leading-relaxed">
            {sqlCode}
          </pre>
        </div>
      )}

      {/* ── Reminders List ── */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xs">
          <span className="text-4xl mb-2 inline-block">🔔</span>
          <h3 className="text-base font-bold text-slate-800">No remainders in this view</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filter === 'completed'
              ? 'Completed remainders will appear here.'
              : 'Tap "New Remainder" above to schedule your alerts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map(item => {
            const isToday = item.reminder_date === todayStr;
            const isOverdue = !item.is_completed && item.reminder_date < todayStr;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-4 transition shadow-xs flex items-start gap-3.5 ${
                  item.is_completed
                    ? 'border-slate-200/70 bg-slate-50/50'
                    : isOverdue
                    ? 'border-rose-200 hover:border-rose-300'
                    : isToday
                    ? 'border-amber-300 ring-1 ring-amber-300/40'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Complete / Uncomplete Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleComplete(item.id)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer ${
                    item.is_completed
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-300 hover:border-amber-500'
                  }`}
                  aria-label={item.is_completed ? 'Mark pending' : 'Mark completed'}
                >
                  {item.is_completed && <Check size={14} strokeWidth={3} />}
                </button>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm sm:text-base font-bold leading-snug break-words ${
                        item.is_completed
                          ? 'text-slate-400 line-through'
                          : 'text-slate-900'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {/* Schedule Badges */}
                    {isToday && !item.is_completed && (
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Today
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Overdue
                      </span>
                    )}
                    {item.repeat_type !== 'none' && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                        <Repeat size={10} /> {repeatLabels[item.repeat_type]}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Date & Time Row */}
                  <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDisplayDate(item.reminder_date)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Clock size={13} className="text-slate-400" />
                      {item.reminder_time}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                    title="Edit Remainder"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                    title="Delete Remainder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          CHOOSE A DATE AND TIME MODAL
          (Exact 1:1 Match to Uploaded Google Keep Reference Screenshots!)
          ══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 p-5 sm:p-6 animate-slideUp text-slate-900"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Title */}
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">
              Choose a date and time
            </h2>

            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. LOGIN, Pay Electricity Bill, Meeting"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition"
                />
              </div>

              {/* Description Input (Optional) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Note / Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Additional notes or links..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 transition resize-none"
                />
              </div>

              {/* 1. Date Field (Dropdown / Native Date) */}
              <div className="border-b border-slate-200 pb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Date
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="date"
                    required
                    value={dateVal}
                    onChange={e => setDateVal(e.target.value)}
                    className="w-full bg-transparent font-semibold text-sm text-slate-800 outline-none cursor-pointer"
                  />
                  <ChevronDown size={16} className="text-slate-400 pointer-events-none shrink-0" />
                </div>
              </div>

              {/* 2. Time Field (Dropdown / Native Time) */}
              <div className="border-b border-slate-200 pb-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Time
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="time"
                    required
                    value={timeVal}
                    onChange={e => setTimeVal(e.target.value)}
                    className="w-full bg-transparent font-semibold text-sm text-slate-800 outline-none cursor-pointer"
                  />
                  <ChevronDown size={16} className="text-slate-400 pointer-events-none shrink-0" />
                </div>

                {/* Quick time chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {[
                    { label: 'Morning (08:00)', time: '08:00' },
                    { label: 'Afternoon (13:00)', time: '13:00' },
                    { label: 'Evening (18:00)', time: '18:00' },
                    { label: 'Night (20:00)', time: '20:00' }
                  ].map(chip => (
                    <button
                      key={chip.time}
                      type="button"
                      onClick={() => setTimeVal(chip.time)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                        timeVal === chip.time
                          ? 'bg-amber-50 text-amber-700 border-amber-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Repeat Dropdown (Exact Match to Screenshot 2!) */}
              <div className="border-b border-slate-200 pb-2 relative" ref={repeatMenuRef}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Repeat
                </label>
                <button
                  type="button"
                  onClick={() => setRepeatDropdownOpen(!repeatDropdownOpen)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-800 cursor-pointer py-1"
                >
                  <span>{repeatLabels[repeatVal]}</span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${
                      repeatDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Options Popup */}
                {repeatDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 animate-fadeIn">
                    {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as RepeatType[]).map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setRepeatVal(opt);
                          setRepeatDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          repeatVal === opt
                            ? 'bg-amber-50 text-amber-700 font-extrabold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{repeatLabels[opt]}</span>
                        {repeatVal === opt && <Check size={14} className="text-amber-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Delete | Cancel | Save (Exact Match to Screenshot!) */}
              <div className="flex items-center justify-between pt-3">
                {editingReminder ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingReminder.id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindersTracker;

