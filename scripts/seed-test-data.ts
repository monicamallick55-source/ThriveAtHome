import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function seed() {
  console.log('Seeding with correct table names...\n')

  // ── 1. interest_circles (TC-M005) ────────────────────────────────────────
  console.log('1. Seeding interest_circles...')
  // First check what columns exist
  const { data: sample, error: sampleErr } = await admin.from('interest_circles').select('*').limit(1)
  if (sampleErr) {
    console.log('  interest_circles error:', sampleErr.message)
  } else {
    console.log('  Columns:', sample?.[0] ? Object.keys(sample[0]).join(', ') : 'table empty — inserting')
    const circles = [
      'Book Club','Garden Friends','Morning Walkers','Tech Help','Chess Club',
      'Art Circle','Veterans Circle','LGBTQ+ Friends','Cooking Together','Music Lovers',
      'Faith & Spirituality','Travel Memories','Grandparents Circle','Professional Identity',
      'Grief Support','Latino Heritage','Asian American Circle','Nature & Birds',
      'Mindfulness & Meditation','Neighborhood Helpers'
    ]
    for (const name of circles) {
      const row: Record<string,unknown> = { name }
      // add optional fields if columns exist
      if (sample?.[0] && 'description' in sample[0]) row.description = `${name} community circle`
      if (sample?.[0] && 'category' in sample[0]) row.category = 'social'
      if (sample?.[0] && 'member_count' in sample[0]) row.member_count = Math.floor(Math.random()*20)+5
      if (sample?.[0] && 'is_active' in sample[0]) row.is_active = true
      const { error } = await admin.from('interest_circles').upsert(row, { onConflict: 'name', ignoreDuplicates: true })
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.log('  circle insert error:', error.message)
        break
      }
    }
    console.log('  ✓ circles seeded')
  }

  // ── 2. life_transitions (TC-LT003) ───────────────────────────────────────
  console.log('2. Seeding life_transitions pathways...')
  const { data: ltSample, error: ltErr } = await admin.from('life_transitions').select('*').limit(1)
  if (ltErr) {
    console.log('  life_transitions error:', ltErr.message)
  } else {
    console.log('  Columns:', ltSample?.[0] ? Object.keys(ltSample[0]).join(', ') : 'table empty')
    const pathways = ['retirement','widow','diagnosis','moving','caregiving','divorce','loss','financial','independence']
    for (const slug of pathways) {
      const row: Record<string,unknown> = {}
      if (ltSample?.[0] && 'slug' in ltSample[0]) row.slug = slug
      if (ltSample?.[0] && 'pathway' in ltSample[0]) row.pathway = slug
      if (ltSample?.[0] && 'type' in ltSample[0]) row.type = slug
      if (ltSample?.[0] && 'title' in ltSample[0]) row.title = slug.charAt(0).toUpperCase()+slug.slice(1)
      if (ltSample?.[0] && 'status' in ltSample[0]) row.status = 'active'
      if (Object.keys(row).length === 0) { console.log('  no matching columns'); break }
      const { error } = await admin.from('life_transitions').insert(row)
      if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
        console.log('  lt insert error:', error.message); break
      }
    }
    console.log('  ✓ life_transitions seeded')
  }

  // ── 3. navigator_tasks (TC-N002) ─────────────────────────────────────────
  console.log('3. Seeding navigator_tasks...')
  const { data: ntSample, error: ntErr } = await admin.from('navigator_tasks').select('*').limit(1)
  if (ntErr) {
    console.log('  navigator_tasks error:', ntErr.message)
  } else {
    const cols = ntSample?.[0] ? Object.keys(ntSample[0]) : []
    console.log('  Columns:', cols.join(', ') || 'empty table')
    // find navigator user
    const { data: { users } } = await admin.auth.admin.listUsers()
    const nav = users.find(u => u.email === 'navigator@test.com')
    const mem = users.find(u => u.email === 'member@test.com')
    if (nav && mem) {
      const taskTypes = ['welcome_call','check_in','transition_plan','crisis_followup']
      for (const task_type of taskTypes) {
        const row: Record<string,unknown> = {}
        if (cols.includes('navigator_id')) row.navigator_id = nav.id
        if (cols.includes('member_id')) row.member_id = mem.id
        if (cols.includes('task_type')) row.task_type = task_type
        if (cols.includes('title')) row.title = task_type.replace(/_/g,' ')
        if (cols.includes('status')) row.status = 'pending'
        if (cols.includes('scheduled_at')) row.scheduled_at = new Date(Date.now()+86400000*taskTypes.indexOf(task_type)+1).toISOString()
        if (cols.includes('created_at')) row.created_at = new Date().toISOString()
        const { error } = await admin.from('navigator_tasks').insert(row)
        if (error) console.log('  task error:', error.message)
      }
      console.log('  ✓ navigator tasks seeded')
    } else {
      console.log('  nav:', nav?.email, '| mem:', mem?.email)
    }
  }

  // ── 4. profiles (TC-M016) ────────────────────────────────────────────────
  console.log('4. Seeding member profile...')
  const { data: profSample, error: profErr } = await admin.from('profiles').select('*').limit(1)
  if (profErr) {
    console.log('  profiles error:', profErr.message)
    // Try members table
    const { data: memSample, error: memErr } = await admin.from('members').select('*').limit(1)
    if (memErr) console.log('  members table error:', memErr.message)
    else console.log('  members table cols:', memSample?.[0] ? Object.keys(memSample[0]).join(', ') : 'empty')
  } else {
    const cols = profSample?.[0] ? Object.keys(profSample[0]) : []
    console.log('  profiles columns:', cols.join(', ') || 'empty')
    const { data: { users } } = await admin.auth.admin.listUsers()
    const mem = users.find(u => u.email === 'member@test.com')
    if (mem) {
      const row: Record<string,unknown> = { id: mem.id }
      if (cols.includes('full_name')) row.full_name = 'Test Member'
      if (cols.includes('name')) row.name = 'Test Member'
      if (cols.includes('zip_code')) row.zip_code = '94102'
      if (cols.includes('zip')) row.zip = '94102'
      if (cols.includes('plan')) row.plan = 'complete'
      if (cols.includes('plan_tier')) row.plan_tier = 'complete'
      const { error } = await admin.from('profiles').upsert(row, { onConflict: 'id' })
      if (error) console.log('  profile upsert error:', error.message)
      else console.log('  ✓ profile seeded')
    }
  }

  console.log('\nDone.')
}

seed().catch(console.error)
