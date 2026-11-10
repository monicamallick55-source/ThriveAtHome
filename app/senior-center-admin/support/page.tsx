'use client'
import { useState } from 'react'
import SupportWidget from '@/components/SupportWidget'

const CATEGORIES = [
  { value: 'member_mgmt',  label: '👥 Member management' },
  { value: 'billing',      label: '💳 Billing or invoicing' },
  { value: 'technical',    label: '🔧 Technical / portal issue' },
  { value: 'integration',  label: '🔗 Integration question' },
  { value: 'other',        label: '💬 Other' },
]
const PRIORITIES = [
  { value: 'low',    label: 'Low — not urgent' },
  { value: 'normal', label: 'Normal — within 24 hours' },
  { value: 'urgent', label: 'Urgent — blocking operations' },
]

export default function PortalSupportPage() {
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState('normal')
  const [subject, setSubject]   = useState('')
  const [message, setMessage]   = useState('')
  const [status, setStatus]     = useState<'idle'|'sending'|'sent'|'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, description: message, priority, portal_type: 'senior-center-admin' }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch { setStatus('error') }
  }

  if (status === 'sent') return (
    <div style={{ maxWidth: 600, margin: '64px auto', padding: '0 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>Ticket submitted</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Our partner team responds within {priority === 'urgent' ? '2 hours' : '24 hours'}.</p>
      <a href="/senior-center-admin" style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Back to portal</a>
    </div>
  )

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <a href="/senior-center-admin" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none' }}>← Back to portal</a>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, marginTop: 20, alignItems: 'start' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>Submit a support ticket</h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 24px' }}>Our partner success team responds within 24 hours (urgent: 2 hours).</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', background: '#fff' }}>
                <option value="">Select a category…</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Priority</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITIES.map(p => (
                  <label key={p.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', fontSize: '0.78rem', border: priority === p.value ? '2px solid #6366f1' : '1px solid #e5e7eb', background: priority === p.value ? '#eef2ff' : '#fff', fontWeight: priority === p.value ? 600 : 400 }}>
                    <input type="radio" name="priority" value={p.value} checked={priority === p.value} onChange={() => setPriority(p.value)} style={{ accentColor: '#6366f1' }} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Subject</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="Brief description"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Details</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={5} placeholder="Describe the issue in detail…"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>Something went wrong. Please try again.</p>}
            <button type="submit" disabled={status === 'sending'}
              style={{ padding: '12px 24px', background: status === 'sending' ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
              {status === 'sending' ? 'Submitting…' : 'Submit ticket'}
            </button>
          </form>
        </div>
        <div style={{ position: 'sticky', top: 24 }}><SupportWidget variant="b2b" /></div>
      </div>
    </div>
  )
}
