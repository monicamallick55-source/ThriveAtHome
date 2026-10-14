'use client'
// components/volunteer/NeighborMatchPanel.tsx
// G7.12 — Navigator panel for neighbor volunteer matching

import { useState } from 'react'

interface NeighborMatch {
  id: string; status: string; created_at: string; navigator_note: string | null;
  volunteers: { id: string; first_name: string; last_initial: string; zip_code: string | null; total_hours: number; bio: string | null } | null;
}

interface Props {
  memberId: string;
  memberZip: string | null;
  initialMatches: NeighborMatch[];
}

export default function NeighborMatchPanel({ memberId, memberZip, initialMatches }: Props) {
  const [matches, setMatches] = useState(initialMatches)
  const [volunteerId, setVolunteerId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate() {
    if (!volunteerId.trim()) { setError('Enter a volunteer ID'); return }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/neighbor-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volunteerId: volunteerId.trim(), memberId }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setMatches((prev) => [json.match, ...prev])
      setVolunteerId('')
      setSuccess('Match request created — awaiting approval.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDecision(matchId: string, status: 'approved' | 'declined', note?: string) {
    const res = await fetch('/api/neighbor-match', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, status, navigatorNote: note }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error); return }
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, ...json.match } : m))
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#dcfce7', color: '#166534' },
      declined: { bg: '#fee2e2', color: '#991b1b' },
      completed: { bg: '#f3f4f6', color: '#6b7280' },
    }
    const c = colors[status] ?? colors.pending
    return (
      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: c.bg, color: c.color }}>
        {status}
      </span>
    )
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
      <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>🏘️ Neighbor Volunteer Matches</h3>
      {memberZip && <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Member zip: <strong>{memberZip}</strong> — only same-zip volunteers eligible</p>}

      {/* Create new match */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Volunteer ID…"
          value={volunteerId} onChange={(e) => setVolunteerId(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}
        />
        <button
          onClick={handleCreate} disabled={submitting}
          style={{
            padding: '8px 14px', background: '#0f766e', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >{submitting ? 'Creating…' : 'Request match'}</button>
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      {success && <p style={{ color: '#059669', fontSize: 13, marginBottom: 12 }}>{success}</p>}

      {/* Match list */}
      {matches.length === 0 && (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>No neighbor matches yet.</p>
      )}
      {matches.map((m) => (
        <div key={m.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <span style={{ fontWeight: 600 }}>
                {m.volunteers ? `${m.volunteers.first_name} ${m.volunteers.last_initial}.` : 'Unknown volunteer'}
              </span>
              {m.volunteers?.zip_code && <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>zip {m.volunteers.zip_code}</span>}
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>{m.volunteers?.total_hours.toFixed(0)}h total</span>
            </div>
            {statusBadge(m.status)}
          </div>
          {m.volunteers?.bio && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>{m.volunteers.bio}</p>}
          {m.navigator_note && <p style={{ fontSize: 12, color: '#374151', marginTop: 4, fontStyle: 'italic' }}>Note: {m.navigator_note}</p>}
          {m.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => handleDecision(m.id, 'approved')}
                style={{ padding: '6px 12px', background: '#059669', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >✓ Approve</button>
              <button
                onClick={() => handleDecision(m.id, 'declined', 'Not suitable')}
                style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
              >✗ Decline</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
