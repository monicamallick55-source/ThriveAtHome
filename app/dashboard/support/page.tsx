'use client'
import { useState } from 'react'
const CATEGORIES = [
  { value: 'billing', label: '💳 Billing or payment question' },
  { value: 'account', label: '👤 Account or login issue' },
  { value: 'aria', label: '📞 Aria call question' },
  { value: 'technical', label: '🔧 Technical problem' },
  { value: 'care', label: '💙 Care or navigation question' },
  { value: 'other', label: '💬 Something else' },
]
export default function MemberSupportPage() {
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')
  const [error, setError] = useState('')
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !subject.trim() || !message.trim()) { setError('Please fill in all fields.'); return }
    setError(''); setStatus('sending')
    try {
      const res = await fetch('/api/support/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, subject, description: message, portal_type: 'member' }) })
      if (!res.ok) throw new Error('Failed')
      setStatus('sent')
    } catch { setStatus('error') }
  }
  if (status === 'sent') return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>Request received</h1>
      <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>We'll follow up within 24 hours. For urgent help call Quinn 24/7: <strong>{process.env.NEXT_PUBLIC_PHONE_QUINN ?? '1-800-TAH-24HR'}</strong>.</p>
      <a href="/dashboard" style={{ display: 'inline-block', padding: '10px 24px', background: '#6366f1', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Back to dashboard</a>
    </div>
  )
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px', fontFamily: 'system-ui, sans-serif' }}>
      <a href="/dashboard" style={{ fontSize: '0.82rem', color: '#6b7280', textDecoration: 'none', marginBottom: 24, display: 'inline-block' }}>← Back to dashboard</a>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>Submit a request</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 28px' }}>We'll respond within 24 hours. Need help now? <a href={`tel:${(process.env.NEXT_PUBLIC_PHONE_QUINN ?? '').replace(/[^0-9+]/g,'')}`} style={{ color: '#6366f1', fontWeight: 700 }}>Call Quinn 24/7</a></p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 8 }}>What's this about?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map(c => (
              <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: category === c.value ? '2px solid #6366f1' : '1px solid #e5e7eb', background: category === c.value ? '#eef2ff' : '#fff', fontSize: '0.875rem', color: '#1f2937', fontWeight: category === c.value ? 600 : 400 }}>
                <input type="radio" name="category" value={c.value} checked={category === c.value} onChange={() => setCategory(c.value)} style={{ accentColor: '#6366f1' }} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Details</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Tell us what's happening…" rows={5} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
        {status === 'error' && <p style={{ color: '#ef4444', fontSize: '0.82rem', margin: 0 }}>Something went wrong — please try again or call Quinn directly.</p>}
        <button type="submit" disabled={status === 'sending'} style={{ padding: '12px 24px', background: status === 'sending' ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
          {status === 'sending' ? 'Sending…' : 'Submit request'}
        </button>
      </form>
    </div>
  )
}
