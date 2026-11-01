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

export const sendBrowserNotification = (title: string, body: string, icon = '/pwa-192x192.png') => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon,
        badge: icon,
      });
    }
  } catch {
    // ignore
  }
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

    // 6. User Scheduled Reminders
    if (settingsJson?.reminders && Array.isArray(settingsJson.reminders)) {
      for (const rem of settingsJson.reminders) {
        if (!rem.is_completed && rem.reminder_date) {
          if (rem.reminder_date === todayStr) {
            notifications.push({
              id: `rem-${rem.id}`,
              type: 'remainder',
              title: `⏰ Remainder Today: ${rem.title}`,
              message: `Scheduled for ${rem.reminder_time || 'today'}${rem.description ? ` · ${rem.description}` : ''}`,
              urgency: 'high',
              linkTab: 'remainder'
            });
          } else if (rem.reminder_date < todayStr) {
            notifications.push({
              id: `rem-past-${rem.id}`,
              type: 'remainder',
              title: `⚠️ Overdue Remainder: ${rem.title}`,
              message: `Was scheduled for ${rem.reminder_date} at ${rem.reminder_time}`,
              urgency: 'high',
              linkTab: 'remainder'
            });
          }
        }
      }
    }

  } catch (err) {
    console.error('Error fetching reminders:', err);
  }

  return notifications;
};
