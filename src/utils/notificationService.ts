import { supabase } from '../lib/supabase';
import { formatLocalDate } from './expenseUtils';
import type { Debt, DebtSettings, ExpenseSettings, WarrantyItem } from '../types';

export interface AppNotification {
  id: string;
  type: 'emi' | 'insurance' | 'warranty' | 'budget' | 'recurring' | 'remainder';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  dateStr?: string;
  linkTab?: string;
}

export const playReminderChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Pleasant tone 1 (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Pleasant tone 2 (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.14);
    gain2.gain.setValueAtTime(0.22, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.65);
  } catch {
    // AudioContext may be restricted until user interaction
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
};

export const computeNextRepeatDate = (currentDateStr: string, repeat: string): string => {
  const d = new Date(currentDateStr);
  if (repeat === 'daily') d.setDate(d.getDate() + 1);
  else if (repeat === 'weekly') d.setDate(d.getDate() + 7);
  else if (repeat === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (repeat === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return formatLocalDate(d);
};

export const sendBrowserNotification = async (
  title: string,
  body: string,
  iconPath = '/pwa-192x192.png'
): Promise<boolean> => {
  try {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported in this browser window.');
      return false;
    }

    // Ensure permission is granted
    let perm = Notification.permission;
    if (perm !== 'granted') {
      try {
        perm = await Notification.requestPermission();
      } catch {
        // user gesture might be required
      }
    }
    if (perm !== 'granted') {
      console.warn('Notification permission was not granted:', perm);
      return false;
    }

    const iconUrl = new URL(iconPath, window.location.origin).href;
    const tag = `xpenser-rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Mobile Android / PWA standard: MUST use ServiceWorkerRegistration.showNotification()
    // In mobile Android Chrome, `new Notification()` throws an Illegal Constructor error.
    if ('serviceWorker' in navigator) {
      try {
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<any>(resolve => setTimeout(resolve, 1500))
          ]);
        }

        if (registration && typeof registration.showNotification === 'function') {
          // Attempt 1: Rich options with vibration
          try {
            await registration.showNotification(title, {
              body,
              icon: iconUrl,
              badge: iconUrl,
              vibrate: [250, 100, 250, 100, 250],
              tag,
              renotify: true,
              data: { url: window.location.href }
            } as NotificationOptions);
            return true;
          } catch (richErr) {
            console.warn('Rich showNotification options rejected (e.g. background vibrate policy), trying minimal:', richErr);
            // Attempt 2: Minimal options without vibrate (always allowed on Android without user gesture)
            await registration.showNotification(title, {
              body,
              icon: iconUrl,
              badge: iconUrl,
              tag,
              renotify: true
            } as NotificationOptions);
            return true;
          }
        }
      } catch (swErr) {
        console.warn('ServiceWorker showNotification failed, trying window.Notification fallback:', swErr);
      }
    }

    // 2. Desktop Browser fallback (only runs on desktop where Notification constructor is permitted)
    try {
      new Notification(title, {
        body,
        icon: iconUrl,
        badge: iconUrl,
        tag
      } as NotificationOptions);
      return true;
    } catch (desktopErr) {
      console.warn('Desktop Notification constructor error:', desktopErr);
    }

    return false;
  } catch (err) {
    console.warn('sendBrowserNotification caught exception:', err);
    return false;
  }
};

let isTriggeringReminders = false;

/**
 * Universal Reminder Trigger Engine
 * Evaluates all scheduled reminders for the active partner and immediately triggers
 * mobile top-bar notifications + audio chime for any due items.
 */
export const triggerDueReminders = async (partnerId: string): Promise<number> => {
  if (!partnerId || isTriggeringReminders) return 0;
  isTriggeringReminders = true;
  let triggeredCount = 0;

  try {
    const storageKey = `xpenser_reminders_${partnerId}`;
    let reminders: any[] = [];

    // 1. Try local cache
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) reminders = parsed;
      }
    } catch {}

    // 2. Fallback to Supabase dedicated table if cache empty
    if (reminders.length === 0) {
      try {
        const { data: dbItems } = await supabase
          .from('reminders')
          .select('*')
          .eq('partner_id', partnerId)
          .order('reminder_date', { ascending: true });
        if (dbItems && dbItems.length > 0) {
          reminders = dbItems;
          localStorage.setItem(storageKey, JSON.stringify(dbItems));
        }
      } catch {}
    }

    if (!reminders || reminders.length === 0) return 0;

    const now = new Date();
    const todayStr = formatLocalDate(now);
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    let changed = false;
    const updatedList = [...reminders];

    for (let i = 0; i < updatedList.length; i++) {
      const item = updatedList[i];
      if (!item || item.partner_id !== partnerId || item.is_completed || item.notification_sent) {
        continue;
      }

      const rTime = (item.reminder_time || '').slice(0, 5);
      const isDue = (item.reminder_date < todayStr) || (item.reminder_date === todayStr && rTime <= currentTimeStr);

      if (isDue) {
        triggeredCount++;
        changed = true;

        playReminderChime();
        await sendBrowserNotification(
          `⏰ Remainder: ${item.title}`,
          item.description || `Scheduled for ${rTime || 'today'}`
        );

        const repeat = item.repeat_type || 'none';
        let nextDate = item.reminder_date;
        let markSent = true;

        if (repeat !== 'none') {
          nextDate = computeNextRepeatDate(item.reminder_date, repeat);
          markSent = false;
        }

        const updatedItem = {
          ...item,
          reminder_date: nextDate,
          notification_sent: markSent,
          updated_at: new Date().toISOString()
        };
        updatedList[i] = updatedItem;

        // Persist update directly to Supabase reminders table
        try {
          await supabase
            .from('reminders')
            .update({
              reminder_date: nextDate,
              notification_sent: markSent,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id)
            .eq('partner_id', partnerId);
        } catch (dbErr) {
          console.warn('Failed to update reminder status in Supabase:', dbErr);
        }
      }
    }

    if (changed) {
      localStorage.setItem(storageKey, JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('xpenser-reminders-updated'));
    }
  } catch (err) {
    console.warn('triggerDueReminders error:', err);
  } finally {
    isTriggeringReminders = false;
  }

  return triggeredCount;
};

export const fetchRemindersAndNotifications = async (partnerId: string): Promise<AppNotification[]> => {
  const notifications: AppNotification[] = [];
  const today = new Date();
  const todayStr = formatLocalDate(today);

  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  const thirtyDaysStr = formatLocalDate(thirtyDaysLater);

  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  const currentDayNum = today.getDate();

  try {
    // 1. Check Debts & EMIs due within 7 days
    const { data: debts } = await supabase
      .from('debts')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('status', 'active');

    if (debts && debts.length > 0) {
      for (const d of debts as Debt[]) {
        if (!d.emi_amount || d.emi_amount <= 0) continue;
        const dueDay = (d as any).due_day || 5;
        // Calculate days until due day this month
        let diff = dueDay - currentDayNum;
        if (diff < 0) {
          // next month due
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          diff = daysInMonth - currentDayNum + dueDay;
        }

        if (diff >= 0 && diff <= 7) {
          notifications.push({
            id: `emi-${d.id}`,
            type: 'emi',
            title: `EMI Due in ${diff === 0 ? 'Today' : `${diff} days`}`,
            message: `${d.source}: ₹${Number(d.emi_amount).toLocaleString()} due on day ${dueDay}`,
            urgency: diff <= 2 ? 'high' : 'medium',
            linkTab: 'debt'
          });
        }
      }
    }

    // 2. Check Insurance policies expiring within 30 days
    const { data: debtSet } = await supabase
      .from('debt_settings')
      .select('*')
      .eq('partner_id', partnerId)
      .order('id', { ascending: true })
      .limit(1)
      .single();

    if (debtSet?.settings_json?.insurances) {
      const insurances = debtSet.settings_json.insurances;
      for (const ins of insurances) {
        if (!ins.expireDate) continue;
        if (ins.expireDate >= todayStr && ins.expireDate <= thirtyDaysStr) {
          const expDate = new Date(ins.expireDate);
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          notifications.push({
            id: `ins-${ins.id}`,
            type: 'insurance',
            title: `Insurance Renewal in ${diffDays} days`,
            message: `${ins.policyName} (${ins.provider}) expires on ${ins.expireDate}. Premium: ₹${Number(ins.premiumAmount).toLocaleString()}`,
            urgency: diffDays <= 7 ? 'high' : 'medium',
            linkTab: 'debt'
          });
        }
      }
    }

    // 3. Check Warranties expiring within 30 days (Before 1 month only!)
    const { data: expSet } = await supabase
      .from('expense_settings')
      .select('*')
      .eq('partner_id', partnerId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const settingsJson = expSet?.settings_json;
    if (settingsJson?.customWarranties) {
      for (const w of settingsJson.customWarranties as WarrantyItem[]) {
        if (!w.purchaseDate || !w.durationMonths) continue;
        const pDate = new Date(w.purchaseDate);
        pDate.setMonth(pDate.getMonth() + Number(w.durationMonths));
        const expStr = formatLocalDate(pDate);

        // Before 1 month only show (<= 30 days and >= today)
        if (expStr >= todayStr && expStr <= thirtyDaysStr) {
          const diffDays = Math.max(0, Math.ceil((pDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
          notifications.push({
            id: `war-${w.id}`,
            type: 'warranty',
            title: `Warranty Expiring Soon`,
            message: `${w.productName} warranty ends on ${expStr} (${diffDays} days left)`,
            urgency: diffDays <= 5 ? 'high' : 'medium',
            linkTab: 'warranties'
          });
        }
      }
    }

    // 4. Check Budget limit approaching (>= 80% spent)
    if (settingsJson?.monthlyBudget && settingsJson.monthlyBudget > 0) {
      const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      const { data: monthExp } = await supabase
        .from('expenses')
        .select('amount, type, tags')
        .eq('partner_id', partnerId)
        .gte('date', `${monthPrefix}-01`);

      if (monthExp) {
        const spent = monthExp
          .filter(e => e.type !== 'income' && !(e.tags && /income/i.test(e.tags)))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const ratio = (spent / settingsJson.monthlyBudget) * 100;
        if (ratio >= 80) {
          notifications.push({
            id: `budget-${monthPrefix}`,
            type: 'budget',
            title: ratio >= 100 ? 'Monthly Budget Exceeded!' : 'Budget Warning (80%+)',
            message: `You spent ₹${spent.toLocaleString()} (${Math.round(ratio)}%) of your ₹${Number(settingsJson.monthlyBudget).toLocaleString()} monthly limit`,
            urgency: ratio >= 100 ? 'high' : 'medium',
            linkTab: 'budgets'
          });
        }
      }
    }

    // 5. Recurring Bills Due
    if (settingsJson?.recurringBills && Array.isArray(settingsJson.recurringBills)) {
      for (const rb of settingsJson.recurringBills) {
        if (rb.dueDay && Math.abs(rb.dueDay - currentDayNum) <= 2) {
          notifications.push({
            id: `rec-${rb.id}`,
            type: 'recurring',
            title: `Recurring Bill: ${rb.name}`,
            message: `₹${Number(rb.amount).toLocaleString()} due on day ${rb.dueDay} (${rb.category})`,
            urgency: rb.dueDay === currentDayNum ? 'high' : 'low',
            linkTab: 'expenses'
          });
        }
      }
    }

    // 6. User Scheduled Reminders (check dedicated reminders table, settingsJson, and local cache)
    let activeReminders: any[] = [];
    try {
      const { data: remRows } = await supabase
        .from('reminders')
        .select('*')
        .eq('partner_id', partnerId)
        .order('reminder_date', { ascending: true });
      if (remRows && remRows.length > 0) {
        activeReminders = remRows;
      }
    } catch {
      // ignore
    }

    if (activeReminders.length === 0 && settingsJson?.reminders && Array.isArray(settingsJson.reminders)) {
      activeReminders = settingsJson.reminders;
    }

    if (activeReminders.length === 0) {
      try {
        const localRaw = localStorage.getItem(`xpenser_reminders_${partnerId}`);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (Array.isArray(parsed)) activeReminders = parsed;
        }
      } catch {}
    }

    for (const rem of activeReminders) {
      if (!rem.is_completed && rem.reminder_date) {
        const rTime = (rem.reminder_time || '').slice(0, 5);
        if (rem.reminder_date === todayStr) {
          notifications.push({
            id: `rem-${rem.id}`,
            type: 'remainder',
            title: `⏰ Remainder Today: ${rem.title}`,
            message: `Scheduled for ${rTime || 'today'}${rem.description ? ` · ${rem.description}` : ''}`,
            urgency: 'high',
            linkTab: 'remainder'
          });
        } else if (rem.reminder_date < todayStr) {
          notifications.push({
            id: `rem-past-${rem.id}`,
            type: 'remainder',
            title: `⚠️ Overdue Remainder: ${rem.title}`,
            message: `Was scheduled for ${rem.reminder_date} at ${rTime}`,
            urgency: 'high',
            linkTab: 'remainder'
          });
        }
      }
    }

  } catch (err) {
    console.error('Error fetching reminders:', err);
  }

  return notifications;
};
