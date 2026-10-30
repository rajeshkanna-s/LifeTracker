const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT || '';
const ref = process.env.SUPABASE_PROJECT_REF || 'fxtdahiabrnonzbszsde';

async function executeSql(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  const data = await res.json();
  if (data.error || (data.message && data.message.includes('error'))) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

const SEETHA_QUICK_ADD = [
  { id: 'seetha-1', name: 'Petrol', amount: 400, category: 'Petrol / Fuel', platform: 'Local Pump', icon: '⛽' },
  { id: 'seetha-2', name: 'Vegetables', amount: 200, category: 'Vegetables', platform: 'Vegetable Shop', icon: '🥬' },
  { id: 'seetha-3', name: 'Provision / DMart', amount: 2500, category: 'Grocery', platform: 'DMart', icon: '🛒' },
  { id: 'seetha-4', name: 'Internet Bill', amount: 707, category: 'Internet Bill', platform: 'Other', icon: '🌐' },
  { id: 'seetha-5', name: 'Bakery / Snacks', amount: 100, category: 'Food', platform: 'Local Shop', icon: '🥐' },
  { id: 'seetha-6', name: 'Ironing Clothes', amount: 150, category: 'Home Maintenance', platform: 'Local Shop', icon: '👔' },
  { id: 'seetha-7', name: 'Fruits / Banana', amount: 100, category: 'Grocery', platform: 'Local Market', icon: '🍌' },
  { id: 'seetha-8', name: 'Biriyani / Hotel', amount: 300, category: 'Food', platform: 'Local Restaurant', icon: '🍲' },
  { id: 'seetha-9', name: 'Mobile Recharge', amount: 200, category: 'Mobile Recharge', platform: 'Google Pay', icon: '📱' },
  { id: 'seetha-10', name: 'Milk / Dairy', amount: 100, category: 'Grocery', platform: 'Kirana Shop', icon: '🥛' }
];

async function run() {
  console.log('Checking expense_settings in Supabase...');
  const currentSettings = await executeSql(`
    SELECT id, partner_id, settings_json FROM public.expense_settings;
  `);
  console.log('Current expense_settings rows:', JSON.stringify(currentSettings, null, 2));

  // Check if partner_2 exists in expense_settings
  const partner2Row = currentSettings.find(r => r.partner_id === 'partner_2');
  if (partner2Row) {
    console.log('Updating existing row for partner_2...');
    let existingJson = partner2Row.settings_json;
    if (typeof existingJson === 'string') {
      try { existingJson = JSON.parse(existingJson); } catch (e) {}
    }
    const updatedJson = {
      ...(existingJson || {}),
      quickAddTemplates: SEETHA_QUICK_ADD
    };
    const escapedJson = JSON.stringify(updatedJson).replace(/'/g, "''");
    await executeSql(`
      UPDATE public.expense_settings
      SET settings_json = '${escapedJson}'::jsonb, updated_at = NOW()
      WHERE id = '${partner2Row.id}' AND partner_id = 'partner_2';
    `);
    console.log('Updated partner_2 expense_settings successfully!');
  } else {
    console.log('Inserting new row for partner_2...');
    const defaultSettings = {
      currency: 'INR',
      currencySymbol: '₹',
      monthlyBudget: 0,
      bigExpenseLimit: 2000,
      categoryBudgets: [],
      quickAddTemplates: SEETHA_QUICK_ADD,
      customCategories: [],
      customPaymentMethods: [],
      customPlatforms: [],
      customCategoryEmojis: {},
      familyMembers: ['Me'],
      savingsGoals: [],
      dayNotes: []
    };
    const escapedJson = JSON.stringify(defaultSettings).replace(/'/g, "''");
    await executeSql(`
      INSERT INTO public.expense_settings (partner_id, settings_json, created_at, updated_at)
      VALUES ('partner_2', '${escapedJson}'::jsonb, NOW(), NOW());
    `);
    console.log('Inserted partner_2 expense_settings successfully!');
  }

  // Verify
  const verifyResult = await executeSql(`
    SELECT id, partner_id, settings_json FROM public.expense_settings WHERE partner_id = 'partner_2';
  `);
  console.log('Verified partner_2 settings:', JSON.stringify(verifyResult, null, 2));
}

run().catch(err => {
  console.error('Error running setup:', err);
  process.exit(1);
});
