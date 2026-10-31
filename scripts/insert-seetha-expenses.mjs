import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const envText = fs.readFileSync('.env', 'utf-8');
const envVars = {};
for (const line of envText.split('\n')) {
  const parts = line.trim().split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    envVars[k] = v;
  }
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

const seethaExpenses = [
  // ──────────────────────────────────────────
  // APRIL 2026 (Image 1 & 17 & Petrol log Image 3)
  // ──────────────────────────────────────────
  {
    amount: 2565,
    category: 'Grocery',
    description: 'Monthly Provision',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Groceries',
    person: 'Me',
    notes: 'April ledger item 1'
  },
  {
    amount: 400.41,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-04-13', // Image 3: 13.04.2026
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Odometer: 25336.8'
  },
  {
    amount: 200.90,
    category: 'Mobile Recharge',
    description: 'Patti Mobile Recharge',
    platform: 'Google Pay',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Patti',
    person: 'Me',
    notes: 'RC for Patti'
  },
  {
    amount: 200,
    category: 'Grocery',
    description: 'Fruits',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: ''
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Channa Samosa',
    platform: 'Street Food',
    payment_method: 'Cash',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'Cash payment'
  },
  {
    amount: 90,
    category: 'Food',
    description: 'Samosa',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: ''
  },
  {
    amount: 200,
    category: 'Vegetables',
    description: 'Vegetables (Onion, Tomato, Potato)',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Onion, Tomato, Potato'
  },
  {
    amount: 630.90,
    category: 'Mobile Recharge',
    description: 'Jio Recharge',
    platform: 'Jio App',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Mobile',
    person: 'Me',
    notes: 'Jio recharge'
  },
  {
    amount: 280,
    category: 'Food',
    description: 'Arcot Hotel Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Biriyani',
    person: 'Me',
    notes: ''
  },
  {
    amount: 230,
    category: 'Home Maintenance',
    description: 'Black Satti (Clay Pot)',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Kitchen',
    person: 'Me',
    notes: ''
  },
  {
    amount: 80,
    category: 'Food',
    description: 'Tender Coconut',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Drinks',
    person: 'Me',
    notes: ''
  },
  {
    amount: 158,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 168,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: ''
  },
  {
    amount: 19,
    category: 'Electricity Bill',
    description: 'EB Bill for Patti',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Patti, EB',
    person: 'Me',
    notes: ''
  },
  {
    amount: 530,
    category: 'Shopping',
    description: 'Knife & Iron Kadai',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Kitchen',
    person: 'Me',
    notes: ''
  },
  {
    amount: 2434.27,
    category: 'Grocery',
    description: 'DMart Purchase',
    platform: 'DMart',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'DMart',
    person: 'Me',
    notes: ''
  },
  {
    amount: 806,
    category: 'Internet Bill',
    description: 'Internet Bill',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'April internet'
  },
  {
    amount: 723.80,
    category: 'Dress / Clothing',
    description: 'Pink Dress',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Clothes',
    person: 'Me',
    notes: 'Image 17 item 17'
  },
  {
    amount: 30,
    category: 'Food',
    description: 'Puffs',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: ''
  },
  {
    amount: 190,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 493.24,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-04-29', // Image 3: 29.04.2026
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Odometer: 25529.1'
  },
  {
    amount: 108,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: ''
  },
  {
    amount: 160,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 130,
    category: 'Food',
    description: 'Snacks / Food',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'April item 23'
  },
  {
    amount: 1806,
    category: 'Dress / Clothing',
    description: 'Max Fashion Clothes',
    platform: 'Mall',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Clothes, Max',
    person: 'Me',
    notes: 'Max'
  },
  {
    amount: 160,
    category: 'Miscellaneous',
    description: 'Miscellaneous Expenses',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: '',
    person: 'Me',
    notes: 'April item 25'
  },
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Net recharge'
  },
  {
    amount: 249,
    category: 'Dress / Clothing',
    description: 'Max Leggings',
    platform: 'Mall',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: 'Clothes, Max',
    person: 'Me',
    notes: 'Max Leggin'
  },
  {
    amount: 252,
    category: 'Miscellaneous',
    description: 'Miscellaneous Expenses',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-04-10',
    time: '12:00',
    tags: '',
    person: 'Me',
    notes: 'April item 28'
  },

  // ──────────────────────────────────────────
  // MAY 2026 (Image 15 & 14 & Petrol log Image 3)
  // ──────────────────────────────────────────
  {
    amount: 270,
    category: 'Miscellaneous',
    description: 'Expenses',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: '',
    person: 'Me',
    notes: 'May item 1'
  },
  {
    amount: 90,
    category: 'Miscellaneous',
    description: 'Expenses',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: '',
    person: 'Me',
    notes: 'May item 2'
  },
  {
    amount: 165,
    category: 'Miscellaneous',
    description: 'Expenses',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: '',
    person: 'Me',
    notes: 'May item 3'
  },
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Net Recharge'
  },
  {
    amount: 312,
    category: 'Food',
    description: 'Zomato Food Order',
    platform: 'Zomato',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Food delivery',
    person: 'Me',
    notes: 'Zomato'
  },
  {
    amount: 280,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Puffs',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: ''
  },
  {
    amount: 120,
    category: 'Food',
    description: 'Chicken',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Meat',
    person: 'Me',
    notes: ''
  },
  {
    amount: 100,
    category: 'Vegetables',
    description: 'Tomatoes',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Chana Samosa',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: ''
  },
  {
    amount: 30,
    category: 'Vegetables',
    description: 'Keerai (Greens)',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Greens',
    person: 'Me',
    notes: ''
  },
  {
    amount: 493.23,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-05-14', // Image 3: 14.05.2026
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Odometer: 25757.1'
  },
  {
    amount: 80,
    category: 'Health / Medical',
    description: 'Boroline Medical Cream',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Boroline'
  },
  {
    amount: 389,
    category: 'Grocery',
    description: 'Fruits',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: ''
  },
  {
    amount: 1249,
    category: 'Grocery',
    description: 'DMart Purchase',
    platform: 'DMart',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'DMart',
    person: 'Me',
    notes: ''
  },
  {
    amount: 386.63,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-05-26', // Image 14 explicitly: 26.05
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Petrol 26.05'
  },
  {
    amount: 80,
    category: 'Food',
    description: 'Bakery (Ice Cream & Chips)',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Bakery, IceCream',
    person: 'Me',
    notes: 'Ice cream, chips'
  },
  {
    amount: 180,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 98,
    category: 'Food',
    description: 'Cadbury Dairy Milk',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Chocolate',
    person: 'Me',
    notes: 'Dairy milk'
  },
  {
    amount: 240,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: ''
  },
  {
    amount: 200,
    category: 'Food',
    description: 'Bakery Snacks',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: ''
  },
  // Cash items on right of Image 15:
  {
    amount: 60,
    category: 'Vegetables',
    description: 'Bottle Gourd & Kothavarangai',
    platform: 'Local Market',
    payment_method: 'Cash',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Vegetables, Cash',
    person: 'Me',
    notes: 'Bottle gourd, kothavarangai'
  },
  {
    amount: 30,
    category: 'Vegetables',
    description: 'Ponnakani Keerai',
    platform: 'Local Market',
    payment_method: 'Cash',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Greens, Cash',
    person: 'Me',
    notes: 'Keerai Ponnakani'
  },
  {
    amount: 130,
    category: 'Grocery',
    description: 'Paneer',
    platform: 'Kirana Shop',
    payment_method: 'Cash',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Dairy, Cash',
    person: 'Me',
    notes: 'Paneer'
  },
  {
    amount: 30,
    category: 'Vegetables',
    description: 'Spinach Keerai',
    platform: 'Local Market',
    payment_method: 'Cash',
    date: '2026-05-10',
    time: '12:00',
    tags: 'Greens, Cash',
    person: 'Me',
    notes: 'Keerai Spinach'
  },

  // ──────────────────────────────────────────
  // JUNE 2026 (Image 13 & 12 & Petrol log Image 3)
  // ──────────────────────────────────────────
  {
    amount: 515,
    category: 'Health / Medical',
    description: 'Hospital Consultation',
    platform: 'Hospital',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Hospital'
  },
  {
    amount: 900,
    category: 'Health / Medical',
    description: 'Hospital Treatment',
    platform: 'Hospital',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Hospital'
  },
  {
    amount: 100,
    category: 'Miscellaneous',
    description: 'Self Transfer',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Transfer',
    person: 'Me',
    notes: 'Self transfer'
  },
  {
    amount: 100,
    category: 'Miscellaneous',
    description: 'Self Transfer Central Bank',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Transfer',
    person: 'Me',
    notes: 'Central Bank self transfer'
  },
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Net'
  },
  {
    amount: 160,
    category: 'Health / Medical',
    description: 'Rotary Hospital',
    platform: 'Hospital',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Rotary hospital'
  },
  {
    amount: 475,
    category: 'Health / Medical',
    description: 'Rotary Hospital Tests / Medicines',
    platform: 'Hospital',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Rotary hospital'
  },
  {
    amount: 208,
    category: 'Health / Medical',
    description: 'Rotary Hospital Medicines',
    platform: 'Hospital',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Rotary hospital'
  },
  {
    amount: 170,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 177.46,
    category: 'Food',
    description: 'Subway Food',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Subway',
    person: 'Me',
    notes: 'Subway coms pease'
  },
  {
    amount: 630.90,
    category: 'Mobile Recharge',
    description: 'Jio Mobile Recharge',
    platform: 'Jio App',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Mobile',
    person: 'Me',
    notes: 'Jio recharge'
  },
  {
    amount: 372.28,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-06-12', // Image 13 explicitly: 12.06
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Petrol 12.06'
  },
  {
    amount: 200.90,
    category: 'Mobile Recharge',
    description: 'Patti Mobile Recharge',
    platform: 'Google Pay',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Patti',
    person: 'Me',
    notes: 'Patti recharge'
  },
  {
    amount: 70,
    category: 'Food',
    description: 'Bakery Puffs',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Backary Puff'
  },
  {
    amount: 150,
    category: 'Food',
    description: 'Potheri Ice Cream',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'IceCream',
    person: 'Me',
    notes: 'Potheri Ice cream'
  },
  {
    amount: 134,
    category: 'Food',
    description: 'Momos',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'Som momos'
  },
  {
    amount: 132,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: 'Iron dress'
  },
  {
    amount: 157,
    category: 'Electricity Bill',
    description: 'EB Electricity Bill',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-06-16', // Image 13 explicitly: 16.06.2026
    time: '12:00',
    tags: 'EB',
    person: 'Me',
    notes: 'EB Bill 16.06.2026'
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Bakery Snacks',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Backary'
  },
  {
    amount: 150,
    category: 'Health / Medical',
    description: 'Whisper Pads',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Personal Care',
    person: 'Me',
    notes: 'Whisper'
  },
  {
    amount: 40,
    category: 'Food',
    description: 'Bakery Snacks',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Backary'
  },
  {
    amount: 280,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 355.80,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'June Petrol refill 2'
  },
  {
    amount: 165,
    category: 'Food',
    description: 'Sathya Veg Restaurant',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Food',
    person: 'Me',
    notes: 'Sathya veg Resturant'
  },
  {
    amount: 120,
    category: 'Food',
    description: 'Bakery Items',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Backary'
  },
  {
    amount: 204,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: ''
  },
  {
    amount: 135,
    category: 'Health / Medical',
    description: 'Whisper Pads',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Personal Care',
    person: 'Me',
    notes: 'Whisper'
  },
  {
    amount: 810,
    category: 'Health / Medical',
    description: 'Kottakkal Ayurvedic Oil',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-06-10',
    time: '12:00',
    tags: 'Ayurveda',
    person: 'Me',
    notes: 'Kotakkal oil'
  },

  // ──────────────────────────────────────────
  // JULY 2026 (Image 11 & 10 & Petrol log Image 3)
  // ──────────────────────────────────────────
  {
    amount: 3404,
    category: 'Grocery',
    description: 'Monthly Provisions',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Groceries',
    person: 'Me',
    notes: 'Provision'
  },
  {
    amount: 433.96,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'July Petrol 1'
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Channa Snacks',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'Channa'
  },
  {
    amount: 164,
    category: 'Food',
    description: 'Cake / Bakery',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Cake'
  },
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Net'
  },
  {
    amount: 435,
    category: 'Food',
    description: 'Snacks MM Nagar',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'Snacks mm nagar'
  },
  {
    amount: 1163,
    category: 'Shopping',
    description: 'Earrings / Jewellery',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Jewellery',
    person: 'Me',
    notes: 'Earings'
  },
  {
    amount: 350,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 320,
    category: 'Food',
    description: 'Arcot Hotel Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Biriyani',
    person: 'Me',
    notes: 'Arcot hotel'
  },
  {
    amount: 200.90,
    category: 'Mobile Recharge',
    description: 'Patti Mobile Recharge',
    platform: 'Google Pay',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Patti',
    person: 'Me',
    notes: 'Patti recharge'
  },
  {
    amount: 300,
    category: 'Food',
    description: 'Burger',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Food',
    person: 'Me',
    notes: 'Burger'
  },
  {
    amount: 410.15,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'July Petrol 2'
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Banana Chips Bakery',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Snacks, Bakery',
    person: 'Me',
    notes: 'Banana Chips Backary'
  },
  {
    amount: 110,
    category: 'Food',
    description: 'Egg Puffs',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Egg puff'
  },
  {
    amount: 350,
    category: 'Food',
    description: 'Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Biriyani',
    person: 'Me',
    notes: 'Biriyani'
  },
  {
    amount: 1470,
    category: 'Grocery',
    description: 'Rice Bag',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Rice',
    person: 'Me',
    notes: 'Rice Bg'
  },
  {
    amount: 1050,
    category: 'Grocery',
    description: 'Groundnut Oil',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Oil',
    person: 'Me',
    notes: 'Groundnut oil'
  },
  {
    amount: 335.73,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-07-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'July Petrol 3'
  },

  // ──────────────────────────────────────────
  // AUGUST 2026 (Image 9 & 8 & Petrol log Image 3)
  // ──────────────────────────────────────────
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Internet'
  },
  {
    amount: 899,
    category: 'Mobile Recharge',
    description: 'Jio Mobile Recharge (84 Days)',
    platform: 'Jio App',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Mobile',
    person: 'Me',
    notes: 'Recharge 899'
  },
  {
    amount: 320,
    category: 'Food',
    description: 'Hotel Arcot Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Biriyani',
    person: 'Me',
    notes: 'Hotel arcot biriyani'
  },
  {
    amount: 311,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: ''
  },
  {
    amount: 372,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: ''
  },
  {
    amount: 552,
    category: 'Grocery',
    description: 'AGS Supermarket Groceries',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Groceries',
    person: 'Me',
    notes: 'AGS Supermarket'
  },
  {
    amount: 120,
    category: 'Health / Medical',
    description: 'Nattu Marundhu (Herbal Medicine)',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Medical, Herbal',
    person: 'Me',
    notes: 'Nattu marundhu shop'
  },
  {
    amount: 80,
    category: 'Electricity Bill',
    description: 'EB Electricity Bill',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'EB',
    person: 'Me',
    notes: 'EB'
  },
  {
    amount: 371.17,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'August Petrol 1'
  },
  {
    amount: 40,
    category: 'Food',
    description: 'Bakery Puffs',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Puff'
  },
  {
    amount: 1000,
    category: 'Grocery',
    description: 'Cooking Gas Cylinder Refill',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Gas',
    person: 'Me',
    notes: 'Gas'
  },
  {
    amount: 229.95,
    category: 'Food',
    description: "Domino's Pizza",
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Pizza',
    person: 'Me',
    notes: 'Dominos'
  },
  {
    amount: 400.41,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'August Petrol 2'
  },
  {
    amount: 130,
    category: 'Food',
    description: 'Bakery Items',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Backery'
  },
  {
    amount: 2000,
    category: 'Dress / Clothing',
    description: 'Dress Purchase',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Clothes',
    person: 'Me',
    notes: 'Dress'
  },
  {
    amount: 436.04,
    category: 'Cinema / Movies',
    description: 'Movie Tickets',
    platform: 'BookMyShow',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Movie',
    person: 'Me',
    notes: 'Ticket movie'
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Bakery Puffs',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Puffs'
  },
  {
    amount: 200,
    category: 'Food',
    description: 'Arcot Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Biriyani',
    person: 'Me',
    notes: 'Biriyani arcot'
  },
  {
    amount: 70,
    category: 'Grocery',
    description: 'Bananas',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Banana'
  },
  {
    amount: 20,
    category: 'Petrol / Fuel',
    description: 'Bike Air Refill',
    platform: 'Local Pump',
    payment_method: 'Cash',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Bike air Fill'
  },
  {
    amount: 335.04,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'August Petrol 3'
  },
  {
    amount: 325,
    category: 'Shopping',
    description: 'DMart Slippers',
    platform: 'DMart',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'DMart, Footwear',
    person: 'Me',
    notes: 'Dmart Slipper'
  },
  {
    amount: 45,
    category: 'Food',
    description: 'Popcorn',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'Pop-con'
  },
  {
    amount: 353, // 353 matches the 10011.61 exact total!
    category: 'Grocery',
    description: 'Fruits',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Fruits'
  },
  {
    amount: 360,
    category: 'Food',
    description: 'Sweets Purchase',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Sweets',
    person: 'Me',
    notes: 'Sweets'
  },
  {
    amount: 165,
    category: 'Food',
    description: 'Puff & Snacks',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Bakery, Snacks',
    person: 'Me',
    notes: 'Puff & Snack'
  },
  {
    amount: 120,
    category: 'Grocery',
    description: 'Pomegranates',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-08-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Pomegranate'
  },

  // ──────────────────────────────────────────
  // SEPTEMBER 2026 (Image 7 & 6 & Petrol log Image 3)
  // ──────────────────────────────────────────
  {
    amount: 1030,
    category: 'Food',
    description: 'Sweets',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Sweets',
    person: 'Me',
    notes: 'Sweets'
  },
  {
    amount: 750,
    category: 'Grocery',
    description: 'Ghee',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Dairy',
    person: 'Me',
    notes: 'Ghee'
  },
  {
    amount: 68.75,
    category: 'Travel / Transport',
    description: 'Highway Toll',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Toll',
    person: 'Me',
    notes: 'Toll'
  },
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Net'
  },
  {
    amount: 70,
    category: 'Grocery',
    description: 'Bananas',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Banana'
  },
  {
    amount: 336,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: ''
  },
  {
    amount: 273.83,
    category: 'Food',
    description: 'Burger',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Food',
    person: 'Me',
    notes: 'Burger'
  },
  {
    amount: 40,
    category: 'Food',
    description: 'Tiffin / Breakfast',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Tiffin',
    person: 'Me',
    notes: 'Tiffen'
  },
  {
    amount: 287,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Vegitables'
  },
  {
    amount: 150,
    category: 'Dress / Clothing',
    description: 'Manimalan Dress',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Clothes',
    person: 'Me',
    notes: 'Manimalan dress'
  },
  {
    amount: 199,
    category: 'Mobile Recharge',
    description: 'Patti Mobile Recharge',
    platform: 'Google Pay',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Patti',
    person: 'Me',
    notes: 'Patti RC'
  },
  {
    amount: 199,
    category: 'Mobile Recharge',
    description: 'Amma Mobile Recharge',
    platform: 'Google Pay',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Amma',
    person: 'Me',
    notes: 'Amma RC'
  },
  {
    amount: 44,
    category: 'Grocery',
    description: 'Curd / Milk',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Dairy',
    person: 'Me',
    notes: 'Curd'
  },
  {
    amount: 50,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Vegitable'
  },
  {
    amount: 110,
    category: 'Food',
    description: 'Bakery Items',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Backery'
  },
  {
    amount: 199,
    category: 'Mobile Recharge',
    description: 'Appa Mobile Recharge',
    platform: 'Google Pay',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Appa',
    person: 'Me',
    notes: 'Appa RC'
  },
  {
    amount: 80,
    category: 'Grocery',
    description: 'Bananas',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Banana'
  },
  {
    amount: 386.35,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'September Petrol 1'
  },
  {
    amount: 100,
    category: 'Food',
    description: 'Chicken',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Meat',
    person: 'Me',
    notes: 'Chicken'
  },
  {
    amount: 2000,
    category: 'Health / Medical',
    description: 'Master Health Checkup',
    platform: 'Hospital',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Master check up'
  },
  {
    amount: 30,
    category: 'Vegetables',
    description: 'Keerai (Greens)',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Greens',
    person: 'Me',
    notes: 'Keerai'
  },
  {
    amount: 30,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Veg'
  },
  {
    amount: 130,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Vegitable'
  },
  {
    amount: 210,
    category: 'Food',
    description: 'Veg Food / Tiffin',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Food, Tiffin',
    person: 'Me',
    notes: 'Veg food Tiffen'
  },
  {
    amount: 30,
    category: 'Food',
    description: 'Chicken Liver',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Meat',
    person: 'Me',
    notes: 'Chicken liver'
  },
  {
    amount: 45,
    category: 'Grocery',
    description: 'Bananas',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Banana'
  },
  {
    amount: 442.65,
    category: 'Food',
    description: "Domino's Pizza",
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Pizza',
    person: 'Me',
    notes: 'Dominos'
  },
  {
    amount: 290,
    category: 'Food',
    description: 'Mutton Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Biriyani',
    person: 'Me',
    notes: 'Mutton Biriyani'
  },
  {
    amount: 40,
    category: 'Food',
    description: 'Tiffin',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Tiffin',
    person: 'Me',
    notes: 'Tiffen'
  },
  {
    amount: 80,
    category: 'Health / Medical',
    description: 'Apollo Pharmacy Tablets',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Apollo tablet'
  },
  {
    amount: 386,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'September Petrol 2'
  },
  {
    amount: 172,
    category: 'Health / Medical',
    description: 'Whisper Pads & Tablets',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Personal Care, Medical',
    person: 'Me',
    notes: 'Wisper, tablet'
  },
  {
    amount: 40,
    category: 'Grocery',
    description: 'Eggs',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Eggs',
    person: 'Me',
    notes: 'Egg'
  },
  {
    amount: 426,
    category: 'Food',
    description: 'Sri Krishna Sweets',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Sweets',
    person: 'Me',
    notes: 'Krishna sweets'
  },
  {
    amount: 2325,
    category: 'Dress / Clothing',
    description: 'Ajio Dress Purchase',
    platform: 'Ajio',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Clothes, Ajio',
    person: 'Me',
    notes: 'Ajio dress'
  },
  {
    amount: 360,
    category: 'Food',
    description: 'Snacks MM Nagar',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Snacks',
    person: 'Me',
    notes: 'Snacks - mm nagar'
  },
  {
    amount: 105,
    category: 'Food',
    description: 'Fresh Juice',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Drinks',
    person: 'Me',
    notes: 'Juice'
  },
  {
    amount: 120,
    category: 'Grocery',
    description: 'Pomegranates',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Pomogranuts'
  },
  {
    amount: 730,
    category: 'Dress / Clothing',
    description: 'Ajio Camisole',
    platform: 'Ajio',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Clothes, Ajio',
    person: 'Me',
    notes: 'Ajio camisole'
  },
  {
    amount: 407.98,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'September Petrol 3'
  },
  {
    amount: 160,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Vegitable'
  },
  {
    amount: 40,
    category: 'Food',
    description: 'Tiffin',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-09-10',
    time: '12:00',
    tags: 'Tiffin',
    person: 'Me',
    notes: 'Tiffen'
  },

  // ──────────────────────────────────────────
  // OCTOBER 2026 (Image 5 & 4 & Petrol log Image 3 & 2)
  // ──────────────────────────────────────────
  {
    amount: 1403,
    category: 'Dress / Clothing',
    description: 'Ajio Dress Purchase',
    platform: 'Ajio',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Clothes, Ajio',
    person: 'Me',
    notes: 'Ajio - 1403'
  },
  {
    amount: 195,
    category: 'Food',
    description: 'Bilal Restaurant Food',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Food',
    person: 'Me',
    notes: 'Bilal'
  },
  {
    amount: 707,
    category: 'Internet Bill',
    description: 'Internet Recharge',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Wifi',
    person: 'Me',
    notes: 'Net'
  },
  {
    amount: 3200,
    category: 'Home Maintenance',
    description: 'Bike Service',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'Bike service'
  },
  {
    amount: 91,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Vegitable'
  },
  {
    amount: 448.86,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-10-04', // Image 3: 04.10.2026
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'October Petrol 1 (04.10.2026)'
  },
  {
    amount: 80,
    category: 'Health / Medical',
    description: 'Medical Ointment',
    platform: 'Medical Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Medical',
    person: 'Me',
    notes: 'Medical ointment'
  },
  {
    amount: 30,
    category: 'Vegetables',
    description: 'Tomatoes',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Tomato veg'
  },
  {
    amount: 502,
    category: 'Shopping',
    description: 'Kadai Pan',
    platform: 'Flipkart',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Kitchen, Flipkart',
    person: 'Me',
    notes: 'Kadai > Flipkart'
  },
  {
    amount: 130,
    category: 'Food',
    description: 'Chicken',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Meat',
    person: 'Me',
    notes: 'Chicken'
  },
  {
    amount: 3657,
    category: 'Grocery',
    description: 'Monthly Provisions',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Groceries',
    person: 'Me',
    notes: 'Provision'
  },
  {
    amount: 1000,
    category: 'Kids / Family',
    description: 'Rajesh',
    platform: 'Other',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Family',
    person: 'Me',
    notes: 'Rajesh'
  },
  {
    amount: 317,
    category: 'Vegetables',
    description: 'Vegetables',
    platform: 'Vegetable Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Vegetables',
    person: 'Me',
    notes: 'Vegetables'
  },
  {
    amount: 394.21,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-10-16', // Image 2: 16.10.2026
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'October Petrol 2 (16.10.2026)'
  },
  {
    amount: 750,
    category: 'Shopping',
    description: 'Vessels & Food Steamer Plate',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Kitchen',
    person: 'Me',
    notes: 'Vessel plate Food steam'
  },
  {
    amount: 170,
    category: 'Food',
    description: 'Chicken',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Meat',
    person: 'Me',
    notes: 'Chicken'
  },
  {
    amount: 320,
    category: 'Food',
    description: 'Arcot Prawn Biriyani',
    platform: 'Local Restaurant',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Biriyani, Seafood',
    person: 'Me',
    notes: 'Biriyani, Prawn Arcot'
  },
  {
    amount: 220,
    category: 'Grocery',
    description: 'Paneer & Cheese',
    platform: 'Kirana Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Dairy',
    person: 'Me',
    notes: 'Panneer, cheese'
  },
  {
    amount: 67,
    category: 'Food',
    description: 'Bread',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Bakery',
    person: 'Me',
    notes: 'Bread'
  },
  {
    amount: 441.53,
    category: 'Petrol / Fuel',
    description: 'Petrol Refill',
    platform: 'Local Pump',
    payment_method: 'UPI',
    date: '2026-10-23', // Image 2: 23.10.2026
    time: '12:00',
    tags: 'Bike',
    person: 'Me',
    notes: 'October Petrol 3 (23.10.2026)'
  },
  {
    amount: 6792.99,
    category: 'Shopping',
    description: 'Saravana Stores Gold Bracelet',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Gold, Jewellery',
    person: 'Me',
    notes: 'Saravana store gold Braclet'
  },
  {
    amount: 320,
    category: 'Home Maintenance',
    description: 'Ironing Clothes',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Iron',
    person: 'Me',
    notes: 'Iron'
  },
  {
    amount: 330,
    category: 'Home Maintenance',
    description: 'Dress Wash / Laundry',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Laundry',
    person: 'Me',
    notes: 'dress wash'
  },
  {
    amount: 120,
    category: 'Home Maintenance',
    description: 'Pillow Cover',
    platform: 'Local Shop',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Home',
    person: 'Me',
    notes: 'Pillow cover'
  },
  {
    amount: 35,
    category: 'Grocery',
    description: 'Bananas',
    platform: 'Local Market',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Fruits',
    person: 'Me',
    notes: 'Banana'
  },
  {
    amount: 40,
    category: 'Food',
    description: 'Tiffin',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Tiffin',
    person: 'Me',
    notes: 'Tiffen'
  },
  {
    amount: 50,
    category: 'Food',
    description: 'Food Snacks',
    platform: 'Street Food',
    payment_method: 'UPI',
    date: '2026-10-10',
    time: '12:00',
    tags: 'Food',
    person: 'Me',
    notes: 'food'
  }
];

async function insertAll() {
  console.log(`Preparing to insert ${seethaExpenses.length} expenses for Seetha (partner_2)...`);

  const rowsToInsert = seethaExpenses.map(item => ({
    id: crypto.randomUUID(),
    partner_id: 'partner_2',
    person: item.person || 'Me',
    amount: Number(item.amount),
    category: item.category,
    description: item.description,
    platform: item.platform || 'Other',
    payment_method: item.payment_method || 'UPI',
    date: item.date,
    time: item.time || '12:00',
    tags: item.tags || '',
    notes: item.notes || '',
    created_at: new Date(item.date + 'T12:00:00Z').toISOString()
  }));

  // Batch insert in chunks of 50
  const chunkSize = 50;
  for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
    const chunk = rowsToInsert.slice(i, i + chunkSize);
    const { data, error } = await supabase.from('expenses').insert(chunk).select('id');
    if (error) {
      console.error(`Error inserting chunk ${i} - ${i + chunk.length}:`, error);
      process.exit(1);
    }
    console.log(`Inserted chunk ${i + 1} to ${Math.min(i + chunkSize, rowsToInsert.length)} successfully (${data.length} rows).`);
  }

  console.log('\nAll entries inserted successfully!');

  // Verify in database
  const { data: inserted, error: queryErr } = await supabase
    .from('expenses')
    .select('id, amount, date, category')
    .eq('partner_id', 'partner_2');

  if (queryErr) {
    console.error('Error verifying inserted rows:', queryErr);
    return;
  }

  console.log(`\nVerified: Total ${inserted.length} rows found in database for partner_2 (Seetha)!`);

  // Group by month
  const byMonth = {};
  for (const row of inserted) {
    const m = row.date.substring(0, 7);
    if (!byMonth[m]) byMonth[m] = { count: 0, total: 0 };
    byMonth[m].count++;
    byMonth[m].total += Number(row.amount);
  }

  console.log('\nMonthly Breakdown for Seetha:');
  for (const [m, stat] of Object.entries(byMonth).sort()) {
    console.log(`- ${m}: ${stat.count} expenses | Total: ₹${stat.total.toFixed(2)}`);
  }
}

insertAll();

