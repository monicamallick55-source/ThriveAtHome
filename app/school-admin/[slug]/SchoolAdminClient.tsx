'use client'
// app/school-admin/[slug]/SchoolAdminClient.tsx
// G7.9 — K-12 school partner portal: activity catalog + session log

import { useState } from 'react'

interface School {
  id: string; name: string; grade_band: string;
  contact_name: string; student_count: number;
}
interface Activity {
  id: string; grade_band: string; name: string;
  description: string; duration_minutes: number; materials: string[] | null;
}
interface Session {
  id: string; performed_at: string; hours: number; notes: string | null;
  volunteers: { first_name: string; last_initial: string } | null;
}

const GRADE_LABELS: Record<string, string> = {
  k_5: 'K–5', '6_8': '6–8', '9_12': '9–12', mixed: 'All grades',
}

function downloadSessionCsv(sessions: Session[], schoolName: string) {
  const header = 'Date,Student,Hours,Notes\n'
  const rows = sessions.map((s) => {
    const name = s.volunteers ? `${s.volunteers.first_name} ${s.volunteers.last_initial}.` : 'Unknown'
    const date = new Date(s.performed_at).toLocaleDateString('en-US')
    const notes = (s.notes ?? '').replace(/,/g, ';')
    return `${date},${name},${s.hours.toFixed(1)},${notes}`
  })
  const csv = header + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${schoolName.replace(/\s+/g, '_')}_sessions.csv`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function SchoolAdminClient({
  school, activities, sessions,
}: {
  school: School; activities: Activity[]; sessions: Session[];
}) {
  const [tab, setTab] = useState<'activities' | 'sessions'>('activities')
  const [gradeBandFilter, setGradeBandFilter] = useState<string>('all')

  const gradeBands = Array.from(new Set(activities.map((a) => a.grade_band)))
  const filteredActivities = gradeBandFilter === 'all'
    ? activities
    : activities.filter((a) => a.grade_band === gradeBandFilter)

  const totalHours = sessions.reduce((s, v) => s + v.hours, 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{school.name}</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
        School Partner · {GRADE_LABELS[school.grade_band] ?? school.grade_band} · {school.contact_name}
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginTop: 18, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Student volunteers', value: new Set(sessions.map((s) => s.volunteers?.first_name)).size },
          { label: 'Sessions logged', value: sessions.length },
          { label: 'Total hours', value: `${totalHours.toFixed(0)}h` },
          { label: 'Activities available', value: activities.length },
        ].map((s) => (
          <div key={s.label} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: '#fff', flex: 1, minWidth: 130 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7c3aed' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
        {[
          { key: 'activities', label: '📚 Activity Catalog' },
          { key: 'sessions', label: '📋 Session Log' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14,
              fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? '#7c3aed' : '#6b7280',
              borderBottom: tab === t.key ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: -2,
            }}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'activities' && (
        <div>
          {/* Grade band filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setGradeBandFilter('all')}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1px solid',
                borderColor: gradeBandFilter === 'all' ? '#7c3aed' : '#e5e7eb',
                background: gradeBandFilter === 'all' ? '#f5f3ff' : '#fff',
                color: gradeBandFilter === 'all' ? '#7c3aed' : '#374151',
                fontSize: 13, cursor: 'pointer', fontWeight: gradeBandFilter === 'all' ? 600 : 400,
              }}
            >All grades</button>
            {gradeBands.map((gb) => (
              <button
                key={gb}
                onClick={() => setGradeBandFilter(gb)}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: '1px solid',
                  borderColor: gradeBandFilter === gb ? '#7c3aed' : '#e5e7eb',
                  background: gradeBandFilter === gb ? '#f5f3ff' : '#fff',
                  color: gradeBandFilter === gb ? '#7c3aed' : '#374151',
                  fontSize: 13, cursor: 'pointer', fontWeight: gradeBandFilter === gb ? 600 : 400,
                }}
              >{GRADE_LABELS[gb]}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredActivities.map((a) => (
              <div key={a.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{a.description}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#f5f3ff', color: '#7c3aed', fontWeight: 700 }}>
                      {GRADE_LABELS[a.grade_band]}
                    </span>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
                      {a.duration_minutes} min
                    </span>
                  </div>
                </div>
                {a.materials && a.materials.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
                    Materials: {a.materials.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {filteredActivities.length === 0 && (
              <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No activities for this grade band.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button
              onClick={() => downloadSessionCsv(sessions, school.name)}
              style={{
                padding: '8px 16px', background: '#7c3aed', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >↓ Export CSV</button>
          </div>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Date', 'Student', 'Hours', 'Notes'].map((h) => (
                    <th key={h} style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{new Date(s.performed_at).toLocaleDateString('en-US')}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      {s.volunteers ? `${s.volunteers.first_name} ${s.volunteers.last_initial}.` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>{s.hours.toFixed(1)}h</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{s.notes ?? '—'}</td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>No sessions logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
