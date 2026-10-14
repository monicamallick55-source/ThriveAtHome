'use client'
// components/volunteer/CorporateTierProgress.tsx
// G7.11 — Corporate volunteer 3-tier progress bar + milestone badge

import { useState } from 'react'

interface VolunteerRecord {
  id: string;
  first_name: string;
  last_initial: string;
  total_hours: number;
  status: string;
  volunteer_category: string;
}

interface Props {
  companyName: string;
  volunteers: VolunteerRecord[];
}

const TIERS = [
  { name: 'Bronze', minHours: 10, color: '#b45309', bg: '#fef3c7', badge: '🥉' },
  { name: 'Silver', minHours: 25, color: '#6b7280', bg: '#f3f4f6', badge: '🥈' },
  { name: 'Gold',   minHours: 50, color: '#b45309', bg: '#fef9c3', badge: '🏆' },
]

function getTier(hours: number) {
  if (hours >= 50) return TIERS[2]
  if (hours >= 25) return TIERS[1]
  if (hours >= 10) return TIERS[0]
  return null
}

function getNextTier(hours: number) {
  if (hours < 10) return TIERS[0]
  if (hours < 25) return TIERS[1]
  if (hours < 50) return TIERS[2]
  return null
}

function downloadCsv(volunteers: VolunteerRecord[], companyName: string) {
  const header = 'Employee,Hours,Tier,Status\n'
  const rows = volunteers.map((v) => {
    const tier = getTier(v.total_hours)
    return `${v.first_name} ${v.last_initial}.,${v.total_hours.toFixed(1)},${tier?.name ?? 'None'},${v.status}`
  })
  const csv = header + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${companyName.replace(/\s+/g, '_')}_volunteer_tiers.csv`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function CorporateTierProgress({ companyName, volunteers }: Props) {
  const [search, setSearch] = useState('')

  const filtered = volunteers.filter((v) =>
    !search || v.first_name.toLowerCase().includes(search.toLowerCase())
  )

  const tierCounts = TIERS.map((t) => ({
    ...t,
    count: volunteers.filter((v) => getTier(v.total_hours)?.name === t.name).length,
  }))
  const totalHours = volunteers.reduce((s, v) => s + v.total_hours, 0)
  const goldCount = tierCounts[2].count

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{companyName}</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>Corporate Volunteer Program</p>

      {/* Tier summary */}
      <div style={{ display: 'flex', gap: 12, marginTop: 18, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: '#fff', flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{volunteers.length}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Employees</div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: '#fff', flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669' }}>{totalHours.toFixed(0)}h</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Total hours</div>
        </div>
        {tierCounts.map((t) => (
          <div key={t.name} style={{ border: `1px solid ${t.bg}`, borderRadius: 10, padding: '14px 18px', background: t.bg, flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: t.color }}>{t.badge} {t.count}</div>
            <div style={{ fontSize: 12, color: t.color }}>{t.name} ({t.minHours}h+)</div>
          </div>
        ))}
      </div>

      {goldCount > 0 && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          🏆 <strong>{goldCount} employee{goldCount > 1 ? 's' : ''}</strong> reached Gold status! Consider recognizing them at your next all-hands.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Search employees…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}
        />
        <button
          onClick={() => downloadCsv(filtered, companyName)}
          style={{ padding: '8px 16px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >↓ Export</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((v) => {
          const currentTier = getTier(v.total_hours)
          const nextTier = getNextTier(v.total_hours)
          const pct = nextTier
            ? Math.min(100, (v.total_hours / nextTier.minHours) * 100)
            : 100
          const hoursToNext = nextTier ? Math.max(0, nextTier.minHours - v.total_hours) : 0

          return (
            <div key={v.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontWeight: 700 }}>{v.first_name} {v.last_initial}.</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{v.total_hours.toFixed(1)}h</span>
                  {currentTier ? (
                    <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: currentTier.bg, color: currentTier.color }}>
                      {currentTier.badge} {currentTier.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>No tier yet</span>
                  )}
                </div>
              </div>
              {nextTier && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                    <span>Progress to {nextTier.badge} {nextTier.name}</span>
                    <span>{hoursToNext.toFixed(1)}h to go</span>
                  </div>
                  <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: '#1d4ed8', borderRadius: 3 }} />
                  </div>
                </div>
              )}
              {!nextTier && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#059669', fontWeight: 600 }}>✅ Highest tier achieved!</div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No employees found.</div>
        )}
      </div>
    </div>
  )
}
