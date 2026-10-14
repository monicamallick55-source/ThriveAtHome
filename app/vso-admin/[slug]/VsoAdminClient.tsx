'use client'
// app/vso-admin/[slug]/VsoAdminClient.tsx
// G7.8 — VSO admin portal client

import { useState } from 'react'

interface Partner { id: string; name: string; affiliation: string; contact_name: string }
interface Volunteer {
  id: string; first_name: string; last_initial: string;
  vso_member_number: string | null; total_hours: number; status: string; created_at: string;
}

function downloadVavsCsv(volunteers: Volunteer[], orgName: string) {
  const header = 'Volunteer Name,VSO Member #,Hours Served,Status,Joined\n'
  const rows = volunteers.map((v) =>
    `${v.first_name} ${v.last_initial}.,${v.vso_member_number ?? ''},${v.total_hours.toFixed(1)},${v.status},${new Date(v.created_at).toLocaleDateString('en-US')}`
  )
  const csv = header + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${orgName.replace(/\s+/g, '_')}_VAVS_report.csv`
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

export default function VsoAdminClient({ partner, volunteers }: { partner: Partner; volunteers: Volunteer[] }) {
  const [search, setSearch] = useState('')
  const filtered = volunteers.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.first_name.toLowerCase().includes(q) || (v.vso_member_number ?? '').includes(q)
  })

  const totalHours = volunteers.reduce((s, v) => s + v.total_hours, 0)

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>{partner.name}</h1>
      <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>VSO Partner Admin · {partner.contact_name}</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, marginTop: 18 }}>
        {[
          { label: 'Volunteers', value: volunteers.length },
          { label: 'Total hours', value: `${totalHours.toFixed(0)}h` },
          { label: 'Active', value: volunteers.filter((v) => v.status === 'active').length },
        ].map((s) => (
          <div key={s.label} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 18px', background: '#fff', flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d4ed8' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          placeholder="Search by name or member #…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}
        />
        <button
          onClick={() => downloadVavsCsv(filtered, partner.name)}
          style={{
            padding: '8px 16px', background: '#1d4ed8', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >↓ VAVS Export</button>
      </div>

      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Volunteer', 'Member #', 'Hours', 'Status', 'Joined'].map((h) => (
                <th key={h} style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.first_name} {v.last_initial}.</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{v.vso_member_number ?? '—'}</td>
                <td style={{ padding: '10px 14px' }}>{v.total_hours.toFixed(1)}h</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: v.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: v.status === 'active' ? '#166534' : '#6b7280',
                  }}>{v.status}</span>
                </td>
                <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{new Date(v.created_at).toLocaleDateString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No volunteers found.</div>
        )}
      </div>
    </div>
  )
}
