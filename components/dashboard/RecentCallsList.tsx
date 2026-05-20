// RecentCallsList — shows the 5 most recent check-in calls with mood emoji and status.
import { MoodEmoji } from '@/components/ui/MoodEmoji'
import { Badge } from '@/components/ui/Badge'
import { SectionError } from './SectionError'
import type { CheckInCall } from '@/lib/data/calls'
import type { BadgeVariant } from '@/components/ui/Badge'
import Link from 'next/link'

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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatDuration(secs: number | null): string {
  if (!secs) return '—'
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
      <p className="text-gray-500 text-lg">No calls have been completed yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {recent.map((call) => (
        <div
          key={call.id}
          className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex flex-wrap items-center gap-4"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {call.mood_score !== null ? (
              <MoodEmoji score={call.mood_score} size="lg" showScore />
            ) : (
              <span className="text-2xl text-gray-300" aria-label="No mood score">—</span>
            )}
            <div className="min-w-0">
              <p className="text-lg font-medium text-brand-navy truncate">
                {formatCallDate(call.scheduled_at, call.created_at)}
              </p>
              <p className="text-base text-gray-400">
                {formatDuration(call.duration_seconds)}
                {call.medication_taken !== null && (
                  <span className="ml-3">
                    {call.medication_taken ? '💊 Meds taken' : '⚠ Meds not taken'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <Badge variant={statusBadge[call.status] ?? 'neutral'}>
            {statusLabel[call.status] ?? call.status}
          </Badge>
        </div>
      ))}
      {calls.length > 5 && (
        <div className="pt-1">
          <Link
            href="/dashboard/calls"
            className="text-lg text-brand-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal rounded"
          >
            View all {calls.length} calls →
          </Link>
        </div>
      )}
    </div>
  )
}
