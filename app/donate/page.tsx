'use client'
import { useState } from 'react'

const AMOUNTS = [25, 50, 100, 250, 500]

export default function DonatePage() {
  const [amount, setAmount] = useState(50)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'sent'|'error'>('idle')

  const finalAmount = custom ? parseInt(custom) || 0 : amount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (finalAmount < 1) return
    setStatus('sending')
    await new Promise(r => setTimeout(r, 800)) // Stripe redirect in production
    setStatus('sent')
  }

  if (status === 'sent') return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: '0 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>💙</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937', margin: '0 0 12px' }}>Thank you!</h1>
      <p style={{ color: '#6b7280', lineHeight: 1.7 }}>Your donation of <strong>${finalAmount}</strong> helps seniors live with independence and dignity. A receipt will be emailed to you.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', margin: '0 0 6px' }}>Support ThriveAtHome</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 6px', lineHeight: 1.6 }}>
        Your gift helps seniors stay safe, connected, and independent at home.
      </p>
      <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 28px', fontStyle: 'italic' }}>
        ⚠️ Donations to ThriveAtHome are not tax-deductible. ThriveAtHome is a for-profit public benefit company.
      </p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 10 }}>Select an amount</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AMOUNTS.map(a => (
              <button key={a} type="button" onClick={() => { setAmount(a); setCustom('') }}
                style={{ padding: '9px 18px', borderRadius: 8, border: amount === a && !custom ? '2px solid #6366f1' : '1px solid #e5e7eb', background: amount === a && !custom ? '#eff6ff' : '#fff', color: amount === a && !custom ? '#4f46e5' : '#374151', fontWeight: amount === a && !custom ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer' }}>
                ${a}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Custom amount" value={custom} onChange={e => setCustom(e.target.value)}
            style={{ marginTop: 10, width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Your name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Full name"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Email address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" disabled={status === 'sending' || finalAmount < 1}
          style={{ padding: '13px 24px', background: status === 'sending' ? '#a5b4fc' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '1rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
          {status === 'sending' ? 'Processing…' : `Donate $${finalAmount}`}
        </button>
      </form>
    </div>
  )
}
