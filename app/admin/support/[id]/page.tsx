'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

export default function AdminTicketDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<any>(null)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch(`/api/admin/support/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setTicket(d); setStatus(d.status); setNotes(d.admin_notes ?? '') } })
  }, [id])

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/support/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: notes }),
    })
    setSaving(false)
    setMsg(res.ok ? 'Saved ✓' : 'Error saving')
    setTimeout(() => setMsg(''), 3000)
  }

  if (!ticket) return <div style={{ padding: 48, textAlign: 'center', color: '#6b7280', fontFamily: 'system-ui' }}>Loading…</div>

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/admin/support" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← All Tickets</Link>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1f2937', margin: '12px 0 4px' }}>{ticket.subject}</h1>
      <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: 24 }}>
        {ticket.portal_type} · {ticket.category?.replace(/_/g, ' ')} · #{ticket.id.slice(0, 8)}
        · Submitted {new Date(ticket.created_at).toLocaleString()}
        {ticket.priority === 'urgent' && <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: 8 }}>⚡ URGENT</span>}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Description</h2>
        <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', margin: '0 0 16px' }}>Update Ticket</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Status</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'capitalize', fontWeight: status === s ? 700 : 400, background: status === s ? '#6366f1' : '#f3f4f6', color: status === s ? '#fff' : '#374151' }}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Internal Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Notes visible only to admins…"
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={save} disabled={saving}
            style={{ padding: '10px 24px', background: saving ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {msg && <span style={{ fontSize: '0.82rem', color: msg.includes('Error') ? '#ef4444' : '#16a34a', fontWeight: 600 }}>{msg}</span>}
        </div>
      </div>
    </div>
  )
}
