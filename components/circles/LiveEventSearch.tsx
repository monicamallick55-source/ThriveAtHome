'use client'
// FEATURE-002/003 — location-aware live event search (Google Custom Search +
// Claude relevance scoring) for Cultural Programming and Cultural Festivals.
// Session-only location override — never writes back to the member's profile.
import { useCallback, useEffect, useState } from 'react'

interface LiveEvent {
  title: string
  date: string
  location: string
  description: string
  url: string
  score: number
  category: string
}

type Attendance = Record<string, { count: number; going: boolean }>

interface Props {
  category: 'cultural' | 'festival'
  initialZip: string | null
}

const RADII = [5, 10, 25, 50]

const card: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
  boxShadow: 'var(--shadow-card)',
}

const inputStyle: React.CSSProperties = {
  height: '44px',
  border: '1.5px solid var(--color-warm-grey)',
  borderRadius: '8px',
  padding: '0 12px',
  fontSize: '16px',
  fontFamily: 'var(--font-body)',
  backgroundColor: 'white',
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  height: '44px',
  padding: '0 20px',
  backgroundColor: 'var(--color-teal)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  cursor: 'pointer',
}

export default function LiveEventSearch({ category, initialZip }: Props) {
  const [zip, setZip] = useState(initialZip ?? '')
  const [zipInput, setZipInput] = useState(initialZip ?? '')
  const [radius, setRadius] = useState(25)
  const [editingLocation, setEditingLocation] = useState(!initialZip)
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [attendance, setAttendance] = useState<Attendance>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [rsvpPending, setRsvpPending] = useState<string | null>(null)

  const runSearch = useCallback(async (searchZip: string, searchRadius: number) => {
    if (!/^\d{5}$/.test(searchZip)) {
      setError('Please enter a valid 5-digit zip code.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/events/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, zip: searchZip, radius: searchRadius }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'We could not load events right now.')
        setEvents([])
      } else {
        setEvents(json.events ?? [])
        setAttendance(json.attendance ?? {})
        setZip(json.zip ?? searchZip)
      }
    } catch (e) {
      console.error('[LiveEventSearch] search failed:', e)
      setError('We could not load events right now. Please try again in a moment.')
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }, [category])

  useEffect(() => {
    if (initialZip) void runSearch(initialZip, 25)
    // Only run once on mount — subsequent searches are user-initiated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleLocationSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEditingLocation(false)
    void runSearch(zipInput.trim(), radius)
  }

  async function handleGoing(event: LiveEvent) {
    const current = attendance[event.url] ?? { count: 0, going: false }
    setRsvpPending(event.url)
    try {
      const res = await fetch('/api/events/live-rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: event.url,
          title: event.title,
          date: event.date,
          action: current.going ? 'leave' : 'join',
        }),
      })
      const json = await res.json()
      if (res.ok) {
        setAttendance((prev) => ({ ...prev, [event.url]: { count: json.count, going: json.going } }))
      }
    } catch (e) {
      console.error('[LiveEventSearch] RSVP failed:', e)
    } finally {
      setRsvpPending(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        {!editingLocation && zip && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
            📍 Showing events near {zip}, within {radius} miles
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditingLocation((v) => !v)}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-teal)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {editingLocation ? 'Cancel' : 'Change location'}
        </button>
      </div>

      {editingLocation && (
        <form onSubmit={handleLocationSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            placeholder="Zip code"
            maxLength={5}
            style={{ ...inputStyle, width: '140px' }}
          />
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            style={{ ...inputStyle, width: '160px' }}
          >
            {RADII.map((r) => (
              <option key={r} value={r}>Within {r} miles</option>
            ))}
          </select>
          <button type="submit" style={buttonStyle}>Search</button>
        </form>
      )}

      {loading && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          Looking for events near you…
        </p>
      )}

      {!loading && error && (
        <div style={{ ...card, borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: '#92400E', margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && hasSearched && events.length === 0 && (
        <div style={card}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)', margin: 0 }}>
            No events found near {zip} right now. Try a wider radius or check back soon.
          </p>
        </div>
      )}

      {!loading && events.map((event) => {
        const att = attendance[event.url] ?? { count: 0, going: false }
        return (
          <article key={event.url} style={card}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                {event.title}
              </h3>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--color-teal)' }}>
                {event.date}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
              {event.location}
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '10px 0 0' }}>
              {event.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-teal)' }}
              >
                Learn more →
              </a>
              {category === 'festival' && (
                <button
                  type="button"
                  onClick={() => handleGoing(event)}
                  disabled={rsvpPending === event.url}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px',
                    fontWeight: 600,
                    padding: '8px 14px',
                    borderRadius: '999px',
                    cursor: rsvpPending === event.url ? 'default' : 'pointer',
                    border: `1.5px solid var(--color-teal)`,
                    backgroundColor: att.going ? 'var(--color-teal)' : 'white',
                    color: att.going ? 'white' : 'var(--color-teal)',
                    opacity: rsvpPending === event.url ? 0.6 : 1,
                  }}
                >
                  {att.going ? "✓ I'm going" : "I'm going"}
                  {att.count > 0 ? ` (${att.count})` : ''}
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
