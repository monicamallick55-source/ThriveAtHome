import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)

async function seed() {
  console.log('Final targeted seed...\n')
  const { data: { users } } = await admin.auth.admin.listUsers()
  const nav = users.find(u => u.email === 'navigator@test.com')
  const mem = users.find(u => u.email === 'member@test.com')
  console.log('Users: nav=', nav?.email ?? 'NOT FOUND', '| mem=', mem?.email ?? 'NOT FOUND')

  // ── 1. Find valid task_priority enum values ───────────────────────────────
  console.log('\n1. navigator_tasks — finding valid priority enum...')
  const priorities = ['medium', 'high', 'low', 'urgent', 'normal', 'standard', 'routine']
  let validPriority = 'medium'
  for (const p of priorities) {
    const { error } = await admin.from('navigator_tasks').insert({
      navigator_id: nav!.id, member_id: mem!.id,
      task_type: 'welcome_call', description: 'test', priority: p, completed: false,
    })
    if (!error) { validPriority = p; console.log('  ✓ valid priority:', p); break }
    if (!error?.message.includes('enum')) { console.log('  other error:', error.message); break }
    console.log('  ✗ invalid:', p)
  }

  // Insert all 4 tasks with valid priority
  if (nav && mem) {
    const tasks = [
      { task_type: 'check_in', description: 'Monthly check-in call' },
      { task_type: 'transition_plan', description: 'Start life transition plan' },
      { task_type: 'crisis_followup', description: 'Crisis follow-up check' },
    ]
    for (const t of tasks) {
      const { error } = await admin.from('navigator_tasks').insert({
        navigator_id: nav.id, member_id: mem.id,
        task_type: t.task_type, description: t.description,
        priority: validPriority, completed: false,
        due_by: new Date(Date.now() + 86400000 * 3).toISOString(),
      })
      if (error) console.log('  error:', t.task_type, error.message)
      else console.log('  ✓', t.task_type)
    }
  }

  // ── 2. members table — preferred_name is not-null ────────────────────────
  console.log('\n2. members profile...')
  if (mem) {
    const { error } = await admin.from('members').upsert({
      supabase_auth_id: mem.id,
      full_name: 'Test Member',
      preferred_name: 'Test',
      zip_code: '94102',
      plan_tier: 'complete',
      status: 'active',
      preferred_language: 'en',
      timezone: 'America/Los_Angeles',
      check_in_frequency: 'weekly',
    }, { onConflict: 'supabase_auth_id' })
    if (error) console.log('  error:', error.message)
    else console.log('  ✓ member profile seeded (full_name, preferred_name, zip_code, plan_tier)')
  }

  // ── 3. life_transitions — discover columns via insert error ─────────────
  console.log('\n3. life_transitions...')
  if (mem) {
    const { error: e1 } = await admin.from('life_transitions').insert({ member_id: mem.id, pathway: 'retirement', status: 'active' })
    if (e1) {
      console.log('  attempt1 error:', e1.message)
      const { error: e2 } = await admin.from('life_transitions').insert({ member_id: mem.id, type: 'retirement', status: 'active' })
      if (e2) {
        console.log('  attempt2 error:', e2.message)
        // Try with just member_id to see all required fields
        const { error: e3 } = await admin.from('life_transitions').insert({ member_id: mem.id })
        console.log('  attempt3 error (shows required fields):', e3?.message)
      } else console.log('  ✓ life_transition inserted with type field')
    } else console.log('  ✓ life_transition inserted with pathway field')
  }

  // ── 4. interest_circles count ────────────────────────────────────────────
  console.log('\n4. interest_circles count...')
  const { count } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  count:', count)

  console.log('\nDone.')
}
seed().catch(console.error)
