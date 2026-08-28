'use client'
// M25 Phase 102 — Cultural festival calendar (family-facing).
// Shows upcoming festivals with greetings and traditions; festivals tied to a
// community the member has joined are pinned and badged "For your community".
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { CulturalFestivalRow } from '@/types/database'

interface Props {
  festivals: CulturalFestivalRow[]
  myCircleNames: string[]
}

const card: React.CSSProperties = {
  backgroundColor: 'white',
  border: '1px solid var(--color-warm-grey)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px',
  boxShadow: 'var(--shadow-card)',
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function formatRange(start: string, end: string | null): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', timeZone: 'UTC' }
  const s = new Date(start + 'T00:00:00Z').toLocaleDateString('en-US', opts)
  if (!end || end === start) return s
  const e = new Date(end + 'T00:00:00Z').toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

function whenLabel(days: number): string {
  if (days <= 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 14) return 'Next week'
  if (days < 31) return `In ${Math.round(days / 7)} weeks`
  return `In about ${Math.round(days / 30)} month${days >= 45 ? 's' : ''}`
}

export default function FestivalCalendarClient({ festivals, myCircleNames }: Props) {
  const [mineOnly, setMineOnly] = useState(false)

  const isMine = useMemo(() => {
    const set = new Set(myCircleNames.map((n) => n.toLowerCase()))
    return (f: CulturalFestivalRow) => Boolean(f.circle_name && set.has(f.circle_name.toLowerCase()))
  }, [myCircleNames])

  const sorted = useMemo(() => {
    const list = [...festivals].sort((a, b) => a.festival_date.localeCompare(b.festival_date))
    // Pin the member's own communities to the top, keeping date order within each group.
    return [...list.filter(isMine), ...list.filter((f) => !isMine(f))]
  }, [festivals, isMine])

  const visible = mineOnly ? sorted.filter(isMine) : sorted
  const mineCount = sorted.filter(isMine).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {mineCount > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            style={pill(!mineOnly)}
          >
            All communities ({sorted.length})
          </button>
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            style={pill(mineOnly)}
          >
            Just my communities ({mineCount})
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <div style={card}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
            No festivals coming up in this window. Check back soon, or explore{' '}
            <Link href="/dashboard/cultural-circles" style={{ color: 'var(--color-teal)' }}>your communities</Link>.
          </p>
        </div>
      ) : (
        visible.map((f) => {
          const days = daysUntil(f.festival_date)
          const mine = isMine(f)
          return (
            <article
              key={f.id}
              style={{
                ...card,
                borderColor: mine ? 'var(--color-teal)' : 'var(--color-warm-grey)',
                backgroundColor: mine ? 'var(--color-teal-muted)' : 'white',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 600, color: 'var(--color-navy)', margin: 0 }}>
                  {f.festival_name}
                </h2>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 700, color: 'var(--color-teal)' }}>
                  {whenLabel(days)}
                </span>
              </div>

              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                {formatRange(f.festival_date, f.end_date)} · {f.culture_label}
              </p>

              {mine && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-navy)',
                    backgroundColor: 'white',
                    border: '1px solid var(--color-teal)',
                    borderRadius: '999px',
                    padding: '2px 10px',
                  }}
                >
                  For your community
                </span>
              )}

              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-primary)', lineHeight: 1.6, margin: '10px 0 0' }}>
                {f.description}
              </p>

              {f.typical_greeting && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-primary)', margin: '8px 0 0' }}>
                  <strong>A greeting:</strong> “{f.typical_greeting}”
                </p>
              )}
              {f.traditions && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                  <strong>Traditions:</strong> {f.traditions}
                </p>
              )}

              <p style={{ margin: '12px 0 0' }}>
                <Link
                  href="/dashboard/cultural-programming"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-teal)' }}
                >
                  Classes, potlucks &amp; story circles for this season →
                </Link>
              </p>
            </article>
          )
        })
      )}
    </div>
  )
}

function pill(active: boolean): React.CSSProperties {
  return {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    fontWeight: 600,
    padding: '8px 14px',
    borderRadius: '999px',
    cursor: 'pointer',
    border: `1.5px solid ${active ? 'var(--color-teal)' : 'var(--color-warm-grey)'}`,
    backgroundColor: active ? 'var(--color-teal)' : 'white',
    color: active ? 'white' : 'var(--color-text-secondary)',
  }
}
