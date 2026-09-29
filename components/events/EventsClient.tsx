'use client'

import { useState } from 'react'
import type { EventWithRsvp } from '@/lib/data/events'

const FORMAT_LABELS: Record<string, string> = {
  phone_only: 'Phone only',
  video_or_phone: 'Video or phone',
  in_person: 'In person',
}

const FORMAT_COLORS: Record<string, string> = {
  phone_only: '#1A7A6A',
  video_or_phone: '#2A5298',
  in_person: '#7C3AED',
}

function isToday(dateStr: string) {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

function formatEventDate(dateStr: string, timeStr: string, _timezone: string) {
  const [year, monthNum, dayNum] = dateStr.split('-').map(Number)
  // Use UTC constructor so day-of-week is timezone-independent (no server/client mismatch)
  const d = new Date(Date.UTC(year, monthNum - 1, dayNum))
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  let out = `${dayNames[d.getUTCDay()]}, ${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    out += ` at ${hour12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return out
}

interface Props {
  initialEvents: EventWithRsvp[]
}

export default function EventsClient({ initialEvents }: Props) {
  const [events, setEvents] = useState<EventWithRsvp[]>(initialEvents)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [waitlistedIds, setWaitlistedIds] = useState<Set<string>>(new Set())
  const [liveZip, setLiveZip] = useState('')
  const [liveZip, setLiveZip] = useState('')
  const [liveEvents, setLiveEvents] = useState<Array<{title:string;date:string;location:string;description:string;url:string;score:number;category:string}>>([])
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveError, setLiveError] = useState<string|null>(null)
  const [liveCached, setLiveCached] = useState(false)

  async function handleSearchEvents() {
    const z = liveZip.trim()
    if (z.length === 0) return
    setLiveLoading(true)
    setLiveError(null)
    try {
      const res = await fetch('/api/events/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'cultural', zip: z, radius: 25 }),
      })
      if (res.ok === false) throw new Error('Search failed (' + res.status + ')')
      const json = await res.json()
      setLiveEvents(json.events ?? [])
      setLiveCached(json.cached ?? false)
    } catch(e) {
      setLiveError(e instanceof Error ? e.message : String(e))
    } finally {
      setLiveLoading(false)
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 4000)
  }

  async function handleRsvp(eventId: string, action: 'rsvp' | 'cancel' | 'join_waitlist' | 'leave_waitlist') {
    setLoadingId(eventId)
    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, action }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        // Event full — offer the waitlist instead of a dead end.
        if (data.full && action === 'rsvp') {
          showToast('This event is full — you can join the waitlist and we\'ll notify you if a spot opens.')
        } else {
          showToast(data.error || 'Could not complete action. Please try again.')
        }
        return
      }

      if (action === 'join_waitlist') {
        setWaitlistedIds(prev => new Set([...prev, eventId]))
        showToast('You\'re on the waitlist. We\'ll notify you if a spot opens up.')
        return
      }
      if (action === 'leave_waitlist') {
        setWaitlistedIds(prev => { const n = new Set(prev); n.delete(eventId); return n })
        showToast('Removed from the waitlist.')
        return
      }

      setEvents(prev => prev.map(evt => {
        if (evt.id !== eventId) return evt
        return {
          ...evt,
          user_has_rsvped: action === 'rsvp',
          rsvp_count: action === 'rsvp' ? evt.rsvp_count + 1 : Math.max(0, evt.rsvp_count - 1),
        }
      }))

      showToast(action === 'rsvp' ? 'You\'re going! Details are shown below.' : 'RSVP cancelled.')
    } finally {
      setLoadingId(null)
    }
  }

  const todayEvents = events.filter(e => isToday(e.event_date))
  const upcomingEvents = events.filter(e => !isToday(e.event_date))

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          backgroundColor: '#1A7A6A', color: 'white',
          padding: '14px 20px', borderRadius: '10px',
          fontFamily: 'var(--font-body)', fontSize: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {toastMsg}
        </div>
      )}

      {/* Today's events */}
      {todayEvents.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-secondary)', textTransform: 'uppercase',
            letterSpacing: '0.06em', margin: '0 0 16px',
          }}>Happening Today</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayEvents.map(evt => <EventCard key={evt.id} evt={evt} isToday={true} loadingId={loadingId} onRsvp={handleRsvp} isWaitlisted={waitlistedIds.has(evt.id)} />)}
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
            color: 'var(--color-text-secondary)', textTransform: 'uppercase',
            letterSpacing: '0.06em', margin: '0 0 16px',
          }}>Upcoming Events</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {upcomingEvents.map(evt => <EventCard key={evt.id} evt={evt} isToday={false} loadingId={loadingId} onRsvp={handleRsvp} isWaitlisted={waitlistedIds.has(evt.id)} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div style={{
          backgroundColor: 'white', borderRadius: '16px', padding: '48px 32px',
          textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '22px',
            color: 'var(--color-navy)', margin: '0 0 10px',
          }}>No upcoming events</p>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '16px',
            color: 'var(--color-text-secondary)', margin: 0,
          }}>Check back soon — new events are added regularly by your care team.</p>
        </div>
      )}

      {/* Live community event search */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{
          fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
          color: 'var(--color-text-secondary)', textTransform: 'uppercase',
          letterSpacing: '0.06em', margin: '0 0 16px',
        }}>Find Events Near You</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Enter zip code"
            value={liveZip}
            onChange={e => setLiveZip(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearchEvents() }}
            maxLength={10}
            style={{
              padding: '10px 14px', borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontFamily: 'var(--font-body)', fontSize: '15px', width: '140px',
            }}
          />
          <button
            onClick={handleSearchEvents}
            disabled={liveLoading}
            style={{
              backgroundColor: 'var(--color-teal)', color: 'white',
              border: 'none', borderRadius: '8px', padding: '10px 20px',
              fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
              cursor: liveLoading ? 'not-allowed' : 'pointer',
              opacity: liveLoading ? 0.6 : 1,
            }}
          >{liveLoading ? 'Searching…' : 'Search'}</button>
        </div>
        {liveError && (
          <p style={{ color: '#c0392b', fontFamily: 'var(--font-body)', fontSize: '14px' }}>{liveError}</p>
        )}
        {liveCached && liveEvents.length > 0 && (
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)', fontSize: '12px', marginBottom: '12px' }}>Showing cached results</p>
        )}
        {liveEvents.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {liveEvents.map((evt, i) => (
              <div key={i} style={{
                backgroundColor: 'white', borderRadius: '16px', padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--color-navy)', margin: '0 0 6px', fontWeight: 600 }}>{evt.title}</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{'📅'} {evt.date}</p>
                {evt.location && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>{'📍'} {evt.location}</p>}
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', margin: '0 0 12px' }}>{evt.description}</p>
                {evt.url && (
                  <a href={evt.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block', backgroundColor: 'var(--color-teal)', color: 'white',
                    borderRadius: '8px', padding: '8px 16px',
                    fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none',
                  }}>View Event</a>
                )}
              </div>
            ))}
          </div>
        )}
        {liveLoading === false && liveEvents.length === 0 && liveZip.length > 0 && liveError === null && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>No events found near {liveZip}. Try a nearby zip code.</p>
        )}
      </div>
    </div>
  )
}

function EventCard({
  evt, isToday, loadingId, onRsvp, isWaitlisted,
}: {
  evt: EventWithRsvp
  isToday: boolean
  loadingId: string | null
  onRsvp: (id: string, action: 'rsvp' | 'cancel' | 'join_waitlist' | 'leave_waitlist') => void
  isWaitlisted: boolean
}) {
  const isLoading = loadingId === evt.id
  const formatColor = FORMAT_COLORS[evt.format] ?? '#333'
  const isFull = !!evt.max_capacity && evt.rsvp_count >= evt.max_capacity

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      padding: '24px',
      border: evt.user_has_rsvped ? '2px solid var(--color-teal)' : '1px solid var(--color-border)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500,
          color: 'var(--color-navy)', margin: 0, flex: 1,
        }}>{evt.title}</h3>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600,
          padding: '4px 10px', borderRadius: '12px',
          backgroundColor: formatColor + '18',
          color: formatColor,
          whiteSpace: 'nowrap',
        }}>{FORMAT_LABELS[evt.format] ?? evt.format}</span>
      </div>

      {/* Date/time */}
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: '15px',
        color: 'var(--color-text-secondary)', margin: '0 0 6px',
      }}>
        {isToday
          ? <strong style={{ color: '#D97706' }}>Today </strong>
          : null}
        {formatEventDate(evt.event_date, evt.event_time, evt.timezone)}
      </p>

      {/* Host */}
      {evt.host_name && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '14px',
          color: 'var(--color-text-secondary)', margin: '0 0 10px',
        }}>Hosted by {evt.host_name}</p>
      )}

      {/* Description */}
      {evt.description && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '15px',
          color: 'var(--color-text-primary)', lineHeight: 1.5, margin: '0 0 16px',
        }}>{evt.description}</p>
      )}

      {/* RSVP section */}
      {!evt.user_has_rsvped ? (
        isFull ? (
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: '#B45309', margin: '0 0 10px' }}>
              This event is full.
            </p>
            {isWaitlisted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-teal)', fontWeight: 600 }}>
                  ✓ You&apos;re on the waitlist — we&apos;ll notify you if a spot opens.
                </span>
                <button onClick={() => onRsvp(evt.id, 'leave_waitlist')} disabled={isLoading}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 14px', fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  Leave waitlist
                </button>
              </div>
            ) : (
              <button onClick={() => onRsvp(evt.id, 'join_waitlist')} disabled={isLoading}
                style={{ backgroundColor: 'var(--color-navy)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 24px', fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, minHeight: '48px' }}>
                {isLoading ? 'Please wait…' : 'Join the waitlist'}
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onRsvp(evt.id, 'rsvp')}
            disabled={isLoading}
            style={{
              backgroundColor: isToday ? 'var(--color-navy)' : 'var(--color-teal)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '12px 24px', fontFamily: 'var(--font-body)', fontSize: '16px',
              fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1, minHeight: '48px',
            }}
          >
            {isLoading ? 'Please wait…' : isToday ? 'Join Now' : 'RSVP'}
          </button>
        )
      ) : (
        <div>
          {/* Confirmed banner */}
          <div style={{
            backgroundColor: 'var(--color-teal)', color: 'white',
            borderRadius: '12px', padding: '16px 20px', marginBottom: '12px',
          }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 600,
              margin: '0 0 8px',
            }}>✓ {isToday ? 'Ready to join!' : 'You\'re going!'}</p>

            {/* Phone details */}
            {(evt.format === 'phone_only' || evt.format === 'video_or_phone') && evt.dial_in_number && (
              <div>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>
                  📞 {evt.dial_in_number}
                </p>
                {evt.dial_in_code && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', margin: 0 }}>
                    Enter code: <strong>{evt.dial_in_code}</strong> when prompted. That&apos;s it.
                  </p>
                )}
              </div>
            )}

            {/* Video link */}
            {evt.format === 'video_or_phone' && evt.video_link && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', margin: '8px 0 0' }}>
                Video option: <a href={evt.video_link} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'underline' }}>Join by video</a>
              </p>
            )}

            {/* In-person address */}
            {evt.format === 'in_person' && evt.location_address && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', margin: 0 }}>
                📍 {evt.location_address}
              </p>
            )}
          </div>

          <button
            onClick={() => onRsvp(evt.id, 'cancel')}
            disabled={isLoading}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px', padding: '8px 16px',
              fontFamily: 'var(--font-body)', fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            Cancel RSVP
          </button>
        </div>
      )}

      {/* RSVP count */}
      {evt.rsvp_count > 0 && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '13px',
          color: 'var(--color-text-secondary)', margin: '12px 0 0',
        }}>
          {evt.rsvp_count} {evt.rsvp_count === 1 ? 'person' : 'people'} attending
        </p>
      )}
    </div>
  )
}
