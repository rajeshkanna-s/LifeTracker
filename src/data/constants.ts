import type { QuickAddTemplate, ExpenseSettings, DebtSettings, JobSettings, HabitSettings, FitnessSettings } from '../types';

// ── Categories ──
export const DEFAULT_CATEGORIES = [
  'Food', 'Grocery', 'Vegetables', 'Petrol / Fuel', 'Travel / Transport',
  'Mobile Recharge', 'Internet Bill', 'Electricity Bill', 'Rent / Home Loan',
  'EMIs / Loans', 'Education', 'Health / Medical', 'Entertainment',
  'Cinema / Movies', 'Dress / Clothing', 'Shopping', 'Office',
  'Kids / Family', 'Gifts / Donations', 'Home Maintenance',
  'Savings / Investments', 'Social / Events', 'Miscellaneous',
];

// ── Platforms by Category ──
export const PLATFORMS_BY_CATEGORY: Record<string, string[]> = {
  'Food': ['Swiggy', 'Zomato', 'Local Restaurant', 'Canteen', 'Street Food', 'Home Cooked', 'Other'],
  'Grocery': ['BigBasket', 'Zepto', 'Blinkit', 'Swiggy Instamart', 'JioMart', 'DMart', 'Kirana Shop', 'Other'],
  'Vegetables': ['BigBasket', 'Zepto', 'Vegetable Shop', 'Local Market', 'Other'],
  'Petrol / Fuel': ['HP', 'Indian Oil', 'Bharat Petroleum', 'Shell', 'Local Pump', 'Other'],
  'Travel / Transport': ['Ola', 'Uber', 'Rapido', 'RedBus', 'IRCTC', 'Auto', 'Metro', 'Bus', 'Other'],
  'Mobile Recharge': ['Paytm', 'PhonePe', 'Google Pay', 'Jio App', 'Airtel App', 'Other'],
  'Entertainment': ['Netflix', 'Amazon Prime', 'Hotstar', 'Spotify', 'YouTube Premium', 'Other'],
  'Dress / Clothing': ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Local Shop', 'Mall', 'Other'],
  'Cinema / Movies': ['BookMyShow', 'PVR', 'INOX', 'Local Theatre', 'Other'],
  'Education': ['Udemy', 'Coursera', 'School Fees', 'Tuition', 'Books', 'Other'],
  'Health / Medical': ['Hospital', 'Clinic', 'Medical Shop', '1mg', 'Pharmeasy', 'Other'],
  'Office': ['Tea', 'Office Lunch', 'Canteen', 'Team Lunch', 'Snacks', 'Other'],
  'Shopping': ['Amazon', 'Flipkart', 'Meesho', 'Local Shop', 'Other'],
};

export const ALL_PLATFORMS = [
  'Swiggy', 'Zomato', 'BigBasket', 'Zepto', 'Blinkit', 'Amazon', 'Flipkart',
  'Myntra', 'Meesho', 'Ola', 'Uber', 'Rapido', 'Paytm', 'PhonePe', 'Google Pay',
  'Netflix', 'BookMyShow', 'Local Shop', 'Hospital', 'Medical Shop', 'Other'
];

// ── Payment Methods ──
export const PAYMENT_METHODS = [
  'Cash', 'UPI', 'Debit Card', 'Credit Card', 'Net Banking',
  'Wallet (Paytm)', 'Wallet (GPay)', 'Wallet (PhonePe)', 'Wallet (Amazon Pay)',
];

// ── Category Emojis ──
export const CATEGORY_EMOJIS: Record<string, string[]> = {
  'Food': ['🍕', '🍔', '🍜', '🍛', '🌮', '🍱', '🍲', '🥘'],
  'Grocery': ['🛒', '🧺', '🥫', '🧴', '🫙', '🧈'],
  'Vegetables': ['🥬', '🥕', '🍅', '🥦', '🌽', '🧅', '🥒'],
  'Petrol / Fuel': ['⛽', '🛢️', '🚗', '🏍️', '🚙'],
  'Travel / Transport': ['🚌', '🚇', '🛺', '✈️', '🚕', '🚂', '🚁'],
  'Mobile Recharge': ['📱', '📶', '💳', '🔋', '📞'],
  'Internet Bill': ['🌐', '📡', '💻', '🖥️', '📶'],
  'Electricity Bill': ['💡', '⚡', '🔌', '🏠', '🔋'],
  'Rent / Home Loan': ['🏠', '🏡', '🔑', '🏢', '🏘️'],
  'EMIs / Loans': ['🏦', '💸', '📋', '🤝', '💰'],
  'Education': ['📚', '🎓', '✏️', '🏫', '📖', '🧑‍🎓'],
  'Health / Medical': ['🏥', '💊', '🩺', '🩹', '🧬', '💉'],
  'Entertainment': ['🎮', '🎬', '🎵', '🎭', '🎪', '🎧'],
  'Cinema / Movies': ['🎬', '🍿', '🎥', '📽️', '🎞️'],
  'Dress / Clothing': ['👕', '👗', '👟', '🧥', '👔', '👒'],
  'Shopping': ['🛍️', '🏪', '🛒', '💳', '📦', '🏬'],
  'Office': ['☕', '💼', '🖊️', '📎', '🖨️', '🗂️'],
  'Kids / Family': ['👶', '🧸', '🎒', '🍼', '👨‍👩‍👧', '🎠'],
  'Gifts / Donations': ['🎁', '💝', '🤲', '🎀', '💐', '🙏'],
  'Home Maintenance': ['🔧', '🪛', '🧹', '🪣', '🔨', '🪠'],
  'Savings / Investments': ['💰', '📈', '🏦', '🪙', '💎', '📊'],
  'Social / Events': ['🎉', '🥂', '🎊', '👥', '🍾', '🥳'],
  'Miscellaneous': ['📌', '🔖', '📝', '🗂️', '🏷️', '🔗'],
};

// ── Quick Add Defaults ──
export const DEFAULT_QUICK_ADD: QuickAddTemplate[] = [
  { id: '1', name: 'Tea', amount: 20, category: 'Office', platform: 'Tea', icon: '☕' },
  { id: '2', name: 'Office Lunch', amount: 120, category: 'Office', platform: 'Office Lunch', icon: '🍽️' },
  { id: '3', name: 'Auto to Office', amount: 50, category: 'Travel / Transport', platform: 'Auto', icon: '🛺' },
  { id: '4', name: 'Petrol', amount: 500, category: 'Petrol / Fuel', platform: 'Local Pump', icon: '⛽' },
  { id: '5', name: 'Grocery', amount: 200, category: 'Grocery', platform: 'Kirana Shop', icon: '🛒' },
  { id: '6', name: 'Snacks', amount: 50, category: 'Food', platform: 'Local Shop', icon: '🍪' },
];

// ── Currencies ──
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

// ── Default Settings ──
export const getDefaultExpenseSettings = (): ExpenseSettings => ({
  currency: 'INR',
  currencySymbol: '₹',
  monthlyBudget: 0,
  bigExpenseLimit: 2000,
  categoryBudgets: [],
  quickAddTemplates: [...DEFAULT_QUICK_ADD],
  customCategories: [],
  customPaymentMethods: [],
  customPlatforms: [],
  customCategoryEmojis: {},
  familyMembers: ['Me'],
  savingsGoals: [],
  dayNotes: [],
});

export const getDefaultDebtSettings = (): DebtSettings => ({
  currency: 'INR',
  currencySymbol: '₹',
  monthlyIncome: 0,
  reminderDays: 7,
  customCategories: [],
});

// ── Debt Categories ──
export const DEBT_CATEGORIES = [
  'Home Loan', 'Car Loan', 'Bike Loan', 'Personal Loan', 'Education Loan',
  'Gold Loan', 'Credit Card', 'Business Loan', 'Chit Fund',
  'Friend / Family', 'Other',
];

export const getDefaultJobSettings = (): JobSettings => ({
  customSources: [],
  customStatuses: [],
  customJobTypes: [],
});

export const getDefaultHabitSettings = (): HabitSettings => ({
  customCategories: [],
});

export const getDefaultFitnessSettings = (): FitnessSettings => ({
  customTypes: [],
});
