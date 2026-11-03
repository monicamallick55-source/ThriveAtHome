'use client'
// app/org-admin/join-requests/page.tsx
// Org admin: review and approve/deny member join requests
// Accessible at /org-admin/join-requests?org_id=<id>

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { UserCheck, UserX, Clock, Loader2, ArrowLeft } from 'lucide-react'

interface JoinRequest {
  id: string
  full_name: string
  email: string
  phone: string | null
  message: string | null
  requested_at: string
  status: 'pending' | 'approved' | 'denied'
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    pending:  { bg: '#fff8e1', color: '#b45309', label: 'Pending' },
    approved: { bg: '#e8f5e9', color: '#2d6a4f', label: 'Approved' },
    denied:   { bg: '#fce4ec', color: '#c62828', label: 'Denied' },
  }
  const s = map[status] || map.pending
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function JoinRequestsContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org_id') || ''

  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (orgId) load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/org-admin/join-requests?org_id=${orgId}`)
      if (res.ok) setRequests(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function decide(requestId: string, action: 'approve' | 'deny') {
    setActionLoading(requestId)
    try {
      const res = await fetch(`/api/org-admin/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, action, org_id: orgId }),
      })
      if (!res.ok) throw new Error()
      setRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: action === 'approve' ? 'approved' : 'denied' }
          : r
      ))
      showToast(action === 'approve' ? '✅ Request approved — member invited' : '❌ Request denied')
    } catch {
      showToast('⚠️ Action failed — please try again')
    } finally {
      setActionLoading(null)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  if (!orgId) {
    return (
      <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ fontSize: '18px', color: '#1a1a1a' }}>Organisation ID required</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Access this page via the org admin portal.</p>
          <a href="/org-admin" style={{ color: '#2d6a4f', fontWeight: 600, fontSize: '14px' }}>
            ← Go to org admin portal
          </a>
        </div>
      </div>
    )
  }

  const displayed = filter === 'pending'
    ? requests.filter(r => r.status === 'pending')
    : requests

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div style={{ minHeight: '100vh', background: '#f7faf7' }}>
      {/* Header */}
      <div style={{ background: '#2d6a4f', padding: '16px 24px' }}>
        <a href={`/org-admin?org_id=${orgId}`}
          style={{ color: '#a7d7b8', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
          <ArrowLeft size={14} /> Back to portal
        </a>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
          Join Requests
          {pendingCount > 0 && (
            <span style={{ background: '#e63946', color: '#fff', fontSize: '12px', fontWeight: 700,
              padding: '2px 8px', borderRadius: '99px', marginLeft: '10px' }}>
              {pendingCount} pending
            </span>
          )}
        </h1>
        <p style={{ color: '#a7d7b8', fontSize: '13px', margin: '4px 0 0' }}>
          Members who requested to join your organisation
        </p>
      </div>

      <div style={{ padding: '24px', maxWidth: '800px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e8f0e9', marginBottom: '20px' }}>
          {(['pending', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: 'none', border: 'none',
                borderBottom: filter === f ? '2px solid #2d6a4f' : '2px solid transparent',
                marginBottom: '-2px', padding: '8px 20px', fontSize: '14px',
                fontWeight: filter === f ? 700 : 400,
                color: filter === f ? '#2d6a4f' : '#888', cursor: 'pointer', textTransform: 'capitalize' }}>
              {f === 'pending' ? `Pending (${pendingCount})` : 'All requests'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Loader2 size={28} color="#2d6a4f" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>
            <Clock size={36} color="#c8e6c9" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '6px' }}>
              {filter === 'pending' ? 'No pending requests' : 'No join requests yet'}
            </div>
            <div style={{ fontSize: '13px' }}>
              {filter === 'pending'
                ? 'All caught up! Check the "All requests" tab to see past decisions.'
                : 'When members request to join your organisation, they\'ll appear here.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayed.map(r => (
              <div key={r.id}
                style={{ background: '#fff', border: '1px solid #e8f0e9', borderRadius: '12px', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a1a' }}>{r.full_name}</span>
                      {statusBadge(r.status)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#555' }}>{r.email}</div>
                    {r.phone && <div style={{ fontSize: '13px', color: '#888' }}>{r.phone}</div>}
                    {r.message && (
                      <div style={{ marginTop: '10px', background: '#f9fbf9', borderRadius: '8px',
                        padding: '10px 12px', fontSize: '13px', color: '#444', borderLeft: '3px solid #c8e6c9' }}>
                        {r.message}
                      </div>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa' }}>
                      Requested {new Date(r.requested_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                  </div>

                  {r.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => decide(r.id, 'deny')}
                        disabled={actionLoading === r.id}
                        style={{ background: '#fce4ec', color: '#c62828', border: 'none', borderRadius: '8px',
                          padding: '8px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px', opacity: actionLoading === r.id ? 0.6 : 1 }}>
                        <UserX size={14} /> Deny
                      </button>
                      <button
                        onClick={() => decide(r.id, 'approve')}
                        disabled={actionLoading === r.id}
                        style={{ background: '#2d6a4f', color: '#fff', border: 'none', borderRadius: '8px',
                          padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '5px', opacity: actionLoading === r.id ? 0.6 : 1 }}>
                        {actionLoading === r.id
                          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          : <><UserCheck size={14} /> Approve</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '10px 20px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 500, zIndex: 999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function JoinRequestsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f7faf7', display: 'flex',
        alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#2d6a4f" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <JoinRequestsContent />
    </Suspense>
  )
}
