'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/employer-admin/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, full_name: fullName, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'var(--color-navy)', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-cream)', textDecoration: 'none', fontWeight: 500 }}>
          ThriveAtHome
        </Link>
      </nav>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', maxWidth: '440px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
                Account created!
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                Create your account
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-text-secondary)', marginBottom: '28px', lineHeight: 1.6 }}>
                Your employer has included ThriveAtHome in your benefits — daily check-in calls and care coordination for your aging loved ones.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '16px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 600, color: 'var(--color-navy)', marginBottom: '6px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: 'var(--font-body)', fontSize: '16px', border: '1.5px solid #D4CFC8', borderRadius: '8px', outline: 'none' }}
                  />
                </div>
                {error && (
                  <div style={{ marginBottom: '16px', padding: '12px 14px', backgroundColor: '#FEF3C7', borderLeft: '3px solid #D97706', borderRadius: '6px', fontFamily: 'var(--font-body)', fontSize: '15px', color: '#78350F' }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '14px', fontFamily: 'var(--font-body)', fontSize: '17px', fontWeight: 600, color: 'white', backgroundColor: loading ? '#8A9BB5' : 'var(--color-navy)', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>
              <p style={{ marginTop: '16px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--color-navy)', textDecoration: 'underline' }}>Sign in</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
