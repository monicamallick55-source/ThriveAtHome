'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [plan, setPlan] = useState<string | null>(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPlan(params.get('plan'))
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error || 'Signup failed. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
  }

  if (submitted) return (
    <div style={{ maxWidth: 440, margin: '80px auto', padding: '0 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📬</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1f2937' }}>Check your email</h1>
      <p style={{ color: '#6b7280' }}>We sent a confirmation link to <strong>{email}</strong>.</p>
      <Link href="/login" style={{ display: 'inline-block', marginTop: 20, color: '#6366f1', fontSize: '0.875rem' }}>Back to login</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 440, margin: '64px auto', padding: '0 16px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>Create your account</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: 28 }}>Join Thrive@Home and start living with confidence.</p>

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Full name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Smith"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@example.com"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters"
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', boxSizing: 'border-box' }} />
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={!email || !password || !name}
          style={{ padding: '12px 24px', background: !email || !password || !name ? '#e5e7eb' : '#6366f1', color: !email || !password || !name ? '#9ca3af' : '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
          {plan ? 'Continue to Payment' : 'Create account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#6b7280', margin: 0 }}>
          Already have an account? <Link href="/login" style={{ color: '#6366f1', fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </div>
  )
}
