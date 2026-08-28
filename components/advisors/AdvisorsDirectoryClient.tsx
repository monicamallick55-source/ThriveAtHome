'use client'
// Trusted Advisor Directory — browse, filter, request a warm introduction, review.
// Phase 98 (M24).
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  ADVISOR_TYPES,
  advisorTypeLabel,
  advisorTypeEmoji,
  ADVISOR_CONNECTION_STATUS,
} from '@/lib/advisors/types'
import type { TrustedAdvisorRow, AdvisorConnectionRow } from '@/types/database'

interface ConnectionWithAdvisor extends AdvisorConnectionRow {
  advisor: Pick<TrustedAdvisorRow, 'id' | 'full_name' | 'firm_name' | 'advisor_type' | 'phone' | 'email' | 'city' | 'state'> | null
}

interface Props {
  initialAdvisors: TrustedAdvisorRow[]
  initialConnections: ConnectionWithAdvisor[]
}

const card: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '20px',
  boxShadow: 'var(--shadow-card)',
}

export default function AdvisorsDirectoryClient({ initialAdvisors, initialConnections }: Props) {
  const [advisors] = useState(initialAdvisors)
  const [connections, setConnections] = useState(initialConnections)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [acceptingOnly, setAcceptingOnly] = useState(false)
  const [openIntro, setOpenIntro] = useState<string | null>(null)
  const [topic, setTopic] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [reviewFor, setReviewFor] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')

  const connectedIds = useMemo(
    () => new Set(connections.filter((c) => ['requested', 'introduced'].includes(c.status)).map((c) => c.advisor_id)),
    [connections]
  )
  const metIds = useMemo(
    () => new Set(connections.filter((c) => ['introduced', 'met'].includes(c.status)).map((c) => c.advisor_id)),
    [connections]
  )

  const filtered = advisors.filter((a) => {
    if (typeFilter && a.advisor_type !== typeFilter) return false
    if (acceptingOnly && !a.accepts_new_clients) return false
    return true
  })

  async function requestIntro(advisorId: string) {
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch('/api/advisors/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advisor_id: advisorId, topic, member_note: note }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg({ kind: 'err', text: json.error ?? 'Something went wrong. Please try again.' })
      } else {
        setConnections((prev) => [{ ...json.connection, advisor: null }, ...prev])
        setOpenIntro(null)
        setTopic('')
        setNote('')
        setMsg({ kind: 'ok', text: 'Introduction requested. Your navigator will be in touch soon.' })
      }
    } catch {
      setMsg({ kind: 'err', text: 'Network error. Please try again.' })
    }
    setSubmitting(false)
  }

  async function submitReview(advisorId: string) {
    setSubmitting(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/advisors/${advisorId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: reviewText }),
      })
      const json = await res.json()
      if (!res.ok) setMsg({ kind: 'err', text: json.error ?? 'Could not save your review.' })
      else {
        setReviewFor(null)
        setReviewText('')
        setRating(5)
        setMsg({ kind: 'ok', text: 'Thank you — your review helps other families choose well.' })
      }
    } catch {
      setMsg({ kind: 'err', text: 'Network error. Please try again.' })
    }
    setSubmitting(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {msg && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '15px',
            backgroundColor: msg.kind === 'ok' ? 'var(--color-teal-muted)' : 'var(--color-concern)',
            color: msg.kind === 'ok' ? 'var(--color-navy)' : 'var(--color-concern-text)',
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Your introductions */}
      {connections.length > 0 && (
        <section style={card}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: 'var(--color-navy)', margin: '0 0 12px' }}>
            Your introductions
          </h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {connections.map((c) => {
              const s = ADVISOR_CONNECTION_STATUS[c.status] ?? ADVISOR_CONNECTION_STATUS.requested
              const name =
                c.advisor?.full_name ??
                advisors.find((a) => a.id === c.advisor_id)?.full_name ??
                'Advisor'
              return (
                <li key={c.id} style={{ borderTop: '1px solid var(--color-warm-grey)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontFamily: 'var(--font-body)', color: 'var(--color-navy)' }}>{name}</strong>
                      <span
                        style={{
                          marginLeft: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'white',
                          backgroundColor: s.color,
                          borderRadius: 'var(--radius-full)',
                          padding: '2px 10px',
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                    {metIds.has(c.advisor_id) && !metIds.has('reviewed-' + c.advisor_id) && (
                      <button
                        onClick={() => setReviewFor(reviewFor === c.advisor_id ? null : c.advisor_id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-teal)', cursor: 'pointer', fontSize: '14px' }}
                      >
                        {reviewFor === c.advisor_id ? 'Cancel' : 'Leave a review'}
                      </button>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                    {s.description}
                  </p>
                  {reviewFor === c.advisor_id && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            aria-label={`${n} star${n > 1 ? 's' : ''}`}
                            onClick={() => setRating(n)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: n <= rating ? '#f59e0b' : '#d1d5db' }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="What was your experience like? (optional)"
                        rows={3}
                        style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', padding: '10px', fontFamily: 'var(--font-body)', fontSize: '15px', boxSizing: 'border-box' }}
                      />
                      <Button size="sm" onClick={() => submitReview(c.advisor_id)} loading={submitting}>
                        Submit review
                      </Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by advisor type"
          style={{ height: '48px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', padding: '0 12px', fontFamily: 'var(--font-body)', fontSize: '15px' }}
        >
          <option value="">All advisor types</option>
          {ADVISOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={acceptingOnly} onChange={(e) => setAcceptingOnly(e.target.checked)} style={{ width: '18px', height: '18px' }} />
          Accepting new clients only
        </label>
      </div>

      {/* Directory */}
      {filtered.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          No advisors match your filters yet. Try widening your search, or ask your navigator
          for a personal recommendation.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filtered.map((a) => (
            <article key={a.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>{advisorTypeEmoji(a.advisor_type)}</span>
                <div>
                  <strong style={{ fontFamily: 'var(--font-body)', color: 'var(--color-navy)', fontSize: '16px' }}>{a.full_name}</strong>
                  {a.firm_name && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{a.firm_name}</div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Tag>{advisorTypeLabel(a.advisor_type)}</Tag>
                {a.thrive_verified && <Tag color="#2b9348">✓ Verified</Tag>}
                {a.listing_tier !== 'standard' && <Tag color="#9d4edd">{a.listing_tier === 'premier' ? 'Premier' : 'Featured'}</Tag>}
                {a.offers_free_consult && <Tag color="#4361ee">Free first consult</Tag>}
                {a.sliding_scale && <Tag color="#0369a1">Sliding scale</Tag>}
              </div>
              {a.bio && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '2px 0' }}>{a.bio}</p>
              )}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                {[a.city, a.state].filter(Boolean).join(', ')}
                {a.languages.length > 1 ? ` · ${a.languages.join(', ')}` : ''}
                {a.total_reviews > 0 ? ` · ★ ${Number(a.avg_rating ?? 0).toFixed(1)} (${a.total_reviews})` : ''}
              </p>
              {!a.accepts_new_clients && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-concern-text)', margin: 0 }}>
                  Not accepting new clients right now
                </p>
              )}

              {connectedIds.has(a.id) ? (
                <Button size="sm" variant="secondary" disabled>
                  Introduction requested
                </Button>
              ) : openIntro === a.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What do you need help with?"
                    style={{ height: '44px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', padding: '0 12px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything else your navigator should know? (optional)"
                    rows={2}
                    style={{ borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-warm-grey)', padding: '10px', fontFamily: 'var(--font-body)', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button size="sm" onClick={() => requestIntro(a.id)} loading={submitting} disabled={!a.accepts_new_clients}>
                      Request introduction
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setOpenIntro(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" onClick={() => { setOpenIntro(a.id); setMsg(null) }} style={{ marginTop: '4px' }}>
                  Request a warm introduction
                </Button>
              )}
            </article>
          ))}
        </div>
      )}

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
        Advisors pay an annual listing fee to appear in this directory. ThriveAtHome vets every
        listing, but does not provide legal, financial, or tax advice and does not receive
        referral commissions. Choosing an advisor is always your decision.
      </p>
    </div>
  )
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontSize: '12px',
        fontWeight: 600,
        color: color ?? 'var(--color-text-secondary)',
        backgroundColor: color ? `${color}18` : 'var(--color-cream)',
        border: `1px solid ${color ? `${color}44` : 'var(--color-warm-grey)'}`,
        borderRadius: 'var(--radius-full)',
        padding: '2px 8px',
      }}
    >
      {children}
    </span>
  )
}
