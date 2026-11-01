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

  const normalizeReminder = (r: any): ReminderItem => ({
    id: r.id,
    partner_id: r.partner_id,
    title: r.title,
    description: r.description || undefined,
    reminder_date: r.reminder_date,
    reminder_time: r.reminder_time ? r.reminder_time.slice(0, 5) : '08:00',
    repeat_type: (r.repeat_type as RepeatType) || 'none',
    is_completed: Boolean(r.is_completed),
    notification_sent: Boolean(r.notification_sent),
    created_at: r.created_at || new Date().toISOString(),
    updated_at: r.updated_at
  });

  // Listen for global reminder updates (e.g. from app-level background ticker)
  useEffect(() => {
    const handleGlobalUpdate = () => {
      const storageKey = `${STORAGE_KEY_PREFIX}${activePartnerId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setReminders(parsed.map(normalizeReminder).filter(r => r && r.partner_id === activePartnerId));
          }
        } catch {}
      }
    };
    window.addEventListener('xpenser-reminders-updated', handleGlobalUpdate);
    return () => window.removeEventListener('xpenser-reminders-updated', handleGlobalUpdate);
  }, [activePartnerId]);

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
        const rTime = (item.reminder_time || '').slice(0, 5);
        // Trigger if due right now or overdue on today/past date without notification having fired yet
        const isDue = (
          !item.is_completed &&
          !item.notification_sent &&
          (item.reminder_date < todayStr || (item.reminder_date === todayStr && rTime <= currentTimeStr))
        );

        if (isDue) {
          hasTriggered = true;
          playReminderChime();
          sendBrowserNotification(
            `⏰ Remainder: ${item.title}`,
            item.description || `Scheduled for ${rTime}`
          );

          // Update in Supabase reminders table
          supabase
            .from('reminders')
            .update({
              notification_sent: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .eq('partner_id', activePartnerId)
            .then();

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

    const timer = setInterval(checkSchedule, 8000);
    checkSchedule();
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

    // 1. Try local cache first for instant 0ms render
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed.map(normalizeReminder).filter((r: ReminderItem) => r && r.partner_id === activePartnerId);
          setReminders(loaded);
        }
      }
    } catch {
      // ignore
    }

    // 2. Query Supabase dedicated table 'reminders'
    try {
      const { data: tableData, error: tableErr } = await supabase
        .from('reminders')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('reminder_date', { ascending: true })
        .order('reminder_time', { ascending: true });

      if (!tableErr && tableData) {
        if (tableData.length > 0) {
          const normalized = tableData.map(normalizeReminder).filter(r => r.partner_id === activePartnerId);
          setReminders(normalized);
          localStorage.setItem(storageKey, JSON.stringify(normalized));
          setLoading(false);
          return;
        } else {
          // Check if expense_settings has items to migrate to reminders table
          const { data: setRow } = await supabase
            .from('expense_settings')
            .select('settings_json')
            .eq('partner_id', activePartnerId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (setRow?.settings_json?.reminders && Array.isArray(setRow.settings_json.reminders) && setRow.settings_json.reminders.length > 0) {
            const cloudReminders = setRow.settings_json.reminders
              .map(normalizeReminder)
              .filter((r: ReminderItem) => r.partner_id === activePartnerId);

            if (cloudReminders.length > 0) {
              for (const item of cloudReminders) {
                await supabase.from('reminders').insert({
                  partner_id: activePartnerId,
                  title: item.title,
                  description: item.description || null,
                  reminder_date: item.reminder_date,
                  reminder_time: item.reminder_time.length === 5 ? item.reminder_time + ':00' : item.reminder_time,
                  repeat_type: item.repeat_type || 'none',
                  is_completed: item.is_completed || false,
                  notification_sent: item.notification_sent || false,
                  created_at: item.created_at || new Date().toISOString()
                });
              }

              const { data: refetched } = await supabase
                .from('reminders')
                .select('*')
                .eq('partner_id', activePartnerId)
                .order('reminder_date', { ascending: true });

              if (refetched && refetched.length > 0) {
                const finalItems = refetched.map(normalizeReminder);
                setReminders(finalItems);
                localStorage.setItem(storageKey, JSON.stringify(finalItems));
                setLoading(false);
                return;
              }
            }
          }

          // Truly empty
          setReminders([]);
          localStorage.setItem(storageKey, JSON.stringify([]));
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Dedicated reminders table query error, falling back to expense_settings', e);
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
        const filteredCloud = setRow.settings_json.reminders
          .map(normalizeReminder)
          .filter((r: ReminderItem) => r && r.partner_id === activePartnerId);
        setReminders(filteredCloud);
        localStorage.setItem(storageKey, JSON.stringify(filteredCloud));
      } else {
        setReminders([]);
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
    } catch (e) {
      console.warn('Fallback reminders loaded from local', e);
    } finally {
      setLoading(false);
    }
  };

  const syncToExpenseSettings = async (list: ReminderItem[]) => {
    try {
      const { data: row } = await supabase
        .from('expense_settings')
        .select('*')
        .eq('partner_id', activePartnerId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (row) {
        const newSettings = { ...(row.settings_json || {}), reminders: list };
        await supabase
          .from('expense_settings')
          .update({ settings_json: newSettings, updated_at: new Date().toISOString() })
          .eq('id', row.id);
      } else {
        await supabase.from('expense_settings').insert({
          partner_id: activePartnerId,
          settings_json: { reminders: list },
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Failed to mirror reminders to expense_settings', e);
    }
  };

  const saveReminders = async (updated: ReminderItem[]) => {
    const sanitized = updated.map(r => ({ ...r, partner_id: activePartnerId }));
    setReminders(sanitized);
    const storageKey = `${STORAGE_KEY_PREFIX}${activePartnerId}`;
    localStorage.setItem(storageKey, JSON.stringify(sanitized));
    syncToExpenseSettings(sanitized);
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

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingReminder) {
      const updatedItem: ReminderItem = {
        ...editingReminder,
        title: cleanTitle,
        description: description.trim() || undefined,
        reminder_date: dateVal,
        reminder_time: timeVal,
        repeat_type: repeatVal,
        notification_sent: false,
        updated_at: new Date().toISOString(),
        partner_id: activePartnerId
      };

      const updatedList = reminders.map(r => r.id === editingReminder.id ? updatedItem : r);
      setReminders(updatedList);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${activePartnerId}`, JSON.stringify(updatedList));
      setShowModal(false);

      // Direct write to Supabase dedicated 'reminders' table
      try {
        await supabase
          .from('reminders')
          .update({
            title: cleanTitle,
            description: description.trim() || null,
            reminder_date: dateVal,
            reminder_time: timeVal.length === 5 ? timeVal + ':00' : timeVal,
            repeat_type: repeatVal,
            notification_sent: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReminder.id)
          .eq('partner_id', activePartnerId);
      } catch (err) {
        console.warn('Error updating in reminders table', err);
      }

      syncToExpenseSettings(updatedList);
    } else {
      const newUuid = crypto.randomUUID();
      const newItem: ReminderItem = {
        id: newUuid,
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

      const updatedList = [newItem, ...reminders];
      setReminders(updatedList);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${activePartnerId}`, JSON.stringify(updatedList));
      setShowModal(false);

      // Direct write to Supabase dedicated 'reminders' table
      try {
        await supabase
          .from('reminders')
          .insert({
            id: newUuid,
            partner_id: activePartnerId,
            title: cleanTitle,
            description: description.trim() || null,
            reminder_date: dateVal,
            reminder_time: timeVal.length === 5 ? timeVal + ':00' : timeVal,
            repeat_type: repeatVal,
            is_completed: false,
            notification_sent: false,
            created_at: new Date().toISOString()
          });
      } catch (err) {
        console.warn('Error inserting into reminders table', err);
      }

      syncToExpenseSettings(updatedList);
    }
  };

  const handleDelete = async (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activePartnerId}`, JSON.stringify(updated));
    if (showModal) setShowModal(false);

    try {
      await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('partner_id', activePartnerId);
    } catch (err) {
      console.warn('Error deleting reminder from table', err);
    }
    syncToExpenseSettings(updated);
  };

  const handleToggleComplete = async (id: string) => {
    const target = reminders.find(r => r.id === id);
    if (!target) return;
    const nextStatus = !target.is_completed;

    const updated = reminders.map(r =>
      r.id === id ? { ...r, is_completed: nextStatus } : r
    );
    setReminders(updated);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${activePartnerId}`, JSON.stringify(updated));

    try {
      await supabase
        .from('reminders')
        .update({
          is_completed: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('partner_id', activePartnerId);
    } catch (err) {
      console.warn('Error updating status in table', err);
    }
    syncToExpenseSettings(updated);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationPerm('granted');
      playReminderChime();
      await sendBrowserNotification('Notifications Enabled! 🎉', 'You will receive reminders right in your mobile top bar.');
    } else {
      setNotificationPerm('denied');
    }
  };

  const handleTestAlert = async () => {
    playReminderChime();
    const sent = await sendBrowserNotification(
      '⏰ Remainder: Test Alert',
      'Mobile top bar & sound alert are working perfectly!'
    );
    if (!sent && notificationPerm !== 'granted') {
      await handleRequestPermission();
    }
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

  const partnerReminders = reminders.filter(r => !r.partner_id || r.partner_id === activePartnerId);

  const filteredReminders = partnerReminders.filter(r => {
    if (filter === 'completed') return r.is_completed;
    if (r.is_completed) return false;
    if (filter === 'today') return r.reminder_date === todayStr;
    if (filter === 'upcoming') return r.reminder_date > todayStr;
    return true; // 'all' active
  });

  const todayCount = partnerReminders.filter(r => !r.is_completed && r.reminder_date === todayStr).length;
  const upcomingCount = partnerReminders.filter(r => !r.is_completed && r.reminder_date > todayStr).length;
  const completedCount = partnerReminders.filter(r => r.is_completed).length;

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
      </div>

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
          (Centered Dialog with Scroll & In-Flow Repeat Accordion)
          ══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-5 sm:p-6 text-slate-900 animate-slideUp"
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

              {/* 3. Repeat Dropdown (Inline Expandable so never cut off on any screen!) */}
              <div className="border-b border-slate-200 pb-3" ref={repeatMenuRef}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Repeat
                </label>
                <button
                  type="button"
                  onClick={() => setRepeatDropdownOpen(!repeatDropdownOpen)}
                  className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-800 cursor-pointer py-2 px-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
                >
                  <span className="font-medium text-slate-800">{repeatLabels[repeatVal]}</span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      repeatDropdownOpen ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Options Popup (In-flow accordion - 100% visible on all mobile screens!) */}
                {repeatDropdownOpen && (
                  <div className="mt-2 bg-slate-50/90 border border-slate-200 rounded-2xl p-1.5 space-y-1 shadow-inner animate-fadeIn">
                    {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as RepeatType[]).map(opt => {
                      const isSelected = repeatVal === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setRepeatVal(opt);
                            setRepeatDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-white font-extrabold shadow-xs'
                              : 'text-slate-700 hover:bg-slate-200/60'
                          }`}
                        >
                          <span>{repeatLabels[opt]}</span>
                          {isSelected && <Check size={14} strokeWidth={2.5} className="text-white" />}
                        </button>
                      );
                    })}
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

