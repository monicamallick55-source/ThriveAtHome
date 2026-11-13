/**
 * Seed script for E2E test data
 * Run: npx tsx scripts/seed-test-data.ts
 * Fixes: TC-M001, TC-M005, TC-M008, TC-M014, TC-M016, TC-N002, TC-LT003-*
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SERVICE_KEY
)

async function seed() {
  console.log('Seeding test data...\n')

  // ── 1. Communities (TC-M005: needs ≥20 circles) ──────────────────────────
  console.log('1. Seeding communities...')
  const communities = [
    { name: 'Book Club', description: 'Weekly book discussions', category: 'learning', member_count: 12 },
    { name: 'Garden Friends', description: 'Gardening tips and meetups', category: 'hobbies', member_count: 8 },
    { name: 'Morning Walkers', description: 'Daily morning walks', category: 'fitness', member_count: 15 },
    { name: 'Tech Help', description: 'Help with phones and computers', category: 'tech', member_count: 20 },
    { name: 'Chess Club', description: 'Weekly chess games', category: 'games', member_count: 6 },
    { name: 'Art Circle', description: 'Painting and crafts', category: 'arts', member_count: 10 },
    { name: 'Veterans Circle', description: 'For veterans and military families', category: 'veterans', member_count: 18 },
    { name: 'LGBTQ+ Friends', description: 'Inclusive social circle', category: 'social', member_count: 9 },
    { name: 'Cooking Together', description: 'Recipe sharing and cooking', category: 'cooking', member_count: 14 },
    { name: 'Music Lovers', description: 'Classical and jazz appreciation', category: 'music', member_count: 11 },
    { name: 'Faith & Spirituality', description: 'Interfaith discussion group', category: 'spiritual', member_count: 16 },
    { name: 'Travel Memories', description: 'Share travel stories and photos', category: 'travel', member_count: 13 },
    { name: 'Grandparents Circle', description: 'Share grandparent experiences', category: 'family', member_count: 22 },
    { name: 'Professional Identity', description: 'Career and professional legacy', category: 'professional', member_count: 7 },
    { name: 'Grief Support', description: 'Compassionate grief support', category: 'support', member_count: 5 },
    { name: 'Latino Heritage', description: 'Latino cultural celebration', category: 'cultural', member_count: 19 },
    { name: 'Asian American Circle', description: 'Asian American community', category: 'cultural', member_count: 17 },
    { name: 'Nature & Birds', description: 'Birdwatching and nature walks', category: 'nature', member_count: 8 },
    { name: 'Mindfulness & Meditation', description: 'Daily mindfulness practice', category: 'wellness', member_count: 21 },
    { name: 'Neighborhood Helpers', description: 'Local volunteer opportunities', category: 'volunteer', member_count: 25 },
  ]

  for (const c of communities) {
    const { error } = await admin.from('communities').upsert(c, { onConflict: 'name', ignoreDuplicates: true })
    if (error && !error.message.includes('duplicate')) console.error('  community error:', error.message)
  }
  console.log(`  ✓ ${communities.length} communities seeded`)

  // ── 2. Life transition pathways (TC-LT003-*) ─────────────────────────────
  console.log('2. Seeding life transition pathways...')
  const pathways = [
    { slug: 'retirement', title: 'Retirement', description: 'Navigating the transition to retirement life' },
    { slug: 'widow', title: 'Widowhood', description: 'Support after losing a spouse' },
    { slug: 'diagnosis', title: 'New Diagnosis', description: 'Coping with a new health diagnosis' },
    { slug: 'moving', title: 'Moving', description: 'Transitioning to a new home or community' },
    { slug: 'caregiving', title: 'Caregiving', description: 'Becoming a caregiver for a loved one' },
    { slug: 'divorce', title: 'Divorce', description: 'Navigating divorce later in life' },
    { slug: 'loss', title: 'Loss & Grief', description: 'Coping with loss of family or friends' },
    { slug: 'financial', title: 'Financial Change', description: 'Managing significant financial transitions' },
    { slug: 'independence', title: 'Independence', description: 'Maintaining independence as needs change' },
  ]

  for (const p of pathways) {
    const { error } = await admin.from('life_transition_pathways').upsert(p, { onConflict: 'slug', ignoreDuplicates: true })
    if (error && !error.message.includes('duplicate') && !error.message.includes('does not exist')) {
      console.log('  pathway table may not exist, skipping:', error.message)
      break
    }
  }
  console.log(`  ✓ ${pathways.length} pathways seeded (or table does not exist — API route handles it)`)

  // ── 3. Navigator tasks (TC-N002/003/004/005) ──────────────────────────────
  console.log('3. Checking navigator tasks...')
  const { data: navUser } = await admin.auth.admin.listUsers()
  const navigator = navUser?.users?.find(u => u.email === 'navigator@test.com')
  if (navigator) {
    const { data: member } = await admin.auth.admin.listUsers()
    const memberUser = member?.users?.find(u => u.email === 'member@test.com')
    if (memberUser) {
      const tasks = [
        { navigator_id: navigator.id, member_id: memberUser.id, task_type: 'welcome_call', title: 'Welcome call with new member', status: 'pending', due_date: new Date(Date.now()+86400000).toISOString() },
        { navigator_id: navigator.id, member_id: memberUser.id, task_type: 'check_in', title: 'Monthly check-in call', status: 'pending', due_date: new Date(Date.now()+172800000).toISOString() },
        { navigator_id: navigator.id, member_id: memberUser.id, task_type: 'transition_plan', title: 'Start transition plan', status: 'pending', due_date: new Date(Date.now()+259200000).toISOString() },
        { navigator_id: navigator.id, member_id: memberUser.id, task_type: 'crisis_followup', title: 'Crisis follow-up', status: 'pending', due_date: new Date(Date.now()+345600000).toISOString() },
      ]
      for (const t of tasks) {
        const { error } = await admin.from('navigator_tasks').insert(t)
        if (error && !error.message.includes('duplicate')) console.error('  task error:', error.message)
      }
      console.log(`  ✓ ${tasks.length} navigator tasks seeded`)
    } else {
      console.log('  ⚠ member@test.com not found — skipping tasks')
    }
  } else {
    console.log('  ⚠ navigator@test.com not found — skipping tasks')
  }

  // ── 4. Profile data for member (TC-M016: name, zip) ──────────────────────
  console.log('4. Checking member profile...')
  const { data: users } = await admin.auth.admin.listUsers()
  const memberUser = users?.users?.find(u => u.email === 'member@test.com')
  if (memberUser) {
    const { error } = await admin.from('profiles').upsert({
      id: memberUser.id,
      full_name: 'Test Member',
      zip_code: '94102',
      plan: 'complete',
      onboarding_complete: true,
    }, { onConflict: 'id' })
    if (error) console.error('  profile error:', error.message)
    else console.log('  ✓ member profile seeded (name, zip, plan)')
  } else {
    console.log('  ⚠ member@test.com not found')
  }

  console.log('\nSeed complete.')
}

seed().catch(console.error)
