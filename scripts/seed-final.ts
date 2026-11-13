import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)

async function seed() {
  console.log('Running final seed...\n')
  const { data: { users } } = await admin.auth.admin.listUsers()
  const nav = users.find(u => u.email === 'navigator@test.com')
  const mem = users.find(u => u.email === 'member@test.com')
  console.log('nav:', nav?.id ?? 'NOT FOUND', '| mem:', mem?.id ?? 'NOT FOUND')

  // ── 1. members table — seed member first (FK needed for navigator_tasks) ──
  console.log('\n1. members table...')
  if (mem) {
    // Check if member row already exists by supabase_auth_id
    const { data: existing } = await admin.from('members').select('id').eq('supabase_auth_id', mem.id).single()
    if (existing) {
      console.log('  member row exists, id:', existing.id)
    } else {
      const { data: inserted, error } = await admin.from('members').insert({
        supabase_auth_id: mem.id,
        full_name: 'Test Member',
        preferred_name: 'Test',
        zip_code: '94102',
        plan_tier: 'complete',
        status: 'active',
        preferred_language: 'en',
        timezone: 'America/Los_Angeles',
        check_in_frequency: 'weekly',
        date_of_birth: '1950-01-01',
        phone_number: '+14155550001',
      }).select('id').single()
      if (error) console.log('  error:', error.message)
      else console.log('  ✓ member inserted, id:', inserted?.id)
    }

    // Get the members.id (not auth id) for FK references
    const { data: memberRow } = await admin.from('members').select('id').eq('supabase_auth_id', mem.id).single()
    const memberId = memberRow?.id
    console.log('  members.id:', memberId)

    // ── 2. navigator_tasks — FK is to members.id not auth id ────────────────
    console.log('\n2. navigator_tasks...')
    if (nav && memberId) {
      // Check navigator's members.id too
      const { data: navRow } = await admin.from('members').select('id').eq('supabase_auth_id', nav.id).single()
      const navMemberId = navRow?.id
      console.log('  nav members.id:', navMemberId ?? 'not in members table')

      // navigator_id might be auth uuid or members.id — try both
      const navId = navMemberId ?? nav.id
      const taskTypes = [
        { task_type: 'welcome_call', description: 'Welcome call with new member' },
        { task_type: 'check_in', description: 'Monthly check-in call' },
        { task_type: 'transition_plan', description: 'Start life transition plan' },
        { task_type: 'crisis_followup', description: 'Crisis follow-up check' },
      ]
      for (const t of taskTypes) {
        const { error } = await admin.from('navigator_tasks').insert({
          navigator_id: navId,
          member_id: memberId,
          task_type: t.task_type,
          description: t.description,
          completed: false,
          due_by: new Date(Date.now() + 86400000 * 3).toISOString(),
        })
        if (error) console.log('  error:', t.task_type, '|', error.message)
        else console.log('  ✓', t.task_type)
      }
    } else {
      console.log('  missing nav or memberId — skipping')
    }

    // ── 3. life_transitions — needs transition_type ──────────────────────────
    console.log('\n3. life_transitions...')
    if (memberId) {
      const types = ['retirement','widow','diagnosis','moving','caregiving','divorce','loss','financial','independence']
      for (const t of types) {
        const { error } = await admin.from('life_transitions').insert({
          member_id: memberId,
          transition_type: t,
          status: 'active',
        })
        if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
          console.log('  error:', t, '|', error.message)
          break
        } else if (!error) console.log('  ✓', t)
      }
    }
  }

  // ── 4. interest_circles — add 10 more to reach 20 ───────────────────────
  console.log('\n4. interest_circles (adding more to reach 20)...')
  const { count: existing } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  current count:', existing)
  if ((existing ?? 0) < 20) {
    const more = [
      { name: 'Veterans Circle', slug: 'veterans', description: 'For veterans and military families', category: 'veterans', cover_emoji: '🎖️', is_active: true },
      { name: 'LGBTQ+ Friends', slug: 'lgbtq', description: 'Inclusive social circle', category: 'social', cover_emoji: '🌈', is_active: true },
      { name: 'Cooking Together', slug: 'cooking', description: 'Recipe sharing and cooking', category: 'cooking', cover_emoji: '🍳', is_active: true },
      { name: 'Music Lovers', slug: 'music', description: 'Classical and jazz appreciation', category: 'music', cover_emoji: '🎵', is_active: true },
      { name: 'Faith Circle', slug: 'faith', description: 'Interfaith discussion group', category: 'spiritual', cover_emoji: '🕊️', is_active: true },
      { name: 'Travel Memories', slug: 'travel', description: 'Share travel stories', category: 'travel', cover_emoji: '✈️', is_active: true },
      { name: 'Grandparents Circle', slug: 'grandparents', description: 'Share grandparent experiences', category: 'family', cover_emoji: '👴', is_active: true },
      { name: 'Professional Identity', slug: 'professional', description: 'Career and professional legacy', category: 'professional', cover_emoji: '💼', is_active: true },
      { name: 'Nature & Birds', slug: 'nature', description: 'Birdwatching and nature walks', category: 'nature', cover_emoji: '🐦', is_active: true },
      { name: 'Mindfulness Circle', slug: 'mindfulness', description: 'Daily mindfulness practice', category: 'wellness', cover_emoji: '🧘', is_active: true },
    ]
    for (const c of more) {
      const { error } = await admin.from('interest_circles').upsert(c, { onConflict: 'slug', ignoreDuplicates: true })
      if (error && !error.message.includes('duplicate')) console.log('  error:', c.name, error.message)
      else console.log('  ✓', c.name)
    }
  }
  const { count: final } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  final count:', final)

  console.log('\nSeed complete.')
}
seed().catch(console.error)
