import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)

async function seed() {
  const { data: { users } } = await admin.auth.admin.listUsers()
  const nav = users.find(u => u.email === 'navigator@test.com')
  const mem = users.find(u => u.email === 'member@test.com')
  const memMembersId = 'e7310236-0962-4fc6-9c63-9443656fb11b' // from previous run

  // ── 1. care_navigators — insert navigator@test.com ───────────────────────
  console.log('1. care_navigators...')
  const { data: existingNav } = await admin.from('care_navigators').select('id').eq('supabase_auth_id', nav!.id).single()
  let navCareId: string
  if (existingNav) {
    navCareId = existingNav.id
    console.log('  exists:', navCareId)
  } else {
    const { data, error } = await admin.from('care_navigators').insert({
      supabase_auth_id: nav!.id,
      full_name: 'Test Navigator',
      email: 'navigator@test.com',
      is_active: true,
    }).select('id').single()
    if (error) { console.log('  error:', error.message); return }
    navCareId = data!.id
    console.log('  ✓ created care_navigator:', navCareId)
  }

  // ── 2. navigator_tasks ───────────────────────────────────────────────────
  console.log('\n2. navigator_tasks...')
  const tasks = [
    { task_type: 'welcome_call', description: 'Welcome call with new member' },
    { task_type: 'check_in', description: 'Monthly check-in call' },
    { task_type: 'transition_plan', description: 'Start life transition plan' },
    { task_type: 'crisis_followup', description: 'Crisis follow-up check' },
  ]
  for (const t of tasks) {
    const { error } = await admin.from('navigator_tasks').insert({
      navigator_id: navCareId,
      member_id: memMembersId,
      task_type: t.task_type,
      description: t.description,
      completed: false,
      due_by: new Date(Date.now() + 86400000 * 3).toISOString(),
    })
    if (error && !error.message.includes('duplicate')) console.log('  error:', t.task_type, '|', error.message)
    else console.log('  ✓', t.task_type)
  }

  // ── 3. life_transitions — only use confirmed valid types ─────────────────
  console.log('\n3. life_transitions...')
  // Confirmed valid: retirement, new_diagnosis
  // Try remaining candidates systematically
  const remaining = ['moving','spouse_loss','spousal_loss','divorce','financial','career_change',
    'housing_change','health_change','family_change','new_caregiver','becoming_caregiver',
    'widow','widowed','losing_spouse']
  const valid = ['retirement', 'new_diagnosis'] // already inserted
  for (const t of remaining) {
    const { error } = await admin.from('life_transitions').insert({
      member_id: memMembersId, transition_type: t, status: 'active'
    })
    if (!error) { valid.push(t); console.log('  ✓ valid:', t) }
    else if (!error.message.includes('check constraint')) {
      console.log('  other error:', t, '|', error.message); break
    }
  }
  console.log('  Valid types found:', valid)

  // ── 4. interest_circles — add 3 more with unique slugs ──────────────────
  console.log('\n4. interest_circles — adding 3 more...')
  const newCircles = [
    { name: 'Grief Support', slug: 'grief-support', description: 'Compassionate grief support circle', category: 'support', cover_emoji: '💙', is_active: true },
    { name: 'Chess & Games', slug: 'chess-games', description: 'Board games and chess', category: 'games', cover_emoji: '♟️', is_active: true },
    { name: 'Morning Walkers', slug: 'morning-walkers', description: 'Daily morning walks together', category: 'fitness', cover_emoji: '🚶', is_active: true },
  ]
  for (const c of newCircles) {
    const { error } = await admin.from('interest_circles').upsert(c, { onConflict: 'slug', ignoreDuplicates: true })
    if (error) console.log('  error:', c.name, error.message)
    else console.log('  ✓', c.name)
  }
  const { count } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  final count:', count)

  console.log('\nDone.')
}
seed().catch(console.error)
