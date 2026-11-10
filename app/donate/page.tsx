'use client'
import { useState } from 'react'

const AMOUNTS = [25, 50, 100, 250, 500]

export default function DonatePage() {
  const [amount, setAmount] = useState(50)
  const [custom, setCustom] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const finalAmount = custom ? parseInt(custom) || 0 : amount

  if (submitted) return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>💚</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1f2937' }}>Thank you!</h1>
      <p style={{ color: '#6b7280' }}>Your donation of ${finalAmount} supports seniors in our community.</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>Support Thrive@Home</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: 28 }}>Help seniors live independently with dignity and connection.</p>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 10 }}>Select amount</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AMOUNTS.map(a => (
              <button key={a} onClick={() => { setAmount(a); setCustom('') }}
                style={{ padding: '8px 18px', borderRadius: 8, border: amount === a && !custom ? '2px solid #6366f1' : '1px solid #e5e7eb', background: amount === a && !custom ? '#eff6ff' : '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                ${a}
              </button>
            ))}
          </div>
          <input type="number" placeholder="Custom amount" value={custom} onChange={e => setCustom(e.target.value)}
            style={{ marginTop: 10, width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Your name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0 }}>
          Thrive@Home is not a registered 501(c)(3). Donations are not tax-deductible.
        </p>

        <button onClick={() => setSubmitted(true)} disabled={!finalAmount || !name || !email}
          style={{ padding: '12px 24px', background: !finalAmount || !name || !email ? '#e5e7eb' : '#6366f1', color: !finalAmount || !name || !email ? '#9ca3af' : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: !finalAmount || !name || !email ? 'not-allowed' : 'pointer' }}>
          Donate ${finalAmount || '—'}
        </button>
      </div>
    </div>
  )
}
