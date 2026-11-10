'use client'
import { useEffect, useState } from 'react'

type MoodEntry = {
  id: string
  mood: number
  note?: string
  created_at: string
}

const MOOD_LABELS: Record<number, string> = {
  1: '😔 Low',
  2: '😕 Below average',
  3: '😐 Neutral',
  4: '🙂 Good',
  5: '😊 Great',
}

export default function MoodTimeline({ memberId }: { memberId?: string }) {
  const [moods, setMoods] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = memberId
      ? `/api/mood?member_id=${memberId}&limit=7`
      : `/api/mood?limit=7`
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setMoods(Array.isArray(d) ? d : d.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [memberId])

  if (loading) return <div style={{ color: '#9ca3af', fontSize: '0.82rem', padding: '12px 0' }}>Loading mood history…</div>
  if (moods.length === 0) return (
    <div style={{ color: '#9ca3af', fontSize: '0.82rem', padding: '12px 0' }}>No mood entries yet this week.</div>
  )

  return (
    <div>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Mood This Week</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {moods.map(m => (
          <div key={m.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', minWidth: 80, textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem' }}>{MOOD_LABELS[m.mood]?.split(' ')[0] ?? '😐'}</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 4 }}>
              {new Date(m.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {m.note && <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2, fontStyle: 'italic' }}>{m.note.slice(0, 30)}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
