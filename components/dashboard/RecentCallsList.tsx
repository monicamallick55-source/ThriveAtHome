import { MoodEmoji } from '@/components/ui/MoodEmoji'
import { SectionError } from './SectionError'
import type { FamilyCall as CheckInCall } from '@/lib/data/calls'
import Link from 'next/link'

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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatDuration(secs: number | null): string {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export interface RecentCallsListProps {
  calls: CheckInCall[]
  error: string | null
}

export function RecentCallsList({ calls, error }: RecentCallsListProps) {
  if (error) return <SectionError message={error} />

  const recent = calls.slice(0, 5)

  if (recent.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', fontFamily: 'var(--font-body)', margin: 0 }}>
        No calls completed yet.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {recent.map((call) => (
        <div
          key={call.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: 'var(--color-cream)',
            border: '1px solid var(--color-warm-grey)',
            borderRadius: 'var(--radius-md)',
            flexWrap: 'wrap',
          }}
        >
          {call.mood_score !== null ? (
            <MoodEmoji score={call.mood_score} size="sm" />
          ) : (
            <span
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '22px',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
              }}
              aria-label="No mood score"
            >
              —
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                margin: 0,
              }}
            >
              {formatCallDate(call.scheduled_at, call.created_at)}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--color-text-muted)',
                margin: '2px 0 0',
              }}
            >
              {formatDuration(call.duration_seconds)}
              {call.medication_taken !== null && (
                <span style={{ marginLeft: '12px' }}>
                  {call.medication_taken ? '💊 Taken' : '⚠ Not taken'}
                </span>
              )}
            </p>
          </div>
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
        </div>
      ))}
      {calls.length > 5 && (
        <div style={{ paddingTop: '8px' }}>
          <Link
            href="/dashboard/calls"
            style={{
              fontSize: '18px',
              color: 'var(--color-teal)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            View all {calls.length} calls →
          </Link>
        </div>
      )}
    </div>
  )
}
