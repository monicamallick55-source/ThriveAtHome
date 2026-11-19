'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash on load
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
      else setError('Reset link is invalid or has expired. Please request a new one.')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '48px 40px', boxShadow: 'var(--shadow-card)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 500, color: 'var(--color-navy)', marginBottom: '12px' }}>
          Choose a new password
        </h1>
        {!ready && error ? (
          <div>
            <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '18px', color: 'var(--color-urgent-text)', backgroundColor: 'var(--color-urgent)', padding: '16px', borderRadius: 'var(--radius-md)' }}>⚠ {error}</p>
            <a href="/forgot-password" style={{ display: 'inline-block', marginTop: '20px', fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-navy-light)' }}>Request a new reset link</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="password" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-navy)' }}>New password</label>
              <input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ width: '100%', height: '52px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '0 16px', fontFamily: 'var(--font-body)', fontSize: '17px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="confirm" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', fontWeight: 500, color: 'var(--color-navy)' }}>Confirm password</label>
              <input id="confirm" type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same password again" style={{ width: '100%', height: '52px', border: '1.5px solid var(--color-warm-grey)', borderRadius: 'var(--radius-md)', padding: '0 16px', fontFamily: 'var(--font-body)', fontSize: '17px', boxSizing: 'border-box' }} />
            </div>
            {error && <p role="alert" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--color-urgent-text)', backgroundColor: 'var(--color-urgent)', padding: '12px 16px', borderRadius: 'var(--radius-md)', margin: 0 }}>⚠ {error}</p>}
            <button type="submit" disabled={loading || !ready} style={{ width: '100%', height: '56px', backgroundColor: 'var(--color-navy)', color: 'white', fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: 500, border: 'none', borderRadius: 'var(--radius-md)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
