import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qdniskppkfqjmtpkftdt.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbmlza3Bwa2Zxam10cGtmdGR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc5NjY1NywiZXhwIjoyMDk0MzcyNjU3fQ.93wRuLXqy7B-o3SXLivpm-u88scRmz7OpEoJtsnVT6c'
const admin = createClient(SUPABASE_URL, SERVICE_KEY)

async function seed() {
  const { data: { users } } = await admin.auth.admin.listUsers()
  const nav = users.find(u => u.email === 'navigator@test.com')
  const mem = users.find(u => u.email === 'member@test.com')
  console.log('navigator auth id:', nav?.id)
  console.log('member auth id:', mem?.id)

  // ── 1. Ensure navigator has 'navigator' role in auth metadata ──────────
  console.log('\n1. Set navigator role in auth metadata...')
  if (nav) {
    const { error } = await admin.auth.admin.updateUserById(nav.id, {
      app_metadata: { role: 'navigator' },
      user_metadata: { role: 'navigator' }
    })
    if (error) console.log('  error:', error.message)
    else console.log('  ✓ navigator role set')
  } else {
    console.log('  navigator@test.com not found — creating...')
    const { data, error } = await admin.auth.admin.createUser({
      email: 'navigator@test.com',
      password: 'TestPass123!',
      email_confirm: true,
      app_metadata: { role: 'navigator' },
      user_metadata: { role: 'navigator', full_name: 'Test Navigator' }
    })
    if (error) console.log('  error:', error.message)
    else console.log('  ✓ created:', data.user?.id)
  }

  // ── 2. Ensure member has 'member' role ─────────────────────────────────
  console.log('\n2. Set member role...')
  if (mem) {
    const { error } = await admin.auth.admin.updateUserById(mem.id, {
      app_metadata: { role: 'member' },
      user_metadata: { role: 'member' }
    })
    if (error) console.log('  error:', error.message)
    else console.log('  ✓ member role set')
  }

  // ── 3. Add 20 interest_circles for TC-M005 ────────────────────────────
  console.log('\n3. interest_circles — ensure 20+...')
  const circles = [
    { name: 'Book Club', slug: 'book-club', category: 'learning', cover_emoji: '📚', is_active: true },
    { name: 'Gardening', slug: 'gardening', category: 'hobbies', cover_emoji: '🌱', is_active: true },
    { name: 'Morning Yoga', slug: 'morning-yoga', category: 'fitness', cover_emoji: '🧘', is_active: true },
    { name: 'Tech Help', slug: 'tech-help', category: 'learning', cover_emoji: '💻', is_active: true },
    { name: 'Cooking Together', slug: 'cooking-together', category: 'hobbies', cover_emoji: '🍳', is_active: true },
    { name: 'Music Lovers', slug: 'music-lovers', category: 'arts', cover_emoji: '🎵', is_active: true },
    { name: 'Walking Club', slug: 'walking-club', category: 'fitness', cover_emoji: '🚶', is_active: true },
    { name: 'Art & Crafts', slug: 'art-crafts', category: 'arts', cover_emoji: '🎨', is_active: true },
    { name: 'Grief Support', slug: 'grief-support', category: 'support', cover_emoji: '💙', is_active: true },
    { name: 'Chess Club', slug: 'chess-club', category: 'games', cover_emoji: '♟️', is_active: true },
    { name: 'Movie Nights', slug: 'movie-nights', category: 'entertainment', cover_emoji: '🎬', is_active: true },
    { name: 'Photography', slug: 'photography', category: 'arts', cover_emoji: '📷', is_active: true },
    { name: 'Bible Study', slug: 'bible-study', category: 'spiritual', cover_emoji: '✝️', is_active: true },
    { name: 'Caregivers Circle', slug: 'caregivers-circle', category: 'support', cover_emoji: '🤝', is_active: true },
    { name: 'Veterans Group', slug: 'veterans-group', category: 'community', cover_emoji: '🎖️', is_active: true },
    { name: 'Language Exchange', slug: 'language-exchange', category: 'learning', cover_emoji: '🗣️', is_active: true },
    { name: 'Puzzle Club', slug: 'puzzle-club', category: 'games', cover_emoji: '🧩', is_active: true },
    { name: 'Travel Stories', slug: 'travel-stories', category: 'social', cover_emoji: '✈️', is_active: true },
    { name: 'Pet Lovers', slug: 'pet-lovers', category: 'hobbies', cover_emoji: '🐾', is_active: true },
    { name: 'History Buffs', slug: 'history-buffs', category: 'learning', cover_emoji: '📜', is_active: true },
  ]
  for (const c of circles) {
    const { error } = await admin.from('interest_circles').upsert(c, { onConflict: 'slug', ignoreDuplicates: true })
    if (error) console.log('  error:', c.name, error.message)
  }
  const { count } = await admin.from('interest_circles').select('*', { count: 'exact', head: true })
  console.log('  total circles:', count)

  // ── 4. members profile for member@test.com ────────────────────────────
  console.log('\n4. members profile...')
  if (mem) {
    const { data: existing } = await admin.from('members').select('id').eq('supabase_auth_id', mem.id).single()
    if (!existing) {
      const { error } = await admin.from('members').insert({
        supabase_auth_id: mem.id,
        full_name: 'Test Member',
        email: 'member@test.com',
        plan: 'complete',
        status: 'active',
        zip_code: '94102',
        birth_date: '1952-06-15',
      })
      if (error) console.log('  error:', error.message)
      else console.log('  ✓ members row created')
    } else {
      console.log('  exists:', existing.id)
    }
  }

  console.log('\nSeed v39 done.')
}
seed().catch(console.error)
