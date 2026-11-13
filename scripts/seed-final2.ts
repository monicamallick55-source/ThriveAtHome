import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)

async function seed() {
  const { data: { users } } = await admin.auth.admin.listUsers()
  const nav = users.find(u => u.email === 'navigator@test.com')
  const mem = users.find(u => u.email === 'member@test.com')

  // ── 1. Insert navigator into members table so FK works ───────────────────
  console.log('1. Creating navigator member row...')
  if (nav) {
    const { data: existing } = await admin.from('members').select('id').eq('supabase_auth_id', nav.id).single()
    if (existing) {
      console.log('  nav member row exists:', existing.id)
    } else {
      const { data, error } = await admin.from('members').insert({
        supabase_auth_id: nav.id,
        full_name: 'Test Navigator',
        preferred_name: 'Navigator',
        zip_code: '94102',
        plan_tier: 'complete',
        status: 'active',
        preferred_language: 'en',
        timezone: 'America/Los_Angeles',
        check_in_frequency: 'weekly',
        date_of_birth: '1970-01-01',
        phone_number: '+14155550002',
      }).select('id').single()
      if (error) console.log('  error:', error.message)
      else console.log('  ✓ nav member row created:', data?.id)
    }
  }

  // Get both members.id values
  const { data: navRow } = await admin.from('members').select('id').eq('supabase_auth_id', nav!.id).single()
  const { data: memRow } = await admin.from('members').select('id').eq('supabase_auth_id', mem!.id).single()
  console.log('  nav members.id:', navRow?.id, '| mem members.id:', memRow?.id)

  // ── 2. Navigator tasks ───────────────────────────────────────────────────
  console.log('\n2. navigator_tasks...')
  if (navRow?.id && memRow?.id) {
    const tasks = [
      { task_type: 'welcome_call', description: 'Welcome call with new member' },
      { task_type: 'check_in', description: 'Monthly check-in call' },
      { task_type: 'transition_plan', description: 'Start life transition plan' },
      { task_type: 'crisis_followup', description: 'Crisis follow-up check' },
    ]
    for (const t of tasks) {
      const { error } = await admin.from('navigator_tasks').insert({
        navigator_id: navRow.id,
        member_id: memRow.id,
        task_type: t.task_type,
        description: t.description,
        completed: false,
        due_by: new Date(Date.now() + 86400000 * 3).toISOString(),
      })
      if (error) console.log('  error:', t.task_type, '|', error.message)
      else console.log('  ✓', t.task_type)
    }
  }

  // ── 3. Find valid life_transitions transition_type values ────────────────
  console.log('\n3. life_transitions — finding valid types...')
  if (memRow?.id) {
    // retirement worked, widow didn't — try common variants
    const candidates = ['widowhood','bereavement','grief','new_diagnosis','relocation',
      'moving_home','caregiving','caregiver','late_divorce','financial_change',
      'independence','aging_in_place','diagnosis','loss']
    for (const t of candidates) {
      const { error } = await admin.from('life_transitions').insert({
        member_id: memRow.id, transition_type: t, status: 'active'
      })
      if (!error) console.log('  ✓ valid:', t)
      else if (error.message.includes('check constraint')) console.log('  ✗ invalid:', t)
      else { console.log('  other error:', t, error.message); break }
    }
  }

  // ── 4. interest_circles — check slugs of existing 17 ────────────────────
  console.log('\n4. interest_circles...')
  const { data: existing } = await admin.from('interest_circles').select('name, slug')
  console.log('  existing:', existing?.map(c => c.slug).join(', '))
  const { count } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  count:', count)

  console.log('\nDone.')
}
seed().catch(console.error)
