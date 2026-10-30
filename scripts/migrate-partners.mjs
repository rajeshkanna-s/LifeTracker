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

async function migrate() {
  console.log('Starting migration...');

  // 1. Create app_partners table
  console.log('Creating app_partners table...');
  await executeSql(`
    CREATE TABLE IF NOT EXISTS public.app_partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      passcode TEXT NOT NULL DEFAULT '689090',
      avatar TEXT DEFAULT '👤',
      theme_color TEXT DEFAULT '#7c3aed',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE public.app_partners ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'app_partners' AND policyname = 'Allow all on app_partners'
      ) THEN
        CREATE POLICY "Allow all on app_partners" ON public.app_partners FOR ALL TO public USING (true) WITH CHECK (true);
      END IF;
    END
    $$;

    INSERT INTO public.app_partners (id, name, passcode, avatar, theme_color)
    VALUES 
      ('partner_1', 'Partner 1', '689090', '👤', '#7c3aed'),
      ('partner_2', 'Partner 2', '689090', '👥', '#0ea5e9')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Add partner_id to all tables
  const tables = [
    'expenses',
    'expense_settings',
    'debts',
    'debt_payments',
    'debt_settings',
    'job_applications',
    'job_settings',
    'habits',
    'habit_entries',
    'habit_settings',
    'workouts',
    'fitness_settings',
    'daily_notes',
    'routines',
    'routine_entries',
    'credentials'
  ];

  for (const table of tables) {
    console.log(`Adding partner_id to ${table}...`);
    await executeSql(`
      ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS partner_id TEXT NOT NULL DEFAULT 'partner_1';
      UPDATE public.${table} SET partner_id = 'partner_1' WHERE partner_id IS NULL;
      CREATE INDEX IF NOT EXISTS idx_${table}_partner_id ON public.${table}(partner_id);
    `);
  }

  // 3. Ensure Partner 2 has default settings if not exists
  console.log('Ensuring default settings for Partner 2...');
  await executeSql(`
    -- expense_settings for partner_2
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.expense_settings WHERE partner_id = 'partner_2') THEN
        INSERT INTO public.expense_settings (settings_json, partner_id, updated_at)
        SELECT settings_json, 'partner_2', NOW()
        FROM public.expense_settings WHERE partner_id = 'partner_1' LIMIT 1;
      END IF;
    END $$;

    -- debt_settings for partner_2
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.debt_settings WHERE partner_id = 'partner_2') THEN
        INSERT INTO public.debt_settings (settings_json, partner_id, updated_at)
        SELECT settings_json, 'partner_2', NOW()
        FROM public.debt_settings WHERE partner_id = 'partner_1' LIMIT 1;
      END IF;
    END $$;

    -- job_settings for partner_2
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.job_settings WHERE partner_id = 'partner_2') THEN
        INSERT INTO public.job_settings (settings_json, partner_id, updated_at)
        SELECT settings_json, 'partner_2', NOW()
        FROM public.job_settings WHERE partner_id = 'partner_1' LIMIT 1;
      END IF;
    END $$;

    -- habit_settings for partner_2
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.habit_settings WHERE partner_id = 'partner_2') THEN
        INSERT INTO public.habit_settings (settings_json, partner_id, updated_at)
        SELECT settings_json, 'partner_2', NOW()
        FROM public.habit_settings WHERE partner_id = 'partner_1' LIMIT 1;
      END IF;
    END $$;

    -- fitness_settings for partner_2
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.fitness_settings WHERE partner_id = 'partner_2') THEN
        INSERT INTO public.fitness_settings (settings_json, partner_id, updated_at)
        SELECT settings_json, 'partner_2', NOW()
        FROM public.fitness_settings WHERE partner_id = 'partner_1' LIMIT 1;
      END IF;
    END $$;
  `);

  console.log('Migration completed successfully!');
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
