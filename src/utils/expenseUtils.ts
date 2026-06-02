import type { Expense } from '../types';
import { format, parseISO, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export const getTodayString = () => format(new Date(), 'yyyy-MM-dd');
export const getCurrentTimeString = () => format(new Date(), 'HH:mm');
export const getMonthStartString = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');
export const getWeekStartString = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
export const getWeekEndString = () => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

export const getTodayTotal = (expenses: Expense[]) => {
  const today = getTodayString();
  return expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
};

export const getWeekTotal = (expenses: Expense[]) => {
  const start = getWeekStartString();
  const end = getWeekEndString();
  return expenses.filter(e => e.date >= start && e.date <= end).reduce((sum, e) => sum + e.amount, 0);
};

export const getMonthTotal = (expenses: Expense[]) => {
  const monthStart = getMonthStartString();
  return expenses.filter(e => e.date >= monthStart).reduce((sum, e) => sum + e.amount, 0);
};

export const getYearTotal = (expenses: Expense[]) => {
  const yearStart = `${new Date().getFullYear()}-01-01`;
  return expenses.filter(e => e.date >= yearStart).reduce((sum, e) => sum + e.amount, 0);
};

export const getNoSpendDays = (expenses: Expense[], year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const spentDays = new Set(
    expenses
      .filter(e => {
        const d = parseISO(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(e => e.date)
  );
  return daysInMonth - spentDays.size;
};

export const getCategoryBreakdown = (expenses: Expense[]) => {
  const breakdown = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return Object.entries(breakdown)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount);
};

// ── Report Analytics Helpers ──

export type TimeGranularity = 'day' | 'week' | 'month';
export type BreakdownDimension = 'category' | 'platform' | 'payment_method' | 'person' | 'tags';

const daysBetweenInclusive = (from: string, to: string) => {
  const start = parseISO(from);
  const end = parseISO(to);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
};

export interface SummaryStats {
  total: number;
  count: number;
  avgPerTxn: number;
  avgPerDay: number;
  largest: number;
  smallest: number;
  activeDays: number;
}

export const getSummaryStats = (expenses: Expense[], fromDate: string, toDate: string): SummaryStats => {
  const count = expenses.length;
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const amounts = expenses.map(e => Number(e.amount));
  const periodDays = daysBetweenInclusive(fromDate, toDate);
  const activeDays = new Set(expenses.map(e => e.date)).size;
  return {
    total,
    count,
    avgPerTxn: count > 0 ? Math.round((total / count) * 100) / 100 : 0,
    avgPerDay: periodDays > 0 ? Math.round((total / periodDays) * 100) / 100 : 0,
    largest: count > 0 ? Math.max(...amounts) : 0,
    smallest: count > 0 ? Math.min(...amounts) : 0,
    activeDays,
  };
};

// Comparison period = equal-length window immediately preceding [fromDate, toDate]
export const getComparisonRange = (fromDate: string, toDate: string) => {
  const len = daysBetweenInclusive(fromDate, toDate);
  const start = parseISO(fromDate);
  const compEnd = new Date(start.getTime() - 86400000);
  const compStart = new Date(compEnd.getTime() - (len - 1) * 86400000);
  return { from: format(compStart, 'yyyy-MM-dd'), to: format(compEnd, 'yyyy-MM-dd') };
};

export interface PeriodComparison {
  current: number;
  previous: number;
  diff: number;
  percentChange: number | null; // null when previous is 0
  direction: 'up' | 'down' | 'same';
}

export const getPeriodComparison = (current: number, previous: number): PeriodComparison => {
  const diff = current - previous;
  const direction: 'up' | 'down' | 'same' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'same';
  const percentChange = previous > 0 ? Math.round((diff / previous) * 1000) / 10 : null;
  return { current, previous, diff, percentChange, direction };
};

// Build a zero-filled trend series across [fromDate, toDate] at the given granularity
export const getTrendSeries = (expenses: Expense[], fromDate: string, toDate: string, granularity: TimeGranularity) => {
  const bucketKey = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (granularity === 'day') return format(d, 'yyyy-MM-dd');
    if (granularity === 'week') return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    return format(startOfMonth(d), 'yyyy-MM');
  };
  const bucketLabel = (key: string) => {
    if (granularity === 'day') return format(parseISO(key), 'dd MMM');
    if (granularity === 'week') return format(parseISO(key), 'dd MMM');
    return format(parseISO(key + '-01'), 'MMM yyyy');
  };

  // Generate all buckets in range
  const buckets: string[] = [];
  let cursor = parseISO(fromDate);
  const end = parseISO(toDate);
  const seen = new Set<string>();
  while (cursor.getTime() <= end.getTime()) {
    const key = bucketKey(format(cursor, 'yyyy-MM-dd'));
    if (!seen.has(key)) { seen.add(key); buckets.push(key); }
    cursor = new Date(cursor.getTime() + 86400000);
  }

  const totals: Record<string, number> = {};
  buckets.forEach(b => { totals[b] = 0; });
  expenses.forEach(e => {
    const key = bucketKey(e.date);
    if (key in totals) totals[key] += Number(e.amount);
  });

  return buckets.map(key => ({ label: bucketLabel(key), amount: Math.round(totals[key]) }));
};

// Generic breakdown by any dimension; tags are split on commas
export const getDimensionBreakdown = (expenses: Expense[], dimension: BreakdownDimension) => {
  const totals: Record<string, number> = {};

  expenses.forEach(e => {
    const amt = Number(e.amount);
    if (dimension === 'tags') {
      const raw = (e.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      const unique = Array.from(new Set(raw));
      if (unique.length === 0) {
        totals['Uncategorized'] = (totals['Uncategorized'] || 0) + amt;
      } else {
        unique.forEach(tag => { totals[tag] = (totals[tag] || 0) + amt; });
      }
    } else {
      const val = ((e[dimension] as string) || '').trim() || 'Uncategorized';
      totals[val] = (totals[val] || 0) + amt;
    }
  });

  const grandTotal = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return Object.entries(totals)
    .map(([label, amount]) => ({
      label,
      amount,
      percentage: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount || a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
};

export const getTopExpenses = (expenses: Expense[], limit = 10) => {
  return expenses
    .filter(e => Number(e.amount) > 0)
    .sort((a, b) => {
      if (Number(b.amount) !== Number(a.amount)) return Number(b.amount) - Number(a.amount);
      return new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime();
    })
    .slice(0, limit);
};
