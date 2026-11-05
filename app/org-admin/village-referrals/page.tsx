'use client'

/**
 * app/org-admin/village-referrals/page.tsx — 16.1 Village-to-Village Referral Workflow
 *
 * When a member moves out of a village's coverage area, the referring village
 * can pass their care record to the receiving village. Both sides must consent.
 *
 * Tabs:
 *   Outgoing — referrals we sent to other villages
 *   Incoming — referrals sent to us
 *   New Referral — form to initiate a new outgoing referral
 */

import { useState, useEffect } from 'react'

type Village = {
  id: string
  name: string
  city?: string
  state?: string
  contact_email?: string
}

type VillageReferral = {
  id: string
  created_at: string
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  referring_village_id: string
  receiving_village_id: string
  member_id: string
  reason: string
  notes?: string
  member: { first_name: string; last_name: string; date_of_birth?: string }
  referring_village: { name: string }
  receiving_village: { name: string }
  responded_at?: string
  transfer_date?: string
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
  accepted:  { bg: '#d1fae5', color: '#065f46', label: '✅ Accepted' },
  declined:  { bg: '#fee2e2', color: '#991b1b', label: '❌ Declined' },
  completed: { bg: '#dbeafe', color: '#1e40af', label: '🏁 Transferred' },
  cancelled: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
}

export default function VillageReferralsPage() {
  const [tab, setTab] = useState<'outgoing' | 'incoming' | 'new'>('outgoing')
  const [outgoing, setOutgoing] = useState<VillageReferral[]>([])
  const [incoming, setIncoming] = useState<VillageReferral[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [members, setMembers] = useState<{ id: string; first_name: string; last_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // New referral form
  const [memberId, setMemberId] = useState('')
  const [receivingVillageId, setReceivingVillageId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [responding, setResponding] = useState<string | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [outRes, inRes, vRes, mRes] = await Promise.all([
        fetch('/api/village-referrals?direction=outgoing'),
        fetch('/api/village-referrals?direction=incoming'),
        fetch('/api/villages?partner=true'),
        fetch('/api/org-admin/members?status=active&limit=200'),
      ])
      if (outRes.ok) setOutgoing((await outRes.json()).referrals ?? [])
      if (inRes.ok) setIncoming((await inRes.json()).referrals ?? [])
      if (vRes.ok) setVillages((await vRes.json()).villages ?? [])
      if (mRes.ok) setMembers((await mRes.json()).members ?? [])
    } finally {
      setLoading(false)
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function submitReferral() {
    if (!memberId || !receivingVillageId || !reason) {
      showToast('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/village-referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, receiving_village_id: receivingVillageId, reason, notes }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Could not send referral'); return }
      showToast('✅ Referral sent! The receiving village will be notified.')
      setMemberId(''); setReceivingVillageId(''); setReason(''); setNotes('')
      setTab('outgoing')
      loadAll()
    } finally {
      setSubmitting(false)
    }
  }

  async function respondToReferral(referralId: string, action: 'accept' | 'decline') {
    setResponding(referralId)
    try {
      const res = await fetch(`/api/village-referrals/${referralId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Could not respond'); return }
      showToast(action === 'accept' ? '✅ Referral accepted! Navigator will coordinate transfer.' : 'Referral declined.')
      loadAll()
    } finally {
      setResponding(null)
    }
  }

  function ReferralCard({ r, direction }: { r: VillageReferral; direction: 'in' | 'out' }) {
    const s = STATUS_COLORS[r.status] ?? { bg: '#f3f4f6', color: '#6b7280', label: r.status }
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', background: '#fff', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1f2937' }}>
              {r.member.first_name} {r.member.last_name}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 3 }}>
              {direction === 'out'
                ? `→ Referred to ${r.receiving_village.name}`
                : `← From ${r.referring_village.name}`}
              {' · '}{new Date(r.created_at).toLocaleDateString()}
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 12px', borderRadius: 99, background: s.bg, color: s.color }}>
            {s.label}
          </span>
        </div>

        <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: 10 }}>
          <strong>Reason:</strong> {r.reason}
        </div>
        {r.notes && (
          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: 10 }}>
            <strong>Notes:</strong> {r.notes}
          </div>
        )}

        {/* Actions for incoming pending referrals */}
        {direction === 'in' && r.status === 'pending' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={() => respondToReferral(r.id, 'accept')}
              disabled={responding === r.id}
              style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              {responding === r.id ? '…' : 'Accept Member'}
            </button>
            <button onClick={() => respondToReferral(r.id, 'decline')}
              disabled={responding === r.id}
              style={{ padding: '8px 20px', border: '1px solid #fca5a5', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              Decline
            </button>
          </div>
        )}

        {r.transfer_date && (
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 8, fontWeight: 600 }}>
            🏁 Transfer completed {new Date(r.transfer_date).toLocaleDateString()}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px', fontFamily: 'system-ui, sans-serif' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1f2937', color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: '0.9rem', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <a href="/org-admin" style={{ fontSize: '0.82rem', color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}>← Org Admin</a>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 4px', color: '#1f2937' }}>Village-to-Village Referrals</h1>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Coordinate member transfers when someone moves outside your service area.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 28 }}>
        {[
          { id: 'outgoing', label: `📤 Outgoing (${outgoing.length})` },
          { id: 'incoming', label: `📥 Incoming (${incoming.filter(r => r.status === 'pending').length} pending)` },
          { id: 'new',      label: '+ New Referral' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)} style={{
            padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 400, fontSize: '0.875rem',
            color: tab === t.id ? '#6366f1' : '#6b7280',
            borderBottom: tab === t.id ? '2px solid #6366f1' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Outgoing ── */}
      {tab === 'outgoing' && (
        <div>
          {loading ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>Loading…</p>
            : outgoing.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40, color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📤</div>
                <p>No outgoing referrals yet. Use the "New Referral" tab to refer a member to another village.</p>
              </div>
            ) : outgoing.map(r => <ReferralCard key={r.id} r={r} direction="out" />)
          }
        </div>
      )}

      {/* ── Incoming ── */}
      {tab === 'incoming' && (
        <div>
          {incoming.filter(r => r.status === 'pending').length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: '0.82rem', color: '#92400e' }}>
              ⚠️ You have {incoming.filter(r => r.status === 'pending').length} pending referral(s) waiting for your response.
            </div>
          )}
          {loading ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>Loading…</p>
            : incoming.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40, color: '#9ca3af' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📥</div>
                <p>No incoming referrals yet.</p>
              </div>
            ) : incoming.map(r => <ReferralCard key={r.id} r={r} direction="in" />)
          }
        </div>
      )}

      {/* ── New Referral ── */}
      {tab === 'new' && (
        <div style={{ maxWidth: 520 }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 20 }}>
            Refer a member to another village. Both you and the receiving village must consent before any records are shared.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Member <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select value={memberId} onChange={e => setMemberId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}>
                <option value="">Select a member…</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Receiving Village <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select value={receivingVillageId} onChange={e => setReceivingVillageId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}>
                <option value="">Select a village…</option>
                {villages.map(v => (
                  <option key={v.id} value={v.id}>{v.name}{v.city ? ` — ${v.city}, ${v.state}` : ''}</option>
                ))}
              </select>
              {villages.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 6 }}>
                  No partner villages yet. Contact support to establish a village partnership.
                </p>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Reason for Referral <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select value={reason} onChange={e => setReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.9rem' }}>
                <option value="">Select a reason…</option>
                <option value="relocation">Member relocating to new area</option>
                <option value="coverage_gap">Outside our service area</option>
                <option value="specialty_need">Needs specialty not available here</option>
                <option value="family_proximity">Moving closer to family</option>
                <option value="member_request">Member requested transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6, color: '#374151' }}>
                Additional Notes <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any care context the receiving village should know…"
                rows={4}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', fontSize: '0.8rem', color: '#92400e' }}>
              ⚠️ <strong>Privacy notice:</strong> Only name and care context (no medical records) will be shared with the receiving village. The member will be notified and must consent before transfer is completed.
            </div>

            <button onClick={submitReferral} disabled={submitting || !memberId || !receivingVillageId || !reason}
              style={{
                padding: '12px 0', border: 'none', borderRadius: 10,
                background: submitting || !memberId || !receivingVillageId || !reason ? '#e5e7eb' : '#6366f1',
                color: submitting || !memberId || !receivingVillageId || !reason ? '#9ca3af' : '#fff',
                fontWeight: 700, fontSize: '0.95rem',
                cursor: submitting || !memberId || !receivingVillageId || !reason ? 'default' : 'pointer',
              }}>
              {submitting ? 'Sending Referral…' : 'Send Referral →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
