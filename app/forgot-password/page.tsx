'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '48px 40px', boxShadow: 'var(--shadow-card)' }}>
        <Link href="/login" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
          ← Back to sign in
        </Link>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
          Reset your password
        </h1>
        {sent ? (
          <div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Check your email — we sent a password reset link to <strong>{email}</strong>.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-muted)', marginTop: '16px' }}>
              Didn't receive it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} style={{ background: 'none', border: 'none', color: 'var(--color-navy-light)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '16px', padding: 0, textDecoration: 'underline' }}>
                try again
              </button>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="email" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-navy)' }}>Email address</label>
              <input
                id="email" type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', height: '52px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '0 16px', fontFamily: 'var(--font-body)', fontSize: '17px', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            {error && <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)', backgroundColor: 'var(--color-urgent)', padding: '12px 16px', borderRadius: 'var(--radius-md)', margin: 0 }}>⚠ {error}</p>}
            <button type="submit" disabled={loading} style={{ width: '100%', height: '56px', backgroundColor: 'var(--color-navy)', color: 'white', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, border: 'none', borderRadius: 'var(--radius-md)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
