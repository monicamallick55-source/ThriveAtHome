import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)

async function seed() {
  console.log('Running targeted seed...\n')

  // ── 1. navigator_tasks — needs description (not-null) ────────────────────
  console.log('1. navigator_tasks...')
  const { data: { users } } = await admin.auth.admin.listUsers()
  const nav = users.find(u => u.email === 'navigator@test.com')
  const mem = users.find(u => u.email === 'member@test.com')
  if (nav && mem) {
    const tasks = [
      { task_type: 'welcome_call', description: 'Welcome call with new member' },
      { task_type: 'check_in', description: 'Monthly check-in call' },
      { task_type: 'transition_plan', description: 'Start life transition plan' },
      { task_type: 'crisis_followup', description: 'Crisis follow-up check' },
    ]
    for (const t of tasks) {
      const { error } = await admin.from('navigator_tasks').insert({
        navigator_id: nav.id,
        member_id: mem.id,
        task_type: t.task_type,
        description: t.description,
        priority: 'normal',
        completed: false,
        due_by: new Date(Date.now() + 86400000 * 3).toISOString(),
      })
      if (error && !error.message.includes('duplicate')) console.log('  error:', error.message)
      else console.log('  ✓ inserted:', t.task_type)
    }
  } else {
    console.log('  ⚠ nav:', nav?.email ?? 'NOT FOUND', '| mem:', mem?.email ?? 'NOT FOUND')
  }

  // ── 2. members table — seed member@test.com profile (TC-M016) ────────────
  console.log('2. members profile (name, zip)...')
  const mem2 = users.find(u => u.email === 'member@test.com')
  if (mem2) {
    const { error } = await admin.from('members').upsert({
      supabase_auth_id: mem2.id,
      full_name: 'Test Member',
      zip_code: '94102',
      plan_tier: 'complete',
      status: 'active',
      preferred_language: 'en',
    }, { onConflict: 'supabase_auth_id' })
    if (error) console.log('  error:', error.message)
    else console.log('  ✓ member profile seeded (name, zip, plan_tier)')
  } else {
    console.log('  ⚠ member@test.com not found')
  }

  // ── 3. life_transitions — table is empty, check columns properly ──────────
  console.log('3. life_transitions (direct column check)...')
  const { data: ltCols } = await admin.rpc('exec_sql', {
    sql: "SELECT column_name FROM information_schema.columns WHERE table_name='life_transitions' AND table_schema='public'"
  }).catch(() => ({ data: null }))
  
  if (ltCols) {
    console.log('  columns via RPC:', ltCols)
  } else {
    // Try inserting minimal row to discover required columns
    const { error: ltErr } = await admin.from('life_transitions').insert({
      member_id: users.find(u => u.email === 'member@test.com')?.id ?? '',
      pathway: 'retirement',
      status: 'active',
    })
    console.log('  insert test:', ltErr?.message ?? 'success')
  }

  // ── 4. Verify interest_circles count ─────────────────────────────────────
  console.log('4. Verifying interest_circles count...')
  const { count } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  ✓ interest_circles count:', count)

  console.log('\nDone.')
}

seed().catch(console.error)
