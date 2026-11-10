import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const SEED_CIRCLES = [
  { name: 'Morning Walkers', emoji: '🚶', members: 42, topic: 'Fitness' },
  { name: 'Book Club', emoji: '📚', members: 28, topic: 'Learning' },
  { name: 'Gardeners Guild', emoji: '🌱', members: 35, topic: 'Hobbies' },
  { name: 'Card Games Night', emoji: '🃏', members: 19, topic: 'Games' },
  { name: 'Grief Support Circle', emoji: '💙', members: 14, topic: 'Wellness' },
  { name: 'Tech Help Buddies', emoji: '💻', members: 23, topic: 'Tech' },
  { name: 'Grandparents Connect', emoji: '👴', members: 51, topic: 'Family' },
  { name: 'Cooking Together', emoji: '🍳', members: 33, topic: 'Food' },
  { name: 'Veterans Circle', emoji: '🎖️', members: 27, topic: 'Community' },
  { name: 'Arthritis & Movement', emoji: '🧘', members: 18, topic: 'Health' },
  { name: 'Music & Memory', emoji: '🎵', members: 22, topic: 'Arts' },
  { name: 'Caregiver Support', emoji: '🤝', members: 39, topic: 'Caregiving' },
  { name: 'Nature Photographers', emoji: '📷', members: 16, topic: 'Hobbies' },
  { name: 'Faith & Spirit', emoji: '🙏', members: 44, topic: 'Spirituality' },
  { name: 'Puzzle Masters', emoji: '🧩', members: 21, topic: 'Games' },
  { name: 'Travel Stories', emoji: '✈️', members: 37, topic: 'Culture' },
  { name: 'Financial Wellness', emoji: '💰', members: 15, topic: 'Finance' },
  { name: 'Dance & Movement', emoji: '💃', members: 29, topic: 'Fitness' },
  { name: 'Pet Lovers', emoji: '🐾', members: 48, topic: 'Pets' },
  { name: 'Language Exchange', emoji: '🌍', members: 11, topic: 'Learning' },
]

export default async function CommunitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbCircles } = await supabase
    .from('communities')
    .select('id, name, description, member_count, category')
    .order('member_count', { ascending: false })
    .limit(50)

  const circles = (dbCircles && dbCircles.length >= 20)
    ? dbCircles.map((c: any) => ({ name: c.name, emoji: '👥', members: c.member_count ?? 0, topic: c.category ?? 'Community' }))
    : SEED_CIRCLES

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/dashboard" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Dashboard</Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>Community Circles</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>Connect with people who share your interests. Join a circle to get started.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {circles.map((c, i) => (
          <div key={i} data-community-circle style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer' }}>
            <div style={{ fontSize: '1.6rem' }}>{c.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '0.9rem', lineHeight: 1.3 }}>{c.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>{c.members} members · {c.topic}</div>
            </div>
            <button style={{ padding: '7px 0', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Join circle
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
