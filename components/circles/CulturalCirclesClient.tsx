'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { CulturalCircle, CircleEvent } from '@/lib/data/circles'
import type { LocalEventSuggestion } from '@/lib/interfaces/AiProvider'

const LANGUAGE_LABELS: Record<string, string> = {
  spanish: 'Español',
  mandarin: '中文',
  vietnamese: 'Tiếng Việt',
  korean: '한국어',
  hindi: 'हिन्दी',
  tagalog: 'Tagalog',
  arabic: 'العربية',
  polish: 'Polski',
  english: 'English',
}

const CIRCLE_COLORS = [
  '#E8401C', '#1E6B9E', '#2A8A5E', '#8A4A2E',
  '#6A3D9A', '#D4880E', '#C74B8A', '#1A7A6A',
  '#5A2D82', '#C04A1A', '#2A6E3A', '#9A1A3A',
]

interface Props {
  circles: CulturalCircle[]
  joinedCircleIds: string[]
  platformEvents: CircleEvent[]
  localEventSuggestions: LocalEventSuggestion[]
  hasMember: boolean
  memberTopics?: string[]
}

function formatEventDate(dateStr: string, timeStr: string | null): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']
  let out = `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`
  if (timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 === 0 ? 12 : h % 12
    out += ` at ${hour12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return out
}

const SOURCE_COLORS: Record<string, string> = {
  Meetup: '#ED1C40',
  Eventbrite: '#F05537',
  Local: '#2A8A5E',
}

export default function CulturalCirclesClient({ circles, joinedCircleIds, platformEvents, localEventSuggestions, hasMember, memberTopics = [] }: Props) {
  const [joined, setJoined] = useState<Set<string>>(new Set(joinedCircleIds))
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [platformRsvped, setPlatformRsvped] = useState<Set<string>>(
    new Set(platformEvents.filter(e => e.user_has_rsvped).map(e => e.id))
  )
  const [platformRsvpLoading, setPlatformRsvpLoading] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleJoin = async (circleId: string, circleName: string) => {
    setLoadingId(circleId)
    try {
      const res = await fetch('/api/circles/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId }),
      })
      if (res.ok) {
        startTransition(() => {
          setJoined(prev => new Set([...prev, circleId]))
        })
        showToast(`Joined ${circleName}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handlePlatformRsvp = async (eventId: string, cancel: boolean) => {
    setPlatformRsvpLoading(eventId)
    try {
      const res = await fetch('/api/circles/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, cancel }),
      })
      if (res.ok) {
        setPlatformRsvped(prev => {
          const next = new Set(prev)
          if (cancel) next.delete(eventId)
          else next.add(eventId)
          return next
        })
        showToast(cancel ? 'RSVP cancelled' : 'RSVP confirmed!')
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = (data as { error?: string }).error
        if (msg === 'No member linked') {
          showToast('Set up your family member profile to RSVP to events.')
        } else {
          showToast(`Could not complete RSVP. Please try again.`)
        }
      }
    } finally {
      setPlatformRsvpLoading(null)
    }
  }

  const handleLeave = async (circleId: string, circleName: string) => {
    setLoadingId(circleId)
    try {
      const res = await fetch('/api/circles/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circleId }),
      })
      if (res.ok) {
        startTransition(() => {
          setJoined(prev => {
            const next = new Set(prev)
            next.delete(circleId)
            return next
          })
        })
        showToast(`Left ${circleName}`)
      }
    } finally {
      setLoadingId(null)
    }
  }

  const joinedCircles = circles.filter(c => joined.has(c.id))
  const otherCircles = circles.filter(c => !joined.has(c.id))

  // Recommended: match interest_tag against member's topics_enjoy (case-insensitive)
  const memberTopicsLower = memberTopics.map(t => t.toLowerCase())
  const interestMatches = otherCircles.filter(c =>
    c.interest_tag && memberTopicsLower.includes(c.interest_tag.toLowerCase())
  )
  // Fallback to most popular by member_count if fewer than 2 interest matches
  const popularFallback = otherCircles
    .filter(c => !interestMatches.find(m => m.id === c.id))
    .sort((a, b) => b.member_count - a.member_count)
  const recommended = [...interestMatches, ...popularFallback].slice(0, 3)

  const CircleCard = ({ circle, colorIndex }: { circle: CulturalCircle; colorIndex: number }) => {
    const isJoined = joined.has(circle.id)
    const isLoading = loadingId === circle.id
    const accentColor = CIRCLE_COLORS[colorIndex % CIRCLE_COLORS.length]
    const langLabel = LANGUAGE_LABELS[circle.primary_language] ?? circle.primary_language

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        border: isJoined ? `2px solid ${accentColor}` : '2px solid transparent',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Color header bar */}
        <div style={{
          height: '6px',
          backgroundColor: accentColor,
        }} />
        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 500,
              color: 'var(--color-navy)',
              margin: 0,
              lineHeight: 1.3,
            }}>
              {circle.circle_name}
            </h3>
            {isJoined && (
              <span style={{
                backgroundColor: accentColor + '20',
                color: accentColor,
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                marginLeft: '8px',
              }}>Joined</span>
            )}
          </div>

          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginBottom: '10px',
            display: 'block',
          }}>
            {langLabel} · {circle.member_count} {circle.member_count === 1 ? 'member' : 'members'}
          </span>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            color: 'var(--color-text-primary)',
            lineHeight: 1.55,
            margin: 0,
            flex: 1,
          }}>
            {circle.description}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <Link
              href={`/dashboard/communities/${circle.id}`}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '9px 14px',
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--color-navy)',
                backgroundColor: 'var(--color-cream)',
                textDecoration: 'none',
                border: '1px solid var(--color-warm-grey)',
                transition: 'background-color 0.15s',
              }}
            >
              View circle
            </Link>
            <button
              onClick={() => isJoined ? handleLeave(circle.id, circle.circle_name) : handleJoin(circle.id, circle.circle_name)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '10px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isLoading ? 'wait' : 'pointer',
                border: `1px solid ${accentColor}`,
                backgroundColor: isJoined ? 'white' : accentColor,
                color: isJoined ? accentColor : 'white',
                transition: 'all 0.15s',
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? '...' : isJoined ? 'Leave' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const allCirclesWithIndex = circles.map((c, i) => ({ circle: c, index: i }))
  const joinedWithIndex = allCirclesWithIndex.filter(({ circle }) => joined.has(circle.id))

  // Split unjoined circles by community_type for separate sections
  const unjoinedCultural = allCirclesWithIndex.filter(
    ({ circle }) => !joined.has(circle.id) && circle.community_type !== 'interest'
  )
  const unjoinedInterest = allCirclesWithIndex.filter(
    ({ circle }) => !joined.has(circle.id) && circle.community_type === 'interest'
  )

  return (
    <div style={{ flex: 1, padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--color-navy)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            {toast}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 500,
            color: 'var(--color-navy)',
            margin: '0 0 8px',
            letterSpacing: '-0.01em',
          }}>
            Communities
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Connect with others who share your heritage, language, traditions, and interests.
          </p>
        </div>

        {/* Navigation pills — jump to the festival calendar and live programming */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px',
        }}>
          <Link href="/dashboard/cultural-festivals" style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
            color: 'var(--color-navy)', textDecoration: 'none',
            border: '1.5px solid var(--color-warm-grey)', borderRadius: '999px', padding: '8px 16px',
          }}>
            📅 Cultural festival calendar
          </Link>
          <Link href="/dashboard/cultural-programming" style={{
            fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
            color: 'var(--color-navy)', textDecoration: 'none',
            border: '1.5px solid var(--color-warm-grey)', borderRadius: '999px', padding: '8px 16px',
          }}>
            🎎 Classes, potlucks &amp; story circles
          </Link>
        </div>

        {/* Recommended for you — shown when member hasn't joined everything */}
        {hasMember && recommended.length > 0 && joinedCircles.length < circles.length && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
              color: 'var(--color-text-secondary)', textTransform: 'uppercase',
              letterSpacing: '0.06em', margin: '0 0 4px',
            }}>Recommended for You</h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '14px',
              color: 'var(--color-text-secondary)', margin: '0 0 16px',
            }}>
              Communities that match your interests.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {recommended.map(circle => {
                const index = circles.findIndex(c => c.id === circle.id)
                return <CircleCard key={circle.id} circle={circle} colorIndex={index >= 0 ? index : 0} />
              })}
            </div>
          </div>
        )}

        {/* Community Events — platform-wide, visible to all members */}
        {platformEvents.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
              color: 'var(--color-text-secondary)', textTransform: 'uppercase',
              letterSpacing: '0.06em', margin: '0 0 16px',
            }}>Community Events</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {platformEvents.map(event => {
                const rsvped = platformRsvped.has(event.id)
                const isLoading = platformRsvpLoading === event.id
                return (
                  <div key={event.id} style={{
                    backgroundColor: 'white', borderRadius: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px',
                    borderLeft: rsvped ? '4px solid var(--color-teal)' : '4px solid transparent',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    flexWrap: 'wrap', gap: '16px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500,
                        color: 'var(--color-navy)', margin: '0 0 4px',
                      }}>{event.title}</h3>
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px',
                        color: 'var(--color-text-secondary)', margin: '0 0 6px',
                      }}>
                        {formatEventDate(event.event_date, event.event_time)}
                        {' · '}{event.format === 'phone' ? 'Phone only' : event.format === 'video' ? 'Video or phone' : 'In-person'}
                        {' · '}{event.rsvp_count} going
                      </p>
                      {event.description && (
                        <p style={{
                          fontFamily: 'var(--font-body)', fontSize: '14px',
                          color: 'var(--color-text-primary)', margin: '0 0 8px', lineHeight: 1.5,
                        }}>{event.description}</p>
                      )}
                      {rsvped && event.format !== 'in_person' && event.dial_in_number && (
                        <div style={{
                          backgroundColor: 'var(--color-teal)10', border: '1px solid var(--color-teal)30',
                          borderRadius: '10px', padding: '10px 14px', marginTop: '8px',
                        }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
                            Call <strong>{event.dial_in_number}</strong>
                            {event.dial_in_code && <> and enter <strong>{event.dial_in_code}</strong> when prompted</>}.
                            That&apos;s it.
                          </p>
                        </div>
                      )}
                      {rsvped && event.format === 'in_person' && event.location_address && (
                        <div style={{
                          backgroundColor: 'var(--color-teal)10', border: '1px solid var(--color-teal)30',
                          borderRadius: '10px', padding: '10px 14px', marginTop: '8px',
                        }}>
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
                            <strong>Location:</strong> {event.location_address}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handlePlatformRsvp(event.id, rsvped)}
                      disabled={isLoading}
                      style={{
                        padding: '9px 18px', borderRadius: '10px',
                        fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                        cursor: isLoading ? 'wait' : 'pointer',
                        border: '1px solid var(--color-teal)',
                        backgroundColor: rsvped ? 'white' : 'var(--color-teal)',
                        color: rsvped ? 'var(--color-teal)' : 'white',
                        opacity: isLoading ? 0.7 : 1, whiteSpace: 'nowrap',
                      }}
                    >
                      {isLoading ? '...' : rsvped ? 'Cancel RSVP' : 'RSVP'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Events Near You — AI stub suggestions */}
        {localEventSuggestions.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600,
              color: 'var(--color-text-secondary)', textTransform: 'uppercase',
              letterSpacing: '0.06em', margin: '0 0 4px',
            }}>Events Near You</h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '14px',
              color: 'var(--color-text-secondary)', margin: '0 0 16px',
            }}>
              Community events from local organizations that may interest you.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {localEventSuggestions.map((evt, i) => (
                <div key={i} style={{
                  backgroundColor: 'white', borderRadius: '14px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)', padding: '18px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 500,
                      color: 'var(--color-navy)', margin: 0, lineHeight: 1.3, flex: 1,
                    }}>{evt.title}</h3>
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600,
                      padding: '2px 8px', borderRadius: '10px', whiteSpace: 'nowrap', marginLeft: '8px',
                      backgroundColor: (SOURCE_COLORS[evt.source] ?? '#666') + '15',
                      color: SOURCE_COLORS[evt.source] ?? '#666',
                    }}>{evt.source}</span>
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    color: 'var(--color-text-secondary)', margin: '0 0 4px',
                  }}>{evt.date}</p>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    color: 'var(--color-text-secondary)', margin: '0 0 10px',
                  }}>{evt.location}</p>
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: '14px',
                    color: 'var(--color-text-primary)', lineHeight: 1.5, margin: '0 0 14px', flex: 1,
                  }}>{evt.description}</p>
                  {evt.url && evt.url !== '#' && (
                    <a
                      href={evt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500,
                        color: 'var(--color-teal)', textDecoration: 'none',
                        alignSelf: 'flex-start',
                      }}
                    >
                      Learn more →
                    </a>
                  )}
                  {evt.url === '#' && (
                    <span style={{
                      fontFamily: 'var(--font-body)', fontSize: '13px', fontStyle: 'italic',
                      color: 'var(--color-text-secondary)',
                    }}>
                      Contact your navigator for details
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Communities — pinned joined circles */}
        {joinedWithIndex.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 16px',
            }}>
              Your Communities
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {joinedWithIndex.map(({ circle, index }) => (
                <CircleCard key={circle.id} circle={circle} colorIndex={index} />
              ))}
            </div>
          </div>
        )}

        {/* Cultural & Heritage Communities */}
        {unjoinedCultural.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 6px',
            }}>
              Cultural &amp; Heritage Communities
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '14px',
              color: 'var(--color-text-secondary)', margin: '0 0 16px',
            }}>
              Connect with others who share your cultural heritage, language, and traditions.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {unjoinedCultural.map(({ circle, index }) => (
                <CircleCard key={circle.id} circle={circle} colorIndex={index} />
              ))}
            </div>
          </div>
        )}

        {/* Interest & Hobby Communities */}
        {unjoinedInterest.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '0 0 6px',
            }}>
              Interest &amp; Hobby Communities
            </h2>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '14px',
              color: 'var(--color-text-secondary)', margin: '0 0 16px',
            }}>
              Find others who share your passions and hobbies.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {unjoinedInterest.map(({ circle, index }) => (
                <CircleCard key={circle.id} circle={circle} colorIndex={index} />
              ))}
            </div>
          </div>
        )}

        {circles.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '80px 32px',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: '18px',
          }}>
            Community circles are being set up. Check back soon.
          </div>
        )}
      </div>
    </div>
  )
}
