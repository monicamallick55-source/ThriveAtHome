'use client'

/**
 * app/admin/grief-circles/page.tsx — G4.4 Grief Circles (navigator/staff admin)
 *
 * Navigator creates circles, invites members, tracks status.
 */

import { useState, useEffect } from 'react'

type Circle = {
  id: string
  name: string
  loss_type: string
  format: string
  schedule_text?: string
  status: string
  max_members: number
  next_session_at?: string
  grief_circle_members: { id: string; member_id: string; status: string }[]
}

const LOSS_TYPES = ['general','spouse','parent','child','sibling','friend','pet']
const FORMATS = ['virtual','in_person','hybrid']
const STATUS_COLOR: Record<string, string> = {
  forming: '#f59e0b', active: '#10b981', paused: '#6b7280', closed: '#ef4444',
}

const BLANK = {
  name: '', loss_type: 'general', format: 'virtual',
  schedule_text: '', max_members: 8, is_private: true,
  next_session_at: '', description: '',
}

export default function AdminGriefCirclesPage() {
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...BLANK })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [inviteMemberId, setInviteMemberId] = useState('')
  const [inviteCircleId, setInviteCircleId] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  useEffect(() => { loadCircles() }, [])

  async function loadCircles() {
    setLoading(true)
    const res = await fetch('/api/grief-circles')
    const data = await res.json()
    setCircles(data.circles ?? [])
    setLoading(false)
  }

  async function createCircle() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/grief-circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          max_members: Number(form.max_members),
          next_session_at: form.next_session_at || null,
          schedule_text: form.schedule_text || null,
          description: form.description || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCircles((prev) => [data.circle, ...prev])
      setShowForm(false)
      setForm({ ...BLANK })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(circleId: string, status: string) {
    await fetch(`/api/grief-circles/${circleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setCircles((prev) => prev.map((c) => c.id === circleId ? { ...c, status } : c))
  }

  async function inviteMember(circleId: string) {
    if (!inviteMemberId.trim()) return
    setInviting(true)
    setError('')
    try {
      const res = await fetch(`/api/grief-circles/${circleId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: inviteMemberId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInviteCircleId(null)
      setInviteMemberId('')
      loadCircles()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setInviting(false)
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Grief Circles</h1>
          <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.875rem' }}>Facilitated support groups — navigator-invite only</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          + New circle
        </button>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12, marginBottom: 16, color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{ border: '2px solid #6366f1', borderRadius: 14, padding: 20, marginBottom: 24 }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 16 }}>New grief circle</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Circle name *</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Wednesday Grief Support"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Loss type</label>
              <select value={form.loss_type} onChange={(e) => setForm((p) => ({ ...p, loss_type: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                {LOSS_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Format</label>
              <select value={form.format} onChange={(e) => setForm((p) => ({ ...p, format: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
                {FORMATS.map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Schedule</label>
              <input value={form.schedule_text} onChange={(e) => setForm((p) => ({ ...p, schedule_text: e.target.value }))}
                placeholder="Every Tuesday 2pm PT"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Max members</label>
              <input type="number" min={2} max={12} value={form.max_members}
                onChange={(e) => setForm((p) => ({ ...p, max_members: Number(e.target.value) }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowForm(false); setForm({ ...BLANK }) }}
              style={{ flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={createCircle} disabled={!form.name || saving}
              style={{ flex: 2, padding: '10px', background: form.name ? '#6366f1' : '#e5e7eb', color: form.name ? '#fff' : '#9ca3af', border: 'none', borderRadius: 8, fontWeight: 600, cursor: form.name ? 'pointer' : 'default' }}>
              {saving ? 'Creating…' : 'Create circle'}
            </button>
          </div>
        </div>
      )}

      {/* Circle list */}
      {loading ? (
        <p style={{ color: '#9ca3af' }}>Loading…</p>
      ) : circles.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', paddingTop: 32 }}>No grief circles yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {circles.map((circle) => {
            const memberCount = circle.grief_circle_members?.filter((m) => m.status === 'active').length ?? 0
            return (
              <div key={circle.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 18, borderLeft: `4px solid ${STATUS_COLOR[circle.status] ?? '#e5e7eb'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>{circle.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 2 }}>
                      {circle.loss_type} · {circle.format.replace('_', ' ')} · {memberCount}/{circle.max_members} active
                      {circle.schedule_text ? ` · ${circle.schedule_text}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: (STATUS_COLOR[circle.status] ?? '#9ca3af') + '20', color: STATUS_COLOR[circle.status] ?? '#9ca3af' }}>
                      {circle.status}
                    </span>
                    <select
                      value={circle.status}
                      onChange={(e) => updateStatus(circle.id, e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '3px 6px', borderRadius: 6, border: '1px solid #d1d5db' }}>
                      <option value="forming">forming</option>
                      <option value="active">active</option>
                      <option value="paused">paused</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>

                {/* Invite member */}
                {inviteCircleId === circle.id ? (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <input
                      value={inviteMemberId}
                      onChange={(e) => setInviteMemberId(e.target.value)}
                      placeholder="Member UUID"
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: '0.85rem' }}
                    />
                    <button onClick={() => inviteMember(circle.id)} disabled={inviting}
                      style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                      {inviting ? '…' : 'Invite'}
                    </button>
                    <button onClick={() => { setInviteCircleId(null); setInviteMemberId('') }}
                      style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setInviteCircleId(circle.id)}
                    style={{ marginTop: 10, padding: '5px 12px', border: '1px solid #6366f1', color: '#6366f1', background: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    + Invite member
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
