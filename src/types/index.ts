// ── Expense Types ──
export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  platform: string;
  payment_method: string;
  date: string;
  time: string;
  tags: string;
  person: string;
  notes: string;
  created_at: string;
}

export interface QuickAddTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  platform: string;
  icon: string;
}

export interface CategoryBudget {
  category: string;
  budget: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
}

export interface DayNote {
  date: string;
  note: string;
}

export interface ExpenseSettings {
  currency: string;
  currencySymbol: string;
  monthlyBudget: number;
  bigExpenseLimit: number;
  categoryBudgets: CategoryBudget[];
  quickAddTemplates: QuickAddTemplate[];
  customCategories: string[];
  customPaymentMethods: string[];
  customPlatforms: string[];
  customCategoryEmojis: Record<string, string[]>;
  familyMembers: string[];
  savingsGoals: SavingsGoal[];
  dayNotes: DayNote[];
}

// ── Debt Types ──
export interface Debt {
  id: string;
  source: string;
  original_amount: number;
  current_balance: number;
  emi_amount: number;
  closing_month?: string;
  paid_amount: number;
  type: string;
  notes?: string;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  month_key: string; // YYYY-MM
  created_at: string;
}

export interface DebtSettings {
  currency: string;
  currencySymbol: string;
  monthlyIncome: number;
  reminderDays: number;
  customCategories: string[];
  insurances?: Insurance[];
}

export interface Insurance {
  id: string;
  policyName: string;
  type: 'Term Ins' | 'Life Ins' | 'Medical Ins' | 'Other' | string;
  policyNumber: string;
  startDate: string;
  expireDate: string;
  paymentAmount: number;
  paymentFrequency: 'monthly' | 'yearly';
  downloadUrl?: string;
  fileName?: string;
  created_at: string;
}

// ── Job Application Types ──
export interface JobApplication {
  id: string;
  company: string;
  role: string;
  applied_date: string;
  source: string;
  status: string;
  job_type: string;
  first_call_date: string;
  first_call_info: string;
  interview_date: string;
  interview_time: string;
  interview_mode: string;
  offer_amount: number;
  notes: string;
  created_at: string;
}

// ── Habit Types ──
export interface Routine {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
}

export interface RoutineEntry {
  id: string;
  routine_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: string;
  category: string;
  target_count: number;
  created_at: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  created_at: string;
}

// ── Workout Types ──
export interface Workout {
  id: string;
  date: string;
  type: string;
  title: string;
  duration_min: number;
  calories_burned: number;
  body_weight: number;
  mood: string;
  exercises: string;
  notes: string;
  created_at: string;
}

export interface JobSettings {
  customSources: string[];
  customStatuses: string[];
  customJobTypes: string[];
}

export interface HabitSettings {
  customCategories: string[];
}

export interface FitnessSettings {
  customTypes: string[];
}

// ── Vault Types ──
export interface Credential {
  id: string;
  service_name: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ── App Types ──
export type TabId = 'expenses' | 'debt' | 'jobs' | 'habits' | 'fitness' | 'notes' | 'routines' | 'vault';

