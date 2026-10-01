import type { FamilyCall as CheckInCall } from '@/lib/data/calls'
import type { Member } from '@/lib/data/members'

interface WellnessCardProps {
  member: Member
  latestCall: CheckInCall | null
}

function moodEmoji(score: number | null): { emoji: string; label: string; color: string; bg: string } {
  if (score === null) return { emoji: '—', label: 'No check-in yet', color: 'var(--color-text-muted)', bg: 'var(--color-warm-grey)' }
  if (score >= 8) return { emoji: '😊', label: 'Feeling great', color: 'var(--color-mood-high)', bg: '#F0FBF5' }
  if (score >= 6) return { emoji: '🙂', label: 'Feeling well', color: 'var(--color-teal)', bg: 'var(--color-teal-muted)' }
  if (score >= 4) return { emoji: '😐', label: 'Feeling okay', color: 'var(--color-mood-mid)', bg: '#FDF8EC' }
  if (score >= 2) return { emoji: '😔', label: 'Feeling low', color: '#D97706', bg: '#FEF3C7' }
  return { emoji: '😞', label: 'Having a hard day', color: 'var(--color-mood-low)', bg: '#FEF2F2' }
}

function formatCallDate(dateStr: string | null): string {
  if (!dateStr) return 'today'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

interface ScoreItemProps {
  label: string
  value: string | null
  color?: string
}

function ScoreItem({ label, value, color }: ScoreItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '16px',
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-body)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '24px',
          fontWeight: 600,
          color: color ?? 'var(--color-navy)',
          lineHeight: 1.2,
        }}
      >
        {value ?? '–'}
      </span>
    </div>
  )
}

export function WellnessCard({ member, latestCall }: WellnessCardProps) {
  const mood = moodEmoji(latestCall?.mood_score ?? null)
  const callDate = formatCallDate(latestCall?.scheduled_at ?? latestCall?.created_at ?? null)

  const medColor = latestCall?.medication_taken === true
    ? 'var(--color-teal)'
    : latestCall?.medication_taken === false
      ? 'var(--color-concern-text)'
      : 'var(--color-text-muted)'

  const medLabel = latestCall?.medication_taken === true
    ? '✓ Taken'
    : latestCall?.medication_taken === false
      ? '✗ Not taken'
      : '–'

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-warm-grey)',
        overflow: 'hidden',
        marginTop: '-24px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 28px 16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Mood pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: mood.bg,
            borderRadius: 'var(--radius-full)',
            padding: '8px 16px',
          }}
        >
          <span style={{ fontSize: '28px', lineHeight: 1 }}>{mood.emoji}</span>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '20px',
                fontWeight: 600,
                color: mood.color,
              }}
            >
              {latestCall?.mood_score !== null && latestCall?.mood_score !== undefined
                ? `${latestCall.mood_score}/10`
                : '–'}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: mood.color,
                marginLeft: '8px',
              }}
            >
              {mood.label}
            </span>
          </div>
        </div>

        {/* Date */}
        <div style={{ textAlign: 'right' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: 0,
            }}
          >
            Today&apos;s check-in
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              color: 'var(--color-text-secondary)',
              margin: '2px 0 0',
            }}
          >
            {callDate}
          </p>
        </div>
      </div>

      {/* Score grid */}
      {latestCall ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid var(--color-warm-grey)',
            borderBottom: '1px solid var(--color-warm-grey)',
          }}
          className="wellness-score-grid"
        >
          <ScoreItem
            label="Mood"
            value={latestCall.mood_score !== null ? `${latestCall.mood_score}/10` : null}
            color={
              latestCall.mood_score !== null
                ? latestCall.mood_score >= 7
                  ? 'var(--color-mood-high)'
                  : latestCall.mood_score >= 4
                    ? 'var(--color-mood-mid)'
                    : 'var(--color-mood-low)'
                : undefined
            }
          />
          <div style={{ borderLeft: '1px solid var(--color-warm-grey)' }}>
            <ScoreItem
              label="Energy"
              value={latestCall.energy_score !== null ? `${latestCall.energy_score}/10` : null}
            />
          </div>
          <div style={{ borderLeft: '1px solid var(--color-warm-grey)' }}>
            <ScoreItem
              label="Comfort"
              value={latestCall.pain_score !== null ? `${10 - latestCall.pain_score}/10` : null}
            />
          </div>
          <div style={{ borderLeft: '1px solid var(--color-warm-grey)' }}>
            <ScoreItem label="Medication" value={medLabel} color={medColor} />
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-concern)',
            borderTop: '1px solid var(--color-warm-grey)',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '20px' }}>📞</span>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '18px',
              color: 'var(--color-concern-text)',
              margin: 0,
            }}
          >
            Aria is scheduled to call {member.preferred_name} soon. We&apos;ll update you right away.
          </p>
        </div>
      )}

      {/* AI Summary */}
      {latestCall?.ai_summary && (
        <div style={{ padding: '20px 28px' }}>
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
            <span
              style={{
                color: 'var(--color-teal)',
                fontSize: '36px',
                lineHeight: 0.5,
                verticalAlign: '-0.4em',
                marginRight: '6px',
                fontStyle: 'normal',
              }}
            >
              &ldquo;
            </span>
            {latestCall.ai_summary}
          </p>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .wellness-score-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .wellness-score-grid > div:nth-child(3) { border-left: none !important; border-top: 1px solid var(--color-warm-grey); }
          .wellness-score-grid > div:nth-child(4) { border-top: 1px solid var(--color-warm-grey); }
        }
      `}</style>
    </div>
  )
}
