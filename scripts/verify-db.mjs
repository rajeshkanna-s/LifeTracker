import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxtdahiabrnonzbszsde.supabase.co';
const supabaseKey = 'sb_publishable_bBYAozrRRlmNKaJvikxMDQ_fgyQqmas';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    'expenses',
    'expense_settings',
    'app_partners',
    'debts',
    'debt_payments',
    'debt_settings',
    'daily_notes',
    'vault_items',
    'habits',
    'habit_entries',
    'habit_settings',
    'fitness_logs',
    'fitness_settings',
    'job_applications',
    'job_settings',
    'routines',
    'routine_entries'
  ];

  console.log('Checking database connectivity and table access...\n');
  const results = {};

  for (const t of tables) {
    try {
      const { data, error, count } = await supabase
        .from(t)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[t] = { status: 'ERROR', message: error.message };
      } else {
        results[t] = { status: 'OK', count: count };
      }
    } catch (err) {
      results[t] = { status: 'EXCEPTION', message: err.message };
    }
  }

  console.table(results);
}

checkTables();

