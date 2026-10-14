'use client'
// app/university-admin/[slug]/UniversityAdminClient.tsx
// G7.7 — University partner admin portal

import { useState } from 'react'

interface Partner {
  id: string; name: string; slug: string; contact_name: string;
  semester_start: string | null; semester_end: string | null;
  hour_target: number; enrolled_students: number;
}

interface Student {
  id: string; first_name: string; first_initial?: string; last_initial: string;
  total_hours: number; status: string; created_at: string; student_id_verified: boolean;
}

function downloadCsv(students: Student[], partnerName: string, hourTarget: number) {
  const header = 'First Name,Last Initial,Hours Completed,Hours Remaining,Status,Joined\n'
  const rows = students.map((s) => {
    const remaining = Math.max(0, hourTarget - s.total_hours)
    return `${s.first_name},${s.last_initial}.,${s.total_hours.toFixed(1)},${remaining.toFixed(1)},${s.status},${new Date(s.created_at).toLocaleDateString('en-US')}`
  })
  const csv = header + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${partnerName.replace(/\s+/g, '_')}_service_records.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function UniversityAdminClient({
  partner, students,
}: {
  partner: Partner
  students: Student[]
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'on_track' | 'complete' | 'at_risk'>('all')

  const filtered = students
    .filter((s) => {
      if (search) {
        const q = search.toLowerCase()
        return s.first_name.toLowerCase().includes(q) || s.last_initial.toLowerCase().includes(q)
      }
      return true
    })
    .filter((s) => {
      if (filter === 'complete') return s.total_hours >= partner.hour_target
      if (filter === 'on_track') return s.total_hours >= partner.hour_target * 0.5 && s.total_hours < partner.hour_target
      if (filter === 'at_risk') return s.total_hours < partner.hour_target * 0.5
      return true
    })

  const complete = students.filter((s) => s.total_hours >= partner.hour_target).length
  const onTrack = students.filter((s) => s.total_hours >= partner.hour_target * 0.5 && s.total_hours < partner.hour_target).length
  const atRisk = students.filter((s) => s.total_hours < partner.hour_target * 0.5).length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{partner.name}</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
          Service-Learning Admin Portal · Contact: {partner.contact_name}
          {partner.semester_start && ` · ${partner.semester_start} → ${partner.semester_end ?? 'ongoing'}`}
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Enrolled', value: students.length, color: '#1d4ed8' },
          { label: `Complete (${partner.hour_target}h)`, value: complete, color: '#059669' },
          { label: 'On track', value: onTrack, color: '#d97706' },
          { label: 'At risk', value: atRisk, color: '#dc2626' },
        ].map((s) => (
          <div key={s.label} style={{
            border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', background: '#fff',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          placeholder="Search students…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, flex: 1, minWidth: 180 }}
        />
        {(['all', 'complete', 'on_track', 'at_risk'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 14px', border: '1px solid',
              borderColor: filter === f ? '#1d4ed8' : '#e5e7eb',
              background: filter === f ? '#eff6ff' : '#fff',
              color: filter === f ? '#1d4ed8' : '#374151',
              borderRadius: 7, fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f === 'all' ? 'All' : f === 'on_track' ? 'On track' : f === 'at_risk' ? 'At risk' : 'Complete'}
          </button>
        ))}
        <button
          onClick={() => downloadCsv(filtered, partner.name, partner.hour_target)}
          style={{
            padding: '8px 16px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              {['Student', 'Hours', 'Progress', 'Remaining', 'Status'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', fontWeight: 600, color: '#374151', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const pct = Math.min(100, (s.total_hours / partner.hour_target) * 100)
              const remaining = Math.max(0, partner.hour_target - s.total_hours)
              const statusColor = s.total_hours >= partner.hour_target ? '#059669'
                : s.total_hours >= partner.hour_target * 0.5 ? '#d97706' : '#dc2626'
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    {s.first_name} {s.last_initial}.
                    {s.student_id_verified && <span style={{ fontSize: 11, color: '#059669', marginLeft: 6 }}>✓ verified</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>{s.total_hours.toFixed(1)}h</td>
                  <td style={{ padding: '10px 14px', minWidth: 120 }}>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: statusColor, borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{pct.toFixed(0)}%</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: remaining > 0 ? '#dc2626' : '#059669' }}>
                    {remaining > 0 ? `${remaining.toFixed(1)}h left` : '✅ Done'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: s.status === 'active' ? '#dcfce7' : '#f3f4f6',
                      color: s.status === 'active' ? '#166534' : '#6b7280',
                    }}>{s.status}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>No students match your filter.</div>
        )}
      </div>
    </div>
  )
}
