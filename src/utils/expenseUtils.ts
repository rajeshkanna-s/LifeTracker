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
