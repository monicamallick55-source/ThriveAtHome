'use client'
import { useState, useCallback } from 'react'
import { MoodEmoji } from '@/components/ui/MoodEmoji'
import { Button } from '@/components/ui/Button'
import type { FamilyCall as CheckInCall } from '@/lib/data/calls'

const FLAG_LABELS: Record<string, string> = {
  low_mood:        'Aria noted a mood concern this call',
  mood_drop:       'A significant mood decline was noted',
  medication_miss: 'Medication was not confirmed taken',
  fall:            'Aria noted a mention of a fall',
  missed_call:     'This call was missed',
  wellness_drift:  'A gradual wellness decline was detected',
  crisis:          'A potential crisis phrase was detected — navigator notified',
  emergency:       'An emergency was flagged — care team alerted',
}

const statusLabel: Record<string, string> = {
  completed: 'Completed',
  missed: 'Missed',
  failed: 'Failed',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
}

const statusColor: Record<string, string> = {
  completed: 'var(--color-teal)',
  missed: 'var(--color-concern-text)',
  failed: 'var(--color-urgent-text)',
  scheduled: 'var(--color-text-muted)',
  in_progress: 'var(--color-navy-light)',
}

function formatCallDate(dateStr: string | null, fallback: string): string {
  const d = new Date(dateStr ?? fallback)
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  })
}

function formatDuration(secs: number | null): string {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s > 0 ? ` ${s}s` : ''}`.trim() : `${s}s`
}

function parseFlags(flags: unknown): string[] {
  if (!Array.isArray(flags)) return []
  return flags.filter((f): f is string => typeof f === 'string')
}

function CallRow({ call }: { call: CheckInCall }) {
  const [expanded, setExpanded] = useState(false)
  const flags = parseFlags(call.alert_flags)
  const hasDetails = !!call.ai_summary || flags.length > 0

  return (
    <div
      style={{
        backgroundColor: 'var(--color-warm-white)',
        border: '1px solid var(--color-warm-grey)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <button
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: hasDetails ? 'pointer' : 'default',
          flexWrap: 'wrap',
          transition: 'background-color 0.2s',
        }}
        onClick={() => hasDetails && setExpanded((prev) => !prev)}
        aria-expanded={hasDetails ? expanded : undefined}
        aria-label={`${formatCallDate(call.scheduled_at, call.created_at)} call — ${statusLabel[call.status] ?? call.status}${hasDetails ? '. Click to expand.' : ''}`}
        disabled={!hasDetails}
      >
        {/* Date in mono */}
        <div style={{ flexShrink: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              display: 'block',
              whiteSpace: 'nowrap',
            }}
          >
            {formatCallDate(call.scheduled_at, call.created_at)}
          </span>
        </div>

        {/* Mood */}
        <div style={{ flexShrink: 0 }}>
          <MoodEmoji score={call.mood_score} size="sm" />
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '15px',
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>{formatDuration(call.duration_seconds)}</span>
            {call.medication_taken !== null && (
              <span style={{ color: call.medication_taken ? 'var(--color-teal)' : 'var(--color-concern-text)' }}>
                {call.medication_taken ? '💊 Taken' : '⚠ Not taken'}
              </span>
            )}
            {flags.length > 0 && (
              <span style={{ color: 'var(--color-concern-text)', fontWeight: 500 }}>
                {flags.length} flag{flags.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Status + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              color: statusColor[call.status] ?? 'var(--color-text-muted)',
            }}
          >
            {statusLabel[call.status] ?? call.status}
          </span>
          {hasDetails && (
            <span
              aria-hidden="true"
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '18px',
                display: 'inline-block',
                transition: 'transform 0.2s',
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            >
              ▾
            </span>
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && hasDetails && (
        <div
          style={{
            borderTop: '1px solid var(--color-warm-grey)',
            padding: '20px',
            backgroundColor: 'var(--color-cream)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* AI summary in display font */}
          {call.ai_summary && (
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: '8px',
                }}
              >
                Call summary
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontStyle: 'italic',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {call.ai_summary}
              </p>
            </div>
          )}

          {/* Extra scores */}
          {(call.energy_score !== null || call.pain_score !== null) && (
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {call.energy_score !== null && (
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Energy</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, color: 'var(--color-navy)' }}>{call.energy_score}/10</span>
                </div>
              )}
              {call.pain_score !== null && (
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Comfort</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 600, color: 'var(--color-navy)' }}>{10 - call.pain_score}/10</span>
                </div>
              )}
            </div>
          )}

          {/* Flags */}
          {flags.length > 0 && (
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                Flags
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }} aria-label="Call flags">
                {flags.map((flag) => (
                  <li
                    key={flag}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      fontSize: '18px',
                      color: 'var(--color-concern-text)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span aria-hidden="true" style={{ marginTop: '2px' }}>⚠</span>
                    <span>{FLAG_LABELS[flag] ?? flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

export interface CallHistoryClientProps {
  memberId: string
  initialCalls: CheckInCall[]
  totalCount: number
}

export default function CallHistoryClient({ memberId, initialCalls, totalCount }: CallHistoryClientProps) {
  const [calls, setCalls] = useState<CheckInCall[]>(initialCalls)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasMore = calls.length < totalCount

  const loadMore = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/calls?memberId=${encodeURIComponent(memberId)}&offset=${calls.length}&limit=${PAGE_SIZE}`
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      const { calls: next } = await res.json() as { calls: CheckInCall[] }
      setCalls((prev) => [...prev, ...next])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load more calls.')
    } finally {
      setLoading(false)
    }
  }, [memberId, calls.length])

  if (calls.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          backgroundColor: 'var(--color-teal-muted)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--color-navy)', margin: '0 0 8px' }}>
          No calls yet
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-muted)', margin: 0 }}>
          Aria will call for the first time at the scheduled time.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {calls.map((call) => (
        <CallRow key={call.id} call={call} />
      ))}

      {hasMore && (
        <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {error && (
            <p role="alert" style={{ color: 'var(--color-urgent-text)', fontSize: '18px', fontFamily: 'var(--font-body)', margin: 0 }}>
              {error}
            </p>
          )}
          <Button
            variant="ghost"
            onClick={loadMore}
            loading={loading}
            aria-label="Load more calls"
          >
            {loading ? 'Loading…' : `Load more (${totalCount - calls.length} remaining)`}
          </Button>
        </div>
      )}
    </div>
  )
}
