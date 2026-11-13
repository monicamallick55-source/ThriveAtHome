import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function seed() {
  const { data: { users } } = await admin.auth.admin.listUsers()
  const mem = users.find(u => u.email === 'member@test.com')
  const memId = 'e7310236-0962-4fc6-9c63-9443656fb11b'

  // ── 1. community_members — join member to circles for TC-M005 ──────────
  console.log('1. community_members...')
  const { data: circles } = await admin.from('interest_circles').select('id').limit(25)
  if (circles) {
    for (const c of circles.slice(0, 5)) {
      const { error } = await admin.from('community_members').upsert(
        { member_id: memId, circle_id: c.id, joined_at: new Date().toISOString() },
        { onConflict: 'member_id,circle_id', ignoreDuplicates: true }
      )
      if (error && !error.message.includes('duplicate')) console.log('  error:', error.message)
    }
    console.log('  ✓ joined member to 5 circles')
  }

  // ── 2. life_transitions pathway data ──────────────────────────────────
  console.log('\n2. life_transitions...')
  const pathways = ['retirement', 'new_diagnosis', 'moving', 'spouse_loss', 'housing_change']
  for (const t of pathways) {
    const { error } = await admin.from('life_transitions').upsert(
      { member_id: memId, transition_type: t, status: 'active' },
      { onConflict: 'member_id,transition_type', ignoreDuplicates: true }
    )
    if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) 
      console.log('  error:', t, error.message)
    else console.log('  ✓', t)
  }

  // ── 3. achievements data ───────────────────────────────────────────────
  console.log('\n3. achievements...')
  const { error: achErr } = await admin.from('achievements').upsert(
    { member_id: memId, type: 'home_from_hospital', awarded_by: 'system', created_at: new Date().toISOString() },
    { onConflict: 'member_id,type', ignoreDuplicates: true }
  )
  if (achErr && !achErr.message.includes('duplicate')) console.log('  error:', achErr.message)
  else console.log('  ✓ home_from_hospital achievement')

  // ── 4. navigator_tasks with member link ───────────────────────────────
  console.log('\n4. navigator tasks with member...')
  const { data: navRow } = await admin.from('care_navigators').select('id').eq('email', 'navigator@test.com').single()
  if (navRow) {
    const { error } = await admin.from('navigator_tasks').upsert(
      { navigator_id: navRow.id, member_id: memId, task_type: 'home_from_hospital', description: 'Home from hospital transition', completed: false },
      { onConflict: 'navigator_id,member_id,task_type', ignoreDuplicates: true }
    )
    if (error && !error.message.includes('duplicate')) console.log('  error:', error.message)
    else console.log('  ✓ home_from_hospital task')
  }

  // ── 5. admin portal — org_configs row ─────────────────────────────────
  console.log('\n5. org_configs...')
  const { data: orgs } = await admin.from('b2b_orgs').select('id').limit(1)
  if (orgs && orgs.length > 0) {
    const { error } = await admin.from('org_configs').upsert(
      { org_id: orgs[0].id, feature_flags: { marketplace_live: false, campaigns_live: false } },
      { onConflict: 'org_id', ignoreDuplicates: true }
    )
    if (error) console.log('  error:', error.message)
    else console.log('  ✓ org_configs')
  } else {
    console.log('  no b2b_orgs found')
  }

  console.log('\nSeed v40 done.')
}
seed().catch(console.error)
