'use client'
// CallHistoryClient — expandable call rows with plain-English flag labels and load-more pagination.
import { useState, useCallback } from 'react'
import { MoodEmoji } from '@/components/ui/MoodEmoji'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { CheckInCall } from '@/lib/data/calls'
import type { BadgeVariant } from '@/components/ui/Badge'

// Plain-English labels for every flag value stored in check_in_calls.alert_flags.
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

const statusBadge: Record<string, BadgeVariant> = {
  completed: 'success',
  missed: 'urgent',
  failed: 'emergency',
  scheduled: 'neutral',
  in_progress: 'info',
}

const statusLabel: Record<string, string> = {
  completed: 'Completed',
  missed: 'Missed',
  failed: 'Failed',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
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

interface CallRowProps {
  call: CheckInCall
}

function CallRow({ call }: CallRowProps) {
  const [expanded, setExpanded] = useState(false)
  const flags = parseFlags(call.alert_flags)
  const hasDetails = !!call.ai_summary || flags.length > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Summary row — always visible */}
      <button
        className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-4 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-teal"
        onClick={() => hasDetails && setExpanded((prev) => !prev)}
        aria-expanded={hasDetails ? expanded : undefined}
        aria-label={`${formatCallDate(call.scheduled_at, call.created_at)} call — ${statusLabel[call.status] ?? call.status}${hasDetails ? '. Click to expand.' : ''}`}
        disabled={!hasDetails}
      >
        {/* Mood emoji */}
        <div className="flex-shrink-0 w-12 flex justify-center">
          <MoodEmoji score={call.mood_score} size="lg" />
        </div>

        {/* Date and duration */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-medium text-brand-navy">
            {formatCallDate(call.scheduled_at, call.created_at)}
          </p>
          <p className="text-base text-gray-500 flex flex-wrap gap-3 mt-0.5">
            <span>{formatDuration(call.duration_seconds)}</span>
            {call.mood_score !== null && (
              <span>Mood: {call.mood_score}/10</span>
            )}
            {call.medication_taken !== null && (
              <span>{call.medication_taken ? '💊 Meds taken' : '⚠️ Meds not taken'}</span>
            )}
            {flags.length > 0 && (
              <span className="text-amber-600 font-medium">
                {flags.length} flag{flags.length > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        {/* Status badge + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Badge variant={statusBadge[call.status] ?? 'neutral'}>
            {statusLabel[call.status] ?? call.status}
          </Badge>
          {hasDetails && (
            <span
              aria-hidden="true"
              className={`text-gray-400 text-xl transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && hasDetails && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4 bg-gray-50">
          {/* Extra scores */}
          {(call.energy_score !== null || call.pain_score !== null) && (
            <div className="flex gap-6 text-base text-gray-600">
              {call.energy_score !== null && (
                <span>Energy: <strong>{call.energy_score}/10</strong></span>
              )}
              {call.pain_score !== null && (
                <span>Pain: <strong>{call.pain_score}/10</strong></span>
              )}
            </div>
          )}

          {/* AI summary */}
          {call.ai_summary && (
            <div>
              <p className="text-base font-semibold text-gray-700 mb-1">Call Summary</p>
              <p className="text-base text-gray-600 leading-relaxed">{call.ai_summary}</p>
            </div>
          )}

          {/* Alert flags — plain-English labels */}
          {flags.length > 0 && (
            <div>
              <p className="text-base font-semibold text-gray-700 mb-2">Flags</p>
              <ul className="space-y-1" aria-label="Call flags">
                {flags.map((flag) => (
                  <li
                    key={flag}
                    className="flex items-start gap-2 text-base text-amber-700"
                  >
                    <span aria-hidden="true" className="mt-0.5">⚠</span>
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
      <p className="text-gray-500 text-lg py-4">No calls have been recorded yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <CallRow key={call.id} call={call} />
      ))}

      {/* Load more */}
      {hasMore && (
        <div className="pt-2 flex flex-col items-center gap-2">
          {error && (
            <p role="alert" className="text-base text-red-600">
              {error}
            </p>
          )}
          <Button
            variant="secondary"
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
