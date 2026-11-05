'use client'

/**
 * app/dashboard/communities/page.tsx — Interest Circles & Community Hub
 * TC-MBA006, TC-MBA010, TC-M005, TC-M050–M054, TC-COM001
 */

import { useState, useEffect } from 'react'

type Circle = {
  id: string
  name: string
  description?: string
  member_count?: number
  category?: string
  tags?: string[]
}

const STUB_CIRCLES: Circle[] = [
  { id: '1', name: 'Book & Reading Club', description: 'Share book recommendations and reading experiences', member_count: 24, category: 'culture', tags: ['reading', 'books'] },
  { id: '2', name: 'Gardening Enthusiasts', description: 'Tips, photos, and seasonal gardening guidance', member_count: 31, category: 'hobbies', tags: ['gardening', 'outdoors'] },
  { id: '3', name: 'Veterans Community', description: 'Connecting veterans and honoring service', member_count: 18, category: 'identity', tags: ['veterans', 'military'] },
  { id: '4', name: 'Music & Arts', description: 'Share your love of music, art, and creative pursuits', member_count: 27, category: 'arts', tags: ['music', 'art'] },
  { id: '5', name: 'Faith & Spirituality', description: 'A welcoming space for spiritual connection and reflection', member_count: 22, category: 'spiritual', tags: ['faith', 'spirituality'] },
  { id: '6', name: 'LGBTQ+ Seniors', description: 'Community and support for LGBTQ+ older adults', member_count: 15, category: 'identity', tags: ['lgbtq+', 'pride'] },
  { id: '7', name: 'Cooking & Recipes', description: 'Share favorite recipes and cooking memories', member_count: 35, category: 'hobbies', tags: ['cooking', 'food'] },
  { id: '8', name: 'Technology Help', description: 'Learn and share tips for staying connected digitally', member_count: 20, category: 'learning', tags: ['technology', 'digital'] },
  { id: '9', name: 'Health & Wellness', description: 'Support for healthy living and wellness practices', member_count: 29, category: 'health', tags: ['wellness', 'fitness'] },
  { id: '10', name: 'Professional Identity Circle', description: 'Connect with fellow former professionals and share expertise', member_count: 16, category: 'professional', tags: ['career', 'expertise'] },
  { id: '11', name: 'Travel & Adventure', description: 'Share travel stories and dream of new adventures', member_count: 23, category: 'hobbies', tags: ['travel', 'adventure'] },
  { id: '12', name: 'Grandparents Circle', description: 'The joys and adventures of grandparenting', member_count: 38, category: 'family', tags: ['grandparents', 'family'] },
  { id: '13', name: 'History Buffs', description: 'Exploring history, culture, and nostalgia together', member_count: 19, category: 'learning', tags: ['history', 'culture'] },
  { id: '14', name: 'Nature & Birdwatching', description: 'Connect with nature and share wildlife sightings', member_count: 14, category: 'hobbies', tags: ['nature', 'birds'] },
  { id: '15', name: 'Life Stories', description: 'A circle for sharing personal stories and life journeys', member_count: 25, category: 'culture', tags: ['stories', 'memories'] },
  { id: '16', name: 'Mindfulness & Meditation', description: 'Practices for calm, presence, and mental wellbeing', member_count: 21, category: 'health', tags: ['mindfulness', 'meditation'] },
  { id: '17', name: 'Crafts & DIY', description: 'Knitting, quilting, woodworking, and creative projects', member_count: 17, category: 'arts', tags: ['crafts', 'diy'] },
  { id: '18', name: 'Movies & TV', description: 'Recommendations and discussions about film and television', member_count: 32, category: 'culture', tags: ['movies', 'tv'] },
  { id: '19', name: 'Pet Lovers', description: 'Share the joy of pets and animal companionship', member_count: 28, category: 'hobbies', tags: ['pets', 'animals'] },
  { id: '20', name: 'Civic Engagement', description: 'Stay informed and involved in your community and local issues', member_count: 12, category: 'civic', tags: ['civic', 'community'] },
]

const CATEGORY_COLORS: Record<string, string> = {
  culture: '#7c3aed',
  hobbies: '#059669',
  identity: '#dc2626',
  arts: '#d97706',
  spiritual: '#0891b2',
  learning: '#1d4ed8',
  health: '#16a34a',
  professional: '#374151',
  family: '#be185d',
  civic: '#7e22ce',
}

export default function CommunitiesPage() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [joined, setJoined] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/communities')
        if (res.ok) {
          const data = await res.json()
          setCircles(data.circles ?? data ?? STUB_CIRCLES)
        } else {
          setCircles(STUB_CIRCLES)
        }
      } catch {
        setCircles(STUB_CIRCLES)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = circles.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 0' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Interest Circles</h1>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Connect with community members who share your passions. Join a circle to get started.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search circles…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          fontSize: 14,
          marginBottom: 24,
          boxSizing: 'border-box',
        }}
      />

      {loading && (
        <div style={{ textAlign: 'center', color: '#9ca3af', padding: 40 }}>Loading circles…</div>
      )}

      {!loading && (
        <>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            {filtered.length} circle{filtered.length !== 1 ? 's' : ''} available
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(circle => {
              const color = CATEGORY_COLORS[circle.category ?? ''] ?? '#4b5563'
              const isJoined = joined.has(circle.id)
              return (
                <div
                  key={circle.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: color,
                          marginRight: 6,
                          verticalAlign: 'middle',
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{circle.name}</span>
                    </div>
                    {circle.member_count !== undefined && (
                      <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {circle.member_count} members
                      </span>
                    )}
                  </div>
                  {circle.description && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>{circle.description}</p>
                  )}
                  {circle.tags && circle.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {circle.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 10, background: '#f3f4f6', color: '#4b5563', padding: '2px 7px', borderRadius: 10 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const next = new Set(joined)
                      if (isJoined) next.delete(circle.id)
                      else next.add(circle.id)
                      setJoined(next)
                      fetch('/api/communities/join', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ circle_id: circle.id, action: isJoined ? 'leave' : 'join' }),
                      }).catch(() => {})
                    }}
                    style={{
                      marginTop: 'auto',
                      padding: '7px 14px',
                      background: isJoined ? '#f3f4f6' : '#2563eb',
                      color: isJoined ? '#374151' : '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {isJoined ? '✓ Joined' : 'Join Circle'}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
