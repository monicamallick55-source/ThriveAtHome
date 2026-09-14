'use client'

import { useEffect, useState, useCallback } from 'react'

type JoinRequest = {
  id: string
  status: string
  message: string | null
  requester_name: string | null
  created_at: string
  members: { preferred_name: string | null; full_name: string | null; city: string | null; zip_code: string | null } | null
}

export default function OrgJoinRequestsClient() {
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/org-admin/join-requests')
    const json = await res.json().catch(() => ({ requests: [] }))
    setRequests(json.requests ?? [])
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])

  async function decide(id: string, decision: 'approved' | 'declined') {
    setBusy(id)
    const res = await fetch('/api/org-admin/join-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: id, decision }),
    })
    setBusy(null)
    if (res.ok) {
      setMsg(decision === 'approved' ? 'Member approved and added to your roster.' : 'Request declined.')
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r))
    } else {
      const j = await res.json().catch(() => ({ error: 'Error' }))
      setMsg(j.error ?? 'Something went wrong.')
    }
    setTimeout(() => setMsg(''), 4000)
  }

  const card: React.CSSProperties = { backgroundColor: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #E8E4DC', marginBottom: '14px' }
  const pending = requests.filter(r => r.status === 'pending')
  const decided = requests.filter(r => r.status !== 'pending')

  if (!loaded) return <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>Loading…</p>

  return (
    <div>
      {msg && <div role="status" style={{ ...card, backgroundColor: '#F0F9F7', color: 'var(--color-teal)', fontFamily: 'var(--font-body)', fontSize: '14px' }}>{msg}</div>}

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '8px 0 12px' }}>Pending ({pending.length})</h2>
      {pending.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>No pending requests right now.</p>
      ) : pending.map(r => {
        const name = r.members?.preferred_name ?? r.members?.full_name ?? r.requester_name ?? 'A member'
        return (
          <div key={r.id} style={card}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 600, color: 'var(--color-navy)' }}>{name}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {[r.members?.city, r.members?.zip_code].filter(Boolean).join(' · ') || 'Location not shared'} · requested {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
            </div>
            {r.message && <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', margin: '10px 0 0', lineHeight: 1.6 }}>&ldquo;{r.message}&rdquo;</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => decide(r.id, 'approved')} disabled={busy === r.id}
                style={{ padding: '9px 20px', backgroundColor: 'var(--color-teal)', color: 'white', border: 'none', borderRadius: '9px', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                {busy === r.id ? 'Saving…' : 'Approve'}
              </button>
              <button onClick={() => decide(r.id, 'declined')} disabled={busy === r.id}
                style={{ padding: '9px 20px', backgroundColor: 'white', color: '#D62828', border: '1.5px solid #DDD8CE', borderRadius: '9px', fontFamily: 'var(--font-body)', fontSize: '14px', cursor: 'pointer' }}>
                Decline
              </button>
            </div>
          </div>
        )
      })}

      {decided.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--color-navy)', margin: '24px 0 12px' }}>Decided</h2>
          {decided.map(r => {
            const name = r.members?.preferred_name ?? r.members?.full_name ?? r.requester_name ?? 'A member'
            return (
              <div key={r.id} style={{ ...card, opacity: 0.75 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-navy)' }}>{name}</span>
                <span style={{ marginLeft: '10px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: r.status === 'approved' ? 'var(--color-teal)' : '#D62828' }}>
                  {r.status}
                </span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
