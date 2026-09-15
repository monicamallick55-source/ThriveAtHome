'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px',
  fontFamily: 'var(--font-body)', fontSize: '16px',
  border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none',
}

export default function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [landing, setLanding] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, full_name: fullName, password }),
      })
      const data = await res.json().catch(() => ({ error: 'Something went wrong' }))
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      // Auto sign-in with the credentials just used to create the account
      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: data.email,
        password,
      })
      if (signInErr) {
        // Fall back to manual login if auto sign-in fails
        setLanding(data.landing ?? '/dashboard')
        setTimeout(() => router.push('/login'), 2600)
        return
      }
      setLanding(data.landing ?? '/dashboard')
      setTimeout(() => router.push(data.landing ?? '/dashboard'), 800)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (landing) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
          Your account is ready
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Setting up your workspace…
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>Full name</label>
        <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" style={inputStyle} />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>Password</label>
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
      </div>
      {error && (
        <div role="alert" style={{ marginBottom: '16px', padding: '12px 14px', backgroundColor: '#FEF3C7', borderLeft: '3px solid #D97706', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '15px', color: '#78350F' }}>
          {error}
        </div>
      )}
      <button type="submit" disabled={loading}
        style={{ width: '100%', padding: '14px', fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, color: 'white', backgroundColor: loading ? '#8A9BB5' : 'var(--color-navy)', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
      <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--color-navy)', textDecoration: 'underline' }}>Sign in</Link>
      </p>
    </form>
  )
}
